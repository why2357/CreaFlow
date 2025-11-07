<template>
  <div class="step-grid-view">
    <!-- 主内容区 - 故事板网格视图 -->
    <div class="content-area">
      <GridView
        :shots="shots"
        :loading="loading"
        @view="handleViewShot"
        @edit="handleEditShot"
        @download="handleDownloadShot"
        @delete="handleDeleteShot"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="StepGridView">
  import { getEpisodeImgSceneList } from '@/api/workbench/episode';
  import type { EpisodeInfoResponseDto, EpisodeSceneItemInfo } from '@/api/workbench/episode/types';
  import type { Shot } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { ref, watch } from 'vue';

  // 导入组件
  import GridView from './components/GridView.vue';

  const projectStore = useProjectStore();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 分镜列表
  const shots = ref<Shot[]>([]);

  // 加载状态
  const loading = ref(false);

  // 监听剧集变化
  watch(
    () => projectStore.currentEpisodeId,
    (newVal) => {
      if (newVal) {
        selectedEpisodeId.value = newVal;
        loadShots();
      }
    }
  );

  // 初始化剧集数据（直接使用 store 中的数据）
  const loadEpisodeList = async () => {
    // 直接使用 projectStore 中已加载的数据
    if (projectStore.currentEpisodeId) {
      selectedEpisodeId.value = projectStore.currentEpisodeId;
      await loadShots();
    } else if (projectStore.episodes.length > 0) {
      selectedEpisodeId.value = projectStore.episodes[0].id;
      await loadShots();
    }
  };

  // 将后端数据转换为 Shot 类型
  const convertToShots = (sceneList: EpisodeSceneItemInfo[]): Shot[] => {
    return sceneList.map((scene, index) => ({
      id: index + 1,
      episodeId: selectedEpisodeId.value!,
      shotNumber: index + 1,
      sceneImage: scene.materialInfoVoList?.[0]?.previewOssUrl || scene.materialInfoVoList?.[0]?.originOssUrl || '',
      sceneDescription: scene.sceneDesc || '',
      dialogue: scene.dialogues || '',
      characters: scene.characterClothingInfoList?.map((c) => c.clothingName || '') || [],
      sceneLocation: scene.sceneHint || '',
      isFavorite: false,
      imageLoading: scene.taskStatus === 1
    }));
  };

  // 加载分镜列表
  const loadShots = async () => {
    if (!selectedEpisodeId.value) return;

    loading.value = true;
    try {
      const res = await getEpisodeImgSceneList(Number(selectedEpisodeId.value));
      const episodeData: EpisodeInfoResponseDto = res.data;

      if (episodeData && episodeData.episodeSceneItemInfoList) {
        shots.value = convertToShots(episodeData.episodeSceneItemInfoList);
      } else {
        shots.value = [];
      }
    } catch (error) {
      console.error('加载分镜列表失败:', error);
      shots.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 查看分镜
  const handleViewShot = (shot: Shot) => {
    ElMessage.info(`查看分镜 ${shot.shotNumber}`);
  };

  // 编辑分镜
  const handleEditShot = (shot: Shot) => {
    ElMessage.info(`编辑分镜 ${shot.shotNumber}`);
  };

  // 下载分镜
  const handleDownloadShot = (shot: Shot) => {
    if (!shot.sceneImage) {
      ElMessage.warning('暂无图片可下载');
      return;
    }

    const link = document.createElement('a');
    link.href = shot.sceneImage;
    link.download = `shot-${shot.shotNumber}.jpg`;
    link.click();

    ElMessage.success('下载成功');
  };

  // 删除分镜
  const handleDeleteShot = async (shot: Shot) => {
    try {
      await ElMessageBox.confirm('确定要删除这个分镜吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      shots.value = shots.value.filter((s) => s.id !== shot.id);
      ElMessage.success('删除成功');
    } catch {
      // 用户取消
    }
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
