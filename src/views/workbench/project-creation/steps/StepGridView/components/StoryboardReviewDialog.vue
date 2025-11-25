<template>
  <el-dialog
    v-model="visible"
    title="审阅"
    width="1200px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <!-- 审阅状态标识 -->
    <div
      v-if="currentReviewStatus === 2 || currentReviewStatus === 3"
      class="review-status-overlay"
      :class="currentReviewStatus === 2 ? 'success' : 'rejected'"
    >
      <div class="status-bg"></div>
      <svg-icon :icon-class="currentReviewStatus === 2 ? 'fy-success' : 'fy-refuse'" class="status-icon" />
    </div>
    <div class="dialog-wrapper">
      <div class="review-dialog-container">
        <!-- 左侧：图片展示区 -->
        <div class="left-section">
          <!-- 图片导航和显示 -->
          <div class="image-display-section">
            <!-- 图片容器 -->
            <div class="image-container">
              <!-- 图片序号显示 -->

              <!-- 图片/视频主体 -->
              <div class="image-wrapper">
                <!-- 视频审阅：显示视频播放器 -->
                <video
                  v-if="props.sceneType === 2 && currentScene?.originOssUrl"
                  :src="currentScene.originOssUrl"
                  :poster="currentScene.previewOssUrl"
                  controls
                  class="main-video"
                  :style="{ width: `${imageWrapperSize.width}px`, height: `${imageWrapperSize.height}px` }"
                />
                <!-- 图片审阅：显示图片 -->
                <el-image
                  :style="{ width: `${imageWrapperSize.width}px`, height: `${imageWrapperSize.height}px` }"
                  v-else-if="props.sceneType === 1 && (currentScene?.previewOssUrl || currentScene?.originOssUrl)"
                  :src="currentScene.originOssUrl || currentScene.previewOssUrl"
                  fit="contain"
                  class="main-image"
                  :preview-src-list="[currentScene.originOssUrl || currentScene.previewOssUrl]"
                  preview-teleported
                  hide-on-click-modal
                />
                <!-- 空状态 -->
                <div v-else class="empty-image">
                  <img src="../../../../../../assets/images/no-sence.png" alt="暂无内容" class="placeholder-img" />
                </div>
              </div>

              <!-- 左右切换箭头 -->
              <div class="navigation-arrows">
                <div
                  class="arrow-button prev-button"
                  :class="{ disabled: currentIndex === 0 || loading }"
                  @click="!loading && currentIndex > 0 && handlePrevious()"
                >
                  <svg-icon icon-class="fy-arrow-left" />
                </div>
                <div class="image-pagination">{{ currentIndex + 1 }}/{{ sceneList.length }}</div>

                <div
                  class="arrow-button next-button"
                  :class="{ disabled: currentIndex === sceneList.length - 1 || loading }"
                  @click="!loading && currentIndex < sceneList.length - 1 && handleNext()"
                >
                  <svg-icon icon-class="fy-arrow-right" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：内容详情区 -->
        <div class="right-section">
          <!-- 固定的标题 -->
          <div class="details-header">
            <div class="details-title">内容详情</div>
          </div>

          <!-- 可滚动的内容详情 -->
          <div class="content-details">
            <!-- 中景描述 -->
            <div v-if="currentScene?.sceneDesc" class="detail-section">
              <div class="section-title">• 中景描述</div>
              <div class="section-content">
                {{ currentScene.sceneDesc }}
              </div>
            </div>

            <!-- 镜头提示 -->
            <div v-if="currentScene?.sceneHint" class="detail-section">
              <div class="section-title">• 镜头提示</div>
              <div class="section-content">{{ currentScene.sceneHint }}</div>
            </div>

            <!-- 台词 -->
            <div v-if="currentScene?.dialogues" class="detail-section">
              <div class="section-title">• 台词</div>
              <div class="section-content dialogue-content">{{ currentScene.dialogues }}</div>
            </div>
          </div>

          <!-- 固定在底部的评审留言 -->
          <div class="comment-section">
            <div class="comment-header">
              <div class="comment-title">评审留言</div>
              <div
                v-show="commentCount > 0"
                ref="commentTriggerElement"
                class="comment-count-trigger"
                :class="{ 'has-comments': commentCount > 0 }"
                @click="handleShowComments"
              >
                <svg-icon icon-class="fy-comment" class="comment-icon" />
                <span v-if="commentCount > 0" class="count-badge">{{ commentCount }}</span>
              </div>
            </div>

            <!-- 留言输入框 -->
            <div class="comment-input-section">
              <el-input
                v-model="commentText"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                resize="none"
                placeholder="请输入留言..."
                class="comment-textarea"
              />
              <el-button type="primary" :loading="submittingComment" @click="handleSubmitComment"> 提交留言 </el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 底部操作按钮 -->
      <div class="footer-actions">
        <el-button class="success-btn" :loading="submittingReview" @click="handlePass">
          <el-icon><CircleCheck /></el-icon>
          通过
        </el-button>
        <el-button class="failed-btn" type="danger" size="large" :loading="submittingReview" @click="handleReject">
          <el-icon><CircleClose /></el-icon>
          驳回
        </el-button>
      </div>
    </div>

    <!-- 留言列表弹窗 -->
    <CommentListDialog
      v-model="commentListDialogVisible"
      :basic-id="currentScene?.id || 0"
      :scene-type="props.sceneType"
      :trigger-ref="commentTriggerElement"
      :comment-list="commentList"
      @change="handleCommentListChange"
    />
  </el-dialog>
</template>

<script setup lang="ts">
  import { addSceneComment, getSceneCommentList, queryStoryBoard, reviewScene } from '@/api/workbench/storyboard';
  import type { SceneCommentVo, StoryBoardSceneVo } from '@/api/workbench/storyboard/types';
  import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';
  import CommentListDialog from '../../StepShotList/components/CommentListDialog.vue';

  interface Props {
    modelValue: boolean;
    episodeId?: number; // 剧集ID
    sceneType?: 1 | 2; // 1-图片审阅, 2-视频审阅
    sceneStatusList?: number[]; // 场景状态列表（0-白色 1-橙色 2-绿色 3-红色）
    initialIndex?: number;
    pictureRatio?: number; // 尺寸比例 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
  }

  const props = withDefaults(defineProps<Props>(), {
    initialIndex: 0,
    sceneType: 1,
    sceneStatusList: () => [1], // 默认只加载橙色状态
    pictureRatio: 1 // 默认16:9
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'refresh'): void;
  }>();

  const visible = ref(false);
  const currentIndex = ref(0);
  const commentText = ref('');
  const commentList = ref<SceneCommentVo[]>([]);
  const submittingComment = ref(false);
  const submittingReview = ref(false);
  const loading = ref(false);

  // 场景列表
  const sceneList = ref<StoryBoardSceneVo[]>([]);

  // 留言列表弹窗
  const commentListDialogVisible = ref(false);
  const commentTriggerElement = ref<HTMLElement>();

  // 当前场景
  const currentScene = computed(() => sceneList.value[currentIndex.value]);

  // 当前审阅状态 - 支持图片(imgStatus)和视频(videoStatus)
  const currentReviewStatus = computed(() => {
    if (!currentScene.value) return undefined;
    // 根据 sceneType 选择对应的状态：1-图片审阅使用 imgStatus，2-视频审阅使用 videoStatus
    return props.sceneType === 2 ? currentScene.value.videoStatus : currentScene.value.imgStatus;
  });

  // 评论数量 - 使用场景数据中的 commentCnt
  const commentCount = computed(() => currentScene.value?.commentCnt || 0);

  // 根据比例计算图片容器尺寸（限定高度，计算宽度）
  const imageWrapperSize = computed(() => {
    const maxHeight = 396; // 固定高度
    let width = maxHeight;
    let height = maxHeight;

    // 根据 pictureRatio 计算实际宽度
    switch (props.pictureRatio) {
      case 1: // 16:9
        height = maxHeight;
        width = Math.round((maxHeight * 16) / 9);
        break;
      case 2: // 4:3
        height = maxHeight;
        width = Math.round((maxHeight * 4) / 3);
        break;
      case 3: // 1:1
        height = maxHeight;
        width = maxHeight;
        break;
      case 4: // 3:4
        height = maxHeight;
        width = Math.round((maxHeight * 3) / 4);
        break;
      case 5: // 9:16
        height = maxHeight;
        width = Math.round((maxHeight * 9) / 16);
        break;
      default:
        // 默认使用 1:1
        height = maxHeight;
        width = maxHeight;
    }

    return { width, height };
  });

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    async (val) => {
      visible.value = val;
      if (val) {
        // 打开弹窗时加载场景数据
        await loadScenes();
        currentIndex.value = props.initialIndex;
        loadComments();
      } else {
        resetDialog();
      }
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 监听当前索引变化，加载评论
  watch(currentIndex, () => {
    loadComments();
    commentText.value = '';
  });

  // 加载场景列表
  const loadScenes = async () => {
    if (!props.episodeId) {
      ElMessage.warning('请先选择剧集');
      visible.value = false;
      return;
    }

    loading.value = true;
    try {
      const res = await queryStoryBoard({
        episodeId: Number(props.episodeId),
        sceneType: props.sceneType,
        sceneStatusList: props.sceneStatusList
      });

      if (res.data && res.data.length > 0) {
        sceneList.value = res.data.map((scene) => ({
          ...scene,
          commentCnt: scene.commentCnt ?? 0
        }));
      } else {
        ElMessage.warning('暂无待审阅的场景');
        visible.value = false;
      }
    } catch (error) {
      console.error('加载场景失败:', error);
      ElMessage.error('加载待审阅场景失败');
      visible.value = false;
    } finally {
      loading.value = false;
    }
  };

  // 加载评论列表
  const loadComments = async () => {
    if (!currentScene.value?.id) {
      commentList.value = [];
      return;
    }

    try {
      const res = await getSceneCommentList({
        basicId: currentScene.value.id,
        sceneType: props.sceneType // 1-图片, 2-视频
      });
      commentList.value = res.data || [];

      // 注意：不在这里更新 commentCnt，因为接口可能只返回部分评论
      // commentCnt 应该使用接口返回的场景数据中的值
    } catch (error) {
      console.error('加载评论失败:', error);
      commentList.value = [];
    }
  };

  // 显示留言列表
  const handleShowComments = () => {
    commentListDialogVisible.value = true;
  };

  // 留言列表变化（评论被删除时）
  const handleCommentListChange = () => {
    loadComments();
    // 通知父组件刷新数据，以获取最新的 commentCnt
    emit('refresh');
  };

  // 提交留言
  const handleSubmitComment = async () => {
    if (!commentText.value.trim()) {
      ElMessage.warning('请输入留言内容');
      return;
    }

    if (!currentScene.value?.id) {
      ElMessage.error('场景信息不完整');
      return;
    }

    submittingComment.value = true;
    try {
      await addSceneComment({
        basicId: currentScene.value.id,
        comment: commentText.value.trim(),
        sceneType: props.sceneType // 1-图片, 2-视频
      });

      ElMessage.success('留言提交成功');
      commentText.value = '';

      // 立即更新评论数量，提供即时反馈
      const scene = sceneList.value[currentIndex.value];
      if (scene) {
        scene.commentCnt = (scene.commentCnt || 0) + 1;
      }

      // 重新加载评论列表，会自动同步实际的评论数量
      await loadComments();
    } catch (error) {
      console.error('提交留言失败:', error);
      ElMessage.error('提交留言失败，请重试');
    } finally {
      submittingComment.value = false;
    }
  };

  // 通过
  const handlePass = async () => {
    if (!currentScene.value?.id) {
      ElMessage.error('场景信息不完整');
      return;
    }

    submittingReview.value = true;
    try {
      await reviewScene({
        id: currentScene.value.id,
        reviewType: 1, // 1-通过
        sceneType: props.sceneType // 1-图片, 2-视频
      });

      ElMessage.success('审阅通过');

      // 更新本地状态
      const scene = sceneList.value[currentIndex.value];
      if (scene) {
        if (props.sceneType === 2) {
          scene.videoStatus = 2; // 2-绿色(通过)
        } else {
          scene.imgStatus = 2; // 2-绿色(通过)
        }
      }

      // 延迟展示状态，让用户看到审阅结果
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 如果还有下一个，自动切换到下一个
      if (currentIndex.value < sceneList.value.length - 1) {
        handleNext();
      } else {
        // 最后一个，关闭对话框
        // handleClose();
        // emit('refresh');
      }
    } catch (error) {
      console.error('审阅失败:', error);
    } finally {
      submittingReview.value = false;
    }
  };

  // 驳回
  const handleReject = async () => {
    if (!currentScene.value?.id) {
      ElMessage.error('场景信息不完整');
      return;
    }

    submittingReview.value = true;
    try {
      await reviewScene({
        id: currentScene.value.id,
        reviewType: 2, // 2-驳回
        sceneType: props.sceneType // 1-图片, 2-视频
      });

      ElMessage.success('已驳回');

      // 更新本地状态
      const scene = sceneList.value[currentIndex.value];
      if (scene) {
        if (props.sceneType === 2) {
          scene.videoStatus = 3; // 3-红色(驳回)
        } else {
          scene.imgStatus = 3; // 3-红色(驳回)
        }
      }

      // 延迟展示状态，让用户看到审阅结果
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 如果还有下一个，自动切换到下一个
      if (currentIndex.value < sceneList.value.length - 1) {
        handleNext();
      } else {
        // // 最后一个，关闭对话框
        // handleClose();
        // emit('refresh');
      }
    } catch (error) {
      console.error('审阅失败:', error);
    } finally {
      submittingReview.value = false;
    }
  };

  // 上一张
  const handlePrevious = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  };

  // 下一张
  const handleNext = () => {
    if (currentIndex.value < sceneList.value.length - 1) {
      currentIndex.value++;
    }
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
    emit('refresh');
  };

  // 重置对话框
  const resetDialog = () => {
    commentText.value = '';
    commentList.value = [];
    currentIndex.value = props.initialIndex;
  };
</script>

<style scoped lang="scss">
  .dialog-wrapper {
    position: relative;
    overflow: hidden;
  }

  // 审阅状态覆盖层（整个弹窗右上角）
  .review-status-overlay {
    position: absolute;
    top: 0;
    right: 0;
    width: 292px;
    height: 292px;
    pointer-events: none;
    display: flex;
    align-items: center;
    border-radius: 50%;
    z-index: 100;

    .status-bg {
      position: absolute;
      top: 0;
      right: 0;
      width: 292px;
      height: 292px;
      flex-shrink: 0;
      border-radius: 292px;
      filter: blur(48.05px);
    }

    .status-icon {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 98px;
      height: 98px;
      z-index: 1;
    }

    &.success .status-bg {
      background: linear-gradient(242deg, rgba(35, 195, 67, 0.12) 12.17%, rgba(255, 255, 255, 0.2) 107.39%);
    }

    &.rejected .status-bg {
      background: linear-gradient(242deg, rgba(255, 77, 79, 0.12) 12.17%, rgba(255, 255, 255, 0.2) 107.39%);
    }
  }

  .review-dialog-container {
    display: flex;

    // 左侧图片区域
    .left-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;

      .image-display-section {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 24px;

        .image-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;

          .image-pagination {
            color: #1d2129;
            font-size: 16px;
            font-style: normal;
            font-weight: 500;
            padding: 0 16px 0 16px;
          }

          .image-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f5f7fa;
            border-radius: 8px;
            padding: 20px;
            overflow: hidden;
            flex-shrink: 0;

            .main-image {
              max-width: 100%;
              max-height: 100%;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

              :deep(img) {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
            }

            .main-video {
              max-width: 100%;
              max-height: 100%;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              background: #000;
              object-fit: contain;
            }

            .empty-image {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              height: 100%;

              .placeholder-img {
                width: 200px;
                height: 200px;
                opacity: 0.3;
              }
            }
          }

          .navigation-arrows {
            display: flex;
            justify-content: center;
            align-items: center;

            .arrow-button {
              display: flex;
              width: 32px;
              height: 32px;
              justify-content: center;
              align-items: center;
              flex-shrink: 0;
              border-radius: 6px;
              border: 1px solid #eee;
              cursor: pointer;

              // &:hover:not(.disabled) {
              //   background: #f7f8fa;
              //   border-color: #c9cdd4;
              // }

              &.disabled {
                cursor: not-allowed;
                opacity: 0.4;
                background: #f7f8fa;
              }

              .el-icon {
                font-size: 16px;
                color: #4e5969;
              }
            }
          }
        }
      }
    }

    // 右侧内容区域
    .right-section {
      width: 460px;
      display: flex;
      flex-direction: column;
      background: #fff;
      overflow: hidden;
      border-left: 1px solid #e5e6eb;

      .details-header {
        flex-shrink: 0;
        padding: 0px 24px 0 24px;

        .details-title {
          font-size: 18px;
          font-weight: 600;
          color: #1d2129;
          margin-bottom: 20px;
        }
      }

      .content-details {
        flex: 1;
        overflow-y: auto;
        padding: 0 24px 24px 24px;

        .detail-section {
          margin-bottom: 20px;

          .section-title {
            font-size: 14px;
            font-weight: 500;
            color: #4e5969;
            margin-bottom: 8px;
          }

          .section-content {
            font-size: 14px;
            color: #1d2129;
            line-height: 1.6;
            padding: 12px;
            background: #f7f8fa;
            border-radius: 6px;

            &.dialogue-content {
              font-style: italic;
            }
          }
        }
      }

      .comment-section {
        flex-shrink: 0;
        padding: 24px;
        border-top: 1px solid #e5e6eb;
        background: #fff;

        .comment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;

          .comment-title {
            font-size: 16px;
            font-weight: 600;
            color: #1d2129;
          }

          .comment-count-trigger {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              background: #f7f8fa;
            }

            .comment-icon {
              width: 18px;
              height: 18px;
              color: #86909c;
              transition: color 0.3s;
            }

            &.has-comments {
              .comment-icon {
                color: #5252ff;
              }

              &:hover {
                background: #e8f3ff;
              }
            }

            .count-badge {
              position: absolute;
              top: -4px;
              right: -4px;
              min-width: 18px;
              height: 18px;
              padding: 0 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #5252ff;
              color: #fff;
              border-radius: 9px;
              font-size: 11px;
              font-weight: 600;
              border: 2px solid #fff;
            }
          }
        }

        .comment-input-section {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .comment-textarea {
            :deep(.el-textarea__inner) {
              border-radius: 6px;
              font-size: 13px;
            }
          }
        }
      }
    }
  }

  // 滚动条美化
  .content-details {
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f5f7fa;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c9cdd4;
      border-radius: 3px;

      &:hover {
        background: #a8abb2;
      }
    }
  }

  .footer-actions {
    display: flex;
    justify-content: end;
    gap: 12px;
    padding: 20px 20px 5px 20px;
    border-top: 1px solid #eee;
    background: #fff;

    .el-icon {
      margin-right: 12px;
    }

    .success-btn {
      display: flex;
      height: 44px;
      font-size: 18px;
      font-weight: 500;
      border-radius: 8px;
      padding: 0 24px;
      width: 104px;
      color: #fff;
      align-items: center;
      background: #23c343;
    }
    .failed-btn {
      display: flex;
      height: 44px;
      font-size: 18px;
      font-weight: 500;
      border-radius: 8px;
      padding: 0 24px;
      width: 104px;
      color: #fff;
      align-items: center;
      background: var(--Danger-Danger-5, #f53f3f);
    }
  }
</style>
