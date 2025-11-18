<template>
  <div class="video-table-container">
    <el-table
      ref="tableRef"
      :data="videos"
      :loading="loading"
      border
      height="100%"
      row-key="basicId"
      @selection-change="handleSelectionChange"
    >
      <!-- 镜号列（包含选择框） -->
      <el-table-column prop="basicId" label="镜号" width="140" align="center" fixed="left">
        <template #default="{ row, $index }">
          <div class="shot-number-cell">
            <!-- 选择框 -->
            <el-checkbox :model-value="isSelected(row.basicId)" @change="handleCheckboxChange(row)" @click.stop />
            <ShotNumberActions
              :shot-number="$index + 1"
              :scene-status="row.sceneStatus"
              @comment="(event) => handleShotComment(row, event)"
              @insert="handleShotInsert(row)"
              @review="(event) => handleShotReview(row, event)"
              @delete="handleShotDelete(row)"
              @view-comments="handleViewComments(row)"
            />
            <span class="shot-number-text">{{ $index + 1 }}</span>
            <!-- 留言数量显示 -->
            <div
              v-if="row.commentCount && row.commentCount > 0"
              class="comment-count-badge"
              @click.stop="(event) => handleViewComments(row, event)"
            >
              <svg-icon icon-class="fy-comment" class="comment-icon" />
              <span class="count-text">{{ row.commentCount }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 画面列（视频） -->
      <el-table-column label="画面" :width="getVideoColumnWidth()" align="center" fixed="left">
        <template #default="{ row }">
          <VideoCell :video="row" :aspect-ratio="aspectRatio" :model-config="modelConfig" @refresh="handleRefresh" />
        </template>
      </el-table-column>

      <!-- 画面描述列 -->
      <el-table-column label="画面描述" min-width="400">
        <template #default="{ row }">
          <div class="scene-desc-cell">
            <div v-if="row.sceneDesc" class="desc-section">
              <div class="desc-label">镜头：</div>
              <div class="desc-text">{{ row.sceneDesc }}</div>
            </div>
            <div v-if="row.dialogues" class="desc-section">
              <div class="desc-label">台词：</div>
              <div class="hint-text">{{ row.dialogues }}</div>
            </div>
            <div v-if="!row.sceneDesc && !row.dialogues" class="empty-text">暂无描述</div>
          </div>
        </template>
      </el-table-column>

      <!-- 视频提示词列 -->
      <el-table-column label="视频提示词" min-width="350">
        <template #default="{ row }">
          <VideoPromptCell
            :video="row"
            :model-config="modelConfig"
            :all-model-configs="allModelConfigs"
            :model-configs="modelConfigs"
            @update="handleVideoPromptUpdate"
            @generate="handleRefresh"
          />
        </template>
      </el-table-column>

      <!-- 生成视频列 -->
      <el-table-column label="生成视频" :width="getGeneratedVideoColumnWidth()" align="center">
        <template #default="{ row }">
          <VideoListCell :video="row" :aspect-ratio="aspectRatio" @refresh="handleRefresh" />
        </template>
      </el-table-column>
    </el-table>

    <!-- 留言弹窗 -->
    <CommentDialog
      v-model="commentDialogVisible"
      :basic-id="currentVideoForAction?.basicId || 0"
      :scene-type="2"
      :trigger-ref="commentTriggerRef"
      @success="handleCommentSuccess"
    />

    <!-- 留言列表弹窗 -->
    <CommentListDialog
      v-model="commentListDialogVisible"
      :basic-id="currentVideoForAction?.basicId || 0"
      :scene-type="2"
      :trigger-ref="commentListTriggerRef"
      @change="handleCommentChange"
    />

    <!-- 评审弹窗 -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :basic-id="currentVideoForAction?.basicId || 0"
      :scene-type="2"
      :trigger-ref="reviewTriggerRef"
      @success="handleReviewSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { editVideoPrompt } from '@/api/workbench/episode';
  import type { VideoSceneItemInfo } from '@/api/workbench/episode/types';
  import { addScene, deleteScene } from '@/api/workbench/storyboard';
  import type { ElTable } from 'element-plus';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, nextTick, ref } from 'vue';
  import CommentDialog from '../../StepShotList/components/CommentDialog.vue';
  import CommentListDialog from '../../StepShotList/components/CommentListDialog.vue';
  import ReviewDialog from '../../StepShotList/components/ReviewDialog.vue';
  import ShotNumberActions from '../../StepShotList/components/ShotNumberActions.vue';
  import VideoCell from './VideoCell.vue';
  import VideoListCell from './VideoListCell.vue';
  import VideoPromptCell from './VideoPromptCell.vue';

  import type { VideoModelConfigVo } from '@/api/workbench/episode/types';

  interface Props {
    videos: VideoSceneItemInfo[];
    loading?: boolean;
    selectedIds?: number[];
    modelConfig?: {
      modelCode: string;
      modelName: string;
      resolution: string;
      duration: number;
      points: number;
    } | null;
    allModelConfigs?: Array<{
      resolution: string;
      duration: number;
      points: number;
    }>;
    modelConfigs?: VideoModelConfigVo[];
    aspectRatio?: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    selectedIds: () => [],
    modelConfig: null,
    allModelConfigs: () => [],
    modelConfigs: () => [],
    aspectRatio: '16:9'
  });

  const emit = defineEmits<{
    (e: 'selection-change', ids: number[]): void;
    (e: 'generate-video', basicIds: number[]): void;
    (e: 'refresh'): void;
  }>();

  // 表格 ref
  const tableRef = ref<InstanceType<typeof ElTable>>();

  // 弹窗相关状态
  const commentDialogVisible = ref(false);
  const commentListDialogVisible = ref(false);
  const reviewDialogVisible = ref(false);
  const currentVideoForAction = ref<VideoSceneItemInfo | null>(null);
  const commentTriggerRef = ref<HTMLElement>();
  const commentListTriggerRef = ref<HTMLElement>();
  const reviewTriggerRef = ref<HTMLElement>();

  // 当前选中的 ID 集合（用于本地状态管理）
  const selectedIdsSet = computed(() => new Set(props.selectedIds));

  // 判断某一行是否被选中
  const isSelected = (basicId: number | undefined) => {
    if (!basicId) return false;
    return selectedIdsSet.value.has(basicId);
  };

  // 处理复选框变化
  const handleCheckboxChange = (row: VideoSceneItemInfo) => {
    if (!row.basicId) return;

    const currentSelected = isSelected(row.basicId);
    const newSelectedIds = new Set(props.selectedIds);

    if (currentSelected) {
      newSelectedIds.delete(row.basicId);
    } else {
      newSelectedIds.add(row.basicId);
    }

    emit('selection-change', Array.from(newSelectedIds));
  };

  // 选择变化（保留用于兼容性）
  const handleSelectionChange = (selection: VideoSceneItemInfo[]) => {
    const ids = selection.map((item) => item.basicId).filter((id): id is number => id !== undefined);
    emit('selection-change', ids);
  };

  // 刷新
  const handleRefresh = () => {
    emit('refresh');
  };

  // 更新视频提示词
  const handleVideoPromptUpdate = async (basicId: number, videoPrompt: string) => {
    try {
      await editVideoPrompt({ basicId, videoPrompt });
      ElMessage.success('更新成功');
      emit('refresh');
    } catch (error) {
      console.error('更新视频提示词失败:', error);
      ElMessage.error('更新失败');
    }
  };

  // ==================== 镜号操作功能 ====================

  // 留言
  const handleShotComment = (video: VideoSceneItemInfo, event?: MouseEvent) => {
    if (!video.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }
    currentVideoForAction.value = video;
    if (event) {
      commentTriggerRef.value = event.currentTarget as HTMLElement;
    }
    commentDialogVisible.value = true;
  };

  // 留言成功
  const handleCommentSuccess = () => {
    emit('refresh');
  };

  // 查看留言列表
  const handleViewComments = (video: VideoSceneItemInfo, event?: MouseEvent) => {
    if (!video.basicId) {
      ElMessage.warning('该镜头暂无基础信息，无法查看留言');
      return;
    }
    // 检查是否有评论
    if (!video.commentCount || video.commentCount <= 0) {
      ElMessage.info('暂无留言');
      return;
    }

    // 先更新当前操作的视频和触发元素
    currentVideoForAction.value = video;
    if (event) {
      commentListTriggerRef.value = event.currentTarget as HTMLElement;
    }

    // 如果弹窗已经打开，先关闭再立即打开（触发重新加载）
    if (commentListDialogVisible.value) {
      commentListDialogVisible.value = false;
      // 使用 nextTick 确保状态更新后再打开
      nextTick(() => {
        commentListDialogVisible.value = true;
      });
    } else {
      commentListDialogVisible.value = true;
    }
  };

  // 留言数量变化
  const handleCommentChange = () => {
    emit('refresh');
  };

  // 插入镜头
  const handleShotInsert = async (video: VideoSceneItemInfo) => {
    if (!video.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    try {
      await ElMessageBox.confirm('确定要在此镜头后插入新镜头吗？', '插入镜头', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      });

      await addScene({
        preBasicId: video.basicId,
        sceneType: 2 // 2-视频
      });

      ElMessage.success('插入镜头成功');
      emit('refresh');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('插入镜头失败:', error);
        ElMessage.error('插入镜头失败，请重试');
      }
    }
  };

  // 评审
  const handleShotReview = (video: VideoSceneItemInfo, event?: MouseEvent) => {
    if (!video.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    // 检查是否可以评审（只有橙色、红色、绿色状态才能评审）
    if (video.sceneStatus !== 1 && video.sceneStatus !== 2 && video.sceneStatus !== 3) {
      ElMessage.warning('只能对橙色、红色、绿色状态的镜头进行评审');
      return;
    }

    currentVideoForAction.value = video;
    if (event) {
      reviewTriggerRef.value = event.currentTarget as HTMLElement;
    }
    reviewDialogVisible.value = true;
  };

  // 评审成功
  const handleReviewSuccess = (reviewType: number) => {
    // 无感刷新：直接更新当前镜头的状态，不重新加载整个列表
    if (currentVideoForAction.value) {
      // reviewType: 1-通过(绿色) 2-待修改(红色)
      currentVideoForAction.value.sceneStatus = reviewType === 1 ? 2 : 3;
    }
  };

  // 删除镜头
  const handleShotDelete = async (video: VideoSceneItemInfo) => {
    if (!video.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    try {
      await ElMessageBox.confirm(`确定要删除该镜头吗？此操作不可恢复。`, '删除镜头', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      await deleteScene([video.basicId]);
      ElMessage.success('删除镜头成功');
      emit('refresh');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除镜头失败:', error);
        ElMessage.error('删除镜头失败，请重试');
      }
    }
  };

  // 计算画面列宽度 - 根据宽高比动态计算
  const getVideoColumnWidth = () => {
    // 固定高度为 190px (视频高度)
    const videoHeight = 190;

    // 根据宽高比计算宽度
    const ratioMap: Record<string, number> = {
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '3:4': 3 / 4
    };

    const ratio = ratioMap[props.aspectRatio] || 16 / 9;
    const videoWidth = videoHeight * ratio;

    // 列宽 = 视频宽度
    return Math.ceil(videoWidth);
  };

  // 计算生成视频列宽度 - 可以显示两个视频 + 更多按钮空间
  const getGeneratedVideoColumnWidth = () => {
    const singleVideoWidth = getVideoColumnWidth();
    // 宽度 = 单个视频宽度 * 2 + 70px（更多按钮和间距）
    return singleVideoWidth * 2 + 70;
  };
</script>

<style scoped lang="scss">
  :deep(.el-checkbox__inner::after) {
    height: 9px;
    left: 6px;
  }
  .video-table-container {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .shot-number-cell {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;

      .shot-number-text {
        font-size: 14px;
        color: #4e5969;
        display: flex;
        width: 40px;
        height: 40px;
        padding-right: 0.008px;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        border-radius: 8px;
        background: #f7f8fa;
      }

      // 留言数量徽标
      .comment-count-badge {
        position: absolute;
        left: 0px;
        bottom: 0px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s;
        z-index: 10;
        width: 24px;
        height: 24px;
        border-radius: 5px;
        background: #fff;

        &:hover {
          transform: scale(1.05);
        }

        .comment-icon {
          font-size: 12px;
          width: 12px;
          height: 12px;
          color: #5252ff;
        }

        .count-text {
          position: absolute;
          left: 12px;
          top: -12px;
          display: flex;
          width: 20px;
          height: 20px;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #5252ff;
          color: #fff;
          font-size: 12px;
          line-height: 20px;
        }
      }
    }

    .scene-desc-cell {
      padding: 8px;
      line-height: 1.6;

      .desc-section {
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .desc-label {
          color: #1d2129;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .desc-text {
          color: #4e5969;
          font-size: 13px;
          line-height: 1.5;
        }

        .hint-text {
          color: #4e5969;
          font-size: 13px;
          line-height: 1.5;
        }
      }

      .empty-text {
        color: #86909c;
        font-size: 12px;
      }
    }
  }
  // 其他列单元格样式 - 固定高度190px，内容超出滚动或省略
  :deep(.el-table__body .el-table__row) {
    height: 190px !important;
    background-color: #fff;
    transition: background-color 0.2s ease;

    &:hover {
      > td {
        background-color: #f3f3ff !important;
      }
    }
  }
  :deep(.el-table__body .el-table__row .el-table__cell) {
    height: 190px !important;
    vertical-align: middle;
    overflow: hidden;
    background-color: #fff;
  }
  // 画面列单元格样式 - 完全移除padding，视频铺满
  :deep(.el-table__body .el-table__row .el-table__cell:has(.video-cell)) {
    padding: 0 !important;
    cursor: pointer;
    height: 190px !important;
    vertical-align: middle;
    overflow: hidden;
    isolation: isolate; // 创建新的层叠上下文，防止hover-overlay溢出到其他列

    .cell {
      padding: 0 !important;
      height: 100%;
    }
  }
  // 生成视频列单元格样式 - 完全移除padding
  :deep(.el-table__body .el-table__row .el-table__cell:has(.video-list-cell)) {
    padding: 0 !important;
    height: 190px !important;
    vertical-align: middle;
    overflow: visible; // 允许"查看更多"按钮显示在单元格外

    .cell {
      padding: 0 !important;
      height: 100%;
      overflow: visible; // 允许按钮显示
    }
  }
  // Fixed列在hover时也需要改变背景色
  :deep(.el-table__fixed) {
    .el-table__body .el-table__row:hover .el-table__cell {
      background-color: #f3f3ff !important;
    }
  }

  :deep(.el-table__fixed-right) {
    .el-table__body .el-table__row:hover .el-table__cell {
      background-color: #f3f3ff !important;
    }
  }
  // 镜号列样式
  .shot-number-cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    width: 100%;
    height: 100%;
    min-height: 160px; // 确保高度充足

    // 复选框样式
    :deep(.el-checkbox) {
      margin-right: 4px;

      .el-checkbox__inner {
        width: 16px;
        height: 16px;
        border-radius: 4px;
      }

      .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: #5252ff;
        border-color: #5252ff;
      }
    }
  }

  // 镜号列单元格hover效果（镜号列现在是第一列，包含了选择框）
  :deep(.el-table__body .el-table__row .el-table__cell:first-child) {
    overflow: visible !important;
    position: relative;

    .cell {
      overflow: visible !important;
    }

    &:hover {
      z-index: 10;

      .shot-number-actions {
        .action-menu {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
      }
    }
  }
</style>
