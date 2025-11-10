<template>
  <div class="step-grid-view">
    <!-- 主内容区 - 故事板网格视图 -->
    <div class="content-area">
      <GridView
        :scenes="scenes"
        :loading="loading"
        @pass="handlePass"
        @edit="handleEdit"
        @imageClick="handleImageClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="StepGridView">
  import { queryStoryBoard } from '@/api/workbench/storyboard';
  import type { StoryBoardSceneVo } from '@/api/workbench/storyboard/types';
  import { useProjectStore } from '@/store/modules/project';
  import { ElMessage } from 'element-plus';
  import { ref, watch } from 'vue';

  // 导入组件
  import GridView from './components/GridView.vue';

  const projectStore = useProjectStore();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 分镜列表（故事板场景列表）
  const scenes = ref<StoryBoardSceneVo[]>([]);

  // 加载状态
  const loading = ref(false);

  // 加载故事板数据
  const loadStoryBoard = async () => {
    if (!selectedEpisodeId.value) return;

    loading.value = true;
    try {
      const res = await queryStoryBoard({
        episodeId: Number(selectedEpisodeId.value),
        sceneType: 1 // 根据你提供的参数，镜头类型为 2
      });

      if (res.data) {
        scenes.value = res.data;
      } else {
        scenes.value = [];
      }
    } catch (error) {
      console.error('加载故事板失败:', error);
      scenes.value = [];
      ElMessage.error('加载故事板失败');
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
        loadStoryBoard();
      }
    },
    { immediate: true }
  );

  // 通过场景
  const handlePass = (scene: StoryBoardSceneVo) => {
    ElMessage.success(`场景 ${scene.orderNo} 已通过`);
    // TODO: 调用接口更新场景状态为"绿色"
  };

  // 待修改场景
  const handleEdit = (scene: StoryBoardSceneVo) => {
    ElMessage.info(`场景 ${scene.orderNo} 标记为待修改`);
    // TODO: 调用接口更新场景状态为"橙色"
  };

  // 图片点击
  const handleImageClick = (scene: StoryBoardSceneVo) => {
    console.log('点击图片:', scene);
  };
</script>

<style scoped lang="scss">
  .step-grid-view {
    display: flex;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
  }

  .content-area {
    flex: 1;
    overflow: hidden;
    background: white;
  }
</style>
