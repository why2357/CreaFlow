<template>
  <!-- 顶部操作栏 -->
  <div class="top-action-bar" v-has-project-permi="['scene-approval']">
    <el-button type="primary" class="review-button" @click="handleOpenReviewDialog"> 审阅 </el-button>
  </div>
  <div class="step-grid-view">
    <!-- 主内容区 - 故事板网格视图 -->
    <div class="content-area">
      <GridView
        :scenes="scenes"
        :loading="loading"
        @comment="handleComment"
        @insert="handleInsert"
        @review="handleReview"
        @delete="handleDelete"
        @image-click="handleImageClick"
        @status-change="handleStatusChange"
        @view-comments="handleViewComments"
      />
    </div>

    <!-- 留言弹窗 -->
    <CommentDialog
      v-model="commentDialogVisible"
      :basic-id="currentScene?.id || 0"
      :scene-type="1"
      :trigger-ref="commentTriggerRef"
      @success="handleCommentSuccess"
    />

    <!-- 留言列表弹窗 -->
    <CommentListDialog
      v-model="commentListDialogVisible"
      :basic-id="currentScene?.id || 0"
      :scene-type="1"
      :trigger-ref="commentListTriggerRef"
      trigger-type="hover"
      @change="handleCommentChange"
    />

    <!-- 评审弹窗 -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :basic-id="currentScene?.id || 0"
      :scene-type="1"
      :current-status="currentScene?.imgStatus"
      :trigger-ref="reviewTriggerRef"
      @success="handleReviewSuccess"
    />

    <!-- 故事板审阅弹窗 -->
    <StoryboardReviewDialog
      v-model="storyboardReviewDialogVisible"
      :episode-id="selectedEpisodeId ? Number(selectedEpisodeId) : undefined"
      :scene-type="1"
      :scene-status-list="[1]"
      :initial-index="0"
      :picture-ratio="projectStore.pictureRatio || 1"
      @refresh="handleReviewDialogRefresh"
    />
  </div>
</template>

<script setup lang="ts" name="StepGridView">
  import { addScene, deleteScene, queryStoryBoard } from '@/api/workbench/storyboard';
  import type { StoryBoardSceneVo } from '@/api/workbench/storyboard/types';
  import { useProjectStore } from '@/store/modules/project';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { onActivated, ref, watch } from 'vue';

  // 导入组件
  import CommentDialog from '../StepShotList/components/CommentDialog.vue';
  import CommentListDialog from '../StepShotList/components/CommentListDialog.vue';
  import ReviewDialog from '../StepShotList/components/ReviewDialog.vue';
  import GridView from './components/GridView.vue';
  import StoryboardReviewDialog from './components/StoryboardReviewDialog.vue';

  const projectStore = useProjectStore();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 分镜列表（故事板场景列表）
  const scenes = ref<StoryBoardSceneVo[]>([]);

  // 加载状态
  const loading = ref(false);

  // 防止重复加载的标记
  let loadingPromise: Promise<void> | null = null;

  // 当前操作的场景
  const currentScene = ref<StoryBoardSceneVo | null>(null);

  // 留言弹窗
  const commentDialogVisible = ref(false);
  const commentTriggerRef = ref<HTMLElement>();

  // 留言列表弹窗
  const commentListDialogVisible = ref(false);
  const commentListTriggerRef = ref<HTMLElement>();

  // 评审弹窗
  const reviewDialogVisible = ref(false);
  const reviewTriggerRef = ref<HTMLElement>();

  // 故事板审阅弹窗
  const storyboardReviewDialogVisible = ref(false);

  // 加载故事板数据（支持无感刷新）
  const loadStoryBoard = async (silentRefresh = false) => {
    if (!selectedEpisodeId.value) return;

    // 如果已经有正在进行的加载，直接返回该 Promise
    if (loadingPromise) {
      return loadingPromise;
    }

    // 只在非静默刷新时显示加载状态
    if (!silentRefresh) {
      loading.value = true;
    }

    // 创建加载 Promise
    loadingPromise = (async () => {
      try {
        const res = await queryStoryBoard({
          episodeId: Number(selectedEpisodeId.value),
          sceneType: 1 // 根据你提供的参数，镜头类型为 2
        });

        if (res.data) {
          // 确保每个场景的 commentCnt 字段都有初始值，然后直接替换数据
          scenes.value = res.data.map((scene) => ({
            ...scene,
            commentCnt: scene.commentCnt ?? 0
          }));
        } else {
          scenes.value = [];
        }
      } catch (error) {
        console.error('加载故事板失败:', error);
        // 静默刷新失败时不清空数据
        if (!silentRefresh) {
          scenes.value = [];
        }
      } finally {
        if (!silentRefresh) {
          loading.value = false;
        }
        // 清除加载标记
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  };

  // 监听剧集变化
  watch(
    () => projectStore.currentEpisodeId,
    (newVal) => {
      if (newVal) {
        selectedEpisodeId.value = newVal;
        loadStoryBoard();
      }
    },
    { immediate: true }
  );

  // 当组件从 KeepAlive 缓存中激活时重新加载数据
  onActivated(() => {
    if (selectedEpisodeId.value) {
      loadStoryBoard(true); // 使用静默刷新
    }
  });

  // 留言
  const handleComment = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    if (!scene.id) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }
    currentScene.value = scene;
    commentTriggerRef.value = event.currentTarget as HTMLElement;
    commentDialogVisible.value = true;
  };

  // 留言成功
  const handleCommentSuccess = () => {
    // 无感刷新数据
    loadStoryBoard(true);
  };

  // 查看留言列表
  const handleViewComments = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    if (!scene.id) {
      ElMessage.warning('该场景暂无基础信息，无法查看留言');
      return;
    }
    // 检查是否有评论
    if (!scene.commentCnt || scene.commentCnt <= 0) {
      ElMessage.info('暂无留言');
      return;
    }
    currentScene.value = scene;
    commentListTriggerRef.value = event.currentTarget as HTMLElement;
    commentListDialogVisible.value = true;
  };

  // 留言数量变化
  const handleCommentChange = () => {
    // 无感刷新数据
    loadStoryBoard(true);
  };

  // 插入镜头
  const handleInsert = async (scene: StoryBoardSceneVo) => {
    if (!scene.id) {
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
        preBasicId: scene.id,
        sceneType: 1 // 1-图片
      });

      ElMessage.success('插入镜头成功');
      loadStoryBoard(true);
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('插入镜头失败:', error);
        ElMessage.error('插入镜头失败，请重试');
      }
    }
  };

  // 评审
  const handleReview = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    if (!scene.id) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    // 检查是否可以评审（只有橙色、红色、绿色状态才能评审）
    if (scene.imgStatus !== 1 && scene.imgStatus !== 2 && scene.imgStatus !== 3) {
      ElMessage.warning('只能对橙色、红色、绿色状态的镜头进行评审');
      return;
    }

    currentScene.value = scene;
    reviewTriggerRef.value = event.currentTarget as HTMLElement;
    reviewDialogVisible.value = true;
  };

  // 评审成功
  const handleReviewSuccess = (reviewType: number) => {
    // 无感刷新：直接更新当前场景的状态
    if (currentScene.value) {
      // reviewType: 1-通过(绿色) 2-待修改(红色)
      currentScene.value.imgStatus = reviewType === 1 ? 2 : 3;
    }
  };

  // 删除镜头
  const handleDelete = async (scene: StoryBoardSceneVo) => {
    if (!scene.id) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    try {
      await ElMessageBox.confirm(`确定要删除镜号 ${scene.orderNo} 吗？此操作不可恢复。`, '删除镜头', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      await deleteScene([scene.id]);
      ElMessage.success('删除镜头成功');
      loadStoryBoard(true);
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除镜头失败:', error);
        ElMessage.error('删除镜头失败，请重试');
      }
    }
  };

  // 状态变更
  const handleStatusChange = (scene: StoryBoardSceneVo, status: number) => {
    // 这里可以调用接口更新状态，或者直接在本地更新
  };

  // 图片点击
  const handleImageClick = (scene: StoryBoardSceneVo) => {};

  // 打开故事板审阅弹窗（只审阅橙色状态的场景）
  const handleOpenReviewDialog = async () => {
    if (!selectedEpisodeId.value) {
      ElMessage.warning('请先选择剧集');
      return;
    }

    try {
      // 先调用接口检查是否有分镜数据
      const response = await queryStoryBoard({
        episodeId: Number(selectedEpisodeId.value),
        sceneStatusList: [1],
        sceneType: 1 // 图片类型
      });

      // 如果返回空数组，提示用户并不打开弹窗
      if (!response.data || response.data.length === 0) {
        ElMessage.warning('暂无可审阅的分镜数据');
        return;
      }

      // 有数据则打开弹窗
      storyboardReviewDialogVisible.value = true;
    } catch (error) {
      console.error('查询分镜数据失败:', error);
      ElMessage.error('查询分镜数据失败');
    }
  };

  // 审阅弹窗刷新回调
  const handleReviewDialogRefresh = () => {
    // 无感刷新数据
    loadStoryBoard(true);
  };
</script>

<style scoped lang="scss">
  .top-action-bar {
    padding-top: 2px;
    .review-button {
      display: flex;
      width: 80px;
      height: 32px;
      padding: 8px 16px;
      justify-content: center;
      align-items: center;
      gap: 4px;
      border-radius: 8px;
      background: #5252ff;
      color: #fff;
      text-align: center;
      font-size: 13px;
      margin-bottom: 16px;
    }
  }
  .step-grid-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .content-area {
    flex: 1;
    min-height: 0;
    // background: white;
  }
</style>
