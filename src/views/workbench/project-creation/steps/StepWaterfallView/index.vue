<template>
  <div class="step-waterfall-view">
    <!-- 主内容区 - 瀑布流视图 -->
    <div class="content-area">
      <WaterfallView
        :waterfall-data="waterfallData"
        :loading="loading"
        @replace="handleReplace"
        @collect="handleCollect"
        @download="handleDownload"
        @delete="handleDelete"
        @comment="handleComment"
        @insert="handleInsert"
        @review="handleReview"
        @delete-scene="handleDeleteScene"
      />
    </div>

    <!-- 留言弹窗 -->
    <CommentDialog
      v-model="commentDialogVisible"
      :basic-id="currentItem?.id || 0"
      :scene-type="1"
      :trigger-ref="commentTriggerRef"
      @success="handleCommentSuccess"
    />

    <!-- 评审弹窗 -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :basic-id="currentItem?.id || 0"
      :scene-type="1"
      :current-status="currentItem?.imgStatus"
      :trigger-ref="reviewTriggerRef"
      @success="handleReviewSuccess"
    />
  </div>
</template>

<script setup lang="ts" name="StepWaterfallView">
  import {
    cancelCollectHistoryDetail,
    chooseHistoryDetail,
    collectHistoryDetail,
    deleteHistoryDetail
  } from '@/api/workbench/episode';
  import type { WaterfallItem } from '@/api/workbench/episode/waterfall';
  import { getWaterfallList } from '@/api/workbench/episode/waterfall';
  import { addScene, deleteScene } from '@/api/workbench/storyboard';
  import { useProjectStore } from '@/store/modules/project';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { ref, watch } from 'vue';

  // 导入组件
  import CommentDialog from '../StepShotList/components/CommentDialog.vue';
  import ReviewDialog from '../StepShotList/components/ReviewDialog.vue';
  import WaterfallView from './components/WaterfallView.vue';

  const projectStore = useProjectStore();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 瀑布流数据
  const waterfallData = ref<WaterfallItem[]>([]);

  // 加载状态
  const loading = ref(false);

  // 当前操作的项
  const currentItem = ref<WaterfallItem | null>(null);

  // 留言弹窗
  const commentDialogVisible = ref(false);
  const commentTriggerRef = ref<HTMLElement>();

  // 评审弹窗
  const reviewDialogVisible = ref(false);
  const reviewTriggerRef = ref<HTMLElement>();

  // 加载瀑布流数据
  const loadWaterfallData = async () => {
    if (!selectedEpisodeId.value) return;

    loading.value = true;
    try {
      const res = await getWaterfallList({
        episodeId: Number(selectedEpisodeId.value)
      });

      if (res.data) {
        waterfallData.value = res.data;
      } else {
        waterfallData.value = [];
      }
    } catch (error) {
      console.error('加载瀑布流数据失败:', error);
      waterfallData.value = [];
      ElMessage.error('加载数据失败');
    } finally {
      loading.value = false;
    }
  };

  // 监听剧集变化
  watch(
    () => projectStore.currentEpisodeId,
    (newVal) => {
      if (newVal) {
        selectedEpisodeId.value = newVal;
        loadWaterfallData();
      }
    },
    { immediate: true }
  );

  // 替换图片
  const handleReplace = async (basicId: number, historyDetailId: number) => {
    try {
      await chooseHistoryDetail({ historyDetailId });
      ElMessage.success('替换成功');
      // 重新加载数据
      await loadWaterfallData();
    } catch (error) {
      console.error('替换图片失败:', error);
      ElMessage.error('替换图片失败');
    }
  };

  // 收藏/取消收藏
  const handleCollect = async (historyDetailId: number, isCollect: boolean) => {
    try {
      // 乐观更新：先更新本地状态
      const targetItem = waterfallData.value.find((item) =>
        item.historyImgs?.some((img) => img.id === historyDetailId)
      );
      if (targetItem) {
        const targetHistoryImg = targetItem.historyImgs.find((img) => img.id === historyDetailId);
        if (targetHistoryImg) {
          // 切换收藏状态
          targetHistoryImg.isCollect = !isCollect;
        }
      }

      if (isCollect) {
        // 取消收藏
        await cancelCollectHistoryDetail({ historyDetailId });
        ElMessage.success('取消收藏成功');
      } else {
        // 收藏
        await collectHistoryDetail({ historyDetailId });
        ElMessage.success('收藏成功');
      }
      // 重新加载数据以确保数据一致性
      await loadWaterfallData();
    } catch (error) {
      console.error('操作收藏失败:', error);
      ElMessage.error('操作失败');
      // 失败时重新加载数据恢复状态
      await loadWaterfallData();
    }
  };

  // 下载图片
  const handleDownload = (historyImg: any) => {
    const imageUrl = historyImg.imgMaterial?.originOssUrl || historyImg.imgMaterial?.previewOssUrl;
    if (!imageUrl) {
      ElMessage.warning('暂无图片可下载');
      return;
    }

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `history-${historyImg.id}.jpg`;
    link.click();

    ElMessage.success('下载成功');
  };

  // 删除图片
  const handleDelete = async (historyDetailId: number) => {
    try {
      await ElMessageBox.confirm('确定要删除这张历史图片吗？此操作不可恢复。', '删除图片', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      await deleteHistoryDetail([historyDetailId]);
      ElMessage.success('删除成功');
      // 重新加载数据
      await loadWaterfallData();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除图片失败:', error);
        ElMessage.error('删除失败，请重试');
      }
    }
  };

  // 留言
  const handleComment = (item: WaterfallItem, event: MouseEvent) => {
    if (!item.id) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }
    currentItem.value = item;
    commentTriggerRef.value = event.currentTarget as HTMLElement;
    commentDialogVisible.value = true;
  };

  // 留言成功
  const handleCommentSuccess = () => {
    loadWaterfallData();
  };

  // 插入镜头
  const handleInsert = async (item: WaterfallItem) => {
    if (!item.id) {
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
        preBasicId: item.id,
        sceneType: 1 // 1-图片
      });

      ElMessage.success('插入镜头成功');
      loadWaterfallData();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('插入镜头失败:', error);
        ElMessage.error('插入镜头失败，请重试');
      }
    }
  };

  // 评审
  const handleReview = (item: WaterfallItem, event: MouseEvent) => {
    if (!item.id) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    // 检查是否可以评审（只有橙色、红色、绿色状态才能评审）
    if (item.imgStatus !== 1 && item.imgStatus !== 2 && item.imgStatus !== 3) {
      ElMessage.warning('只能对橙色、红色、绿色状态的镜头进行评审');
      return;
    }

    currentItem.value = item;
    reviewTriggerRef.value = event.currentTarget as HTMLElement;
    reviewDialogVisible.value = true;
  };

  // 评审成功
  const handleReviewSuccess = (reviewType: number) => {
    // 无感刷新：直接更新当前项的状态
    if (currentItem.value) {
      // reviewType: 1-通过(绿色) 2-待修改(红色)
      currentItem.value.imgStatus = reviewType === 1 ? 2 : 3;
    }
  };

  // 删除场景
  const handleDeleteScene = async (item: WaterfallItem) => {
    if (!item.id) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    try {
      await ElMessageBox.confirm(`确定要删除镜号 ${item.orderNo} 吗？此操作不可恢复。`, '删除镜头', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      await deleteScene([item.id]);
      ElMessage.success('删除镜头成功');
      loadWaterfallData();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除镜头失败:', error);
        ElMessage.error('删除镜头失败，请重试');
      }
    }
  };
</script>

<style scoped lang="scss">
  .step-waterfall-view {
    display: flex;
    width: 100%;
    height: 100%;
    // background: #f5f7fa;
  }

  .content-area {
    flex: 1;
    overflow: hidden;
    // background: white;
  }
</style>
