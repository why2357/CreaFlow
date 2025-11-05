<template>
  <div class="step-shot-list">
    <!-- 左侧剧集列表 -->
    <EpisodeListPanel
      :episodes="projectStore.episodes"
      :selected-id="selectedEpisodeId"
      :show-progress="false"
      @select="handleSelectEpisode"
      @add="handleShowAddEpisodeDialog"
      @rename="handleRenameEpisode"
      @delete="handleDeleteEpisode"
    />

    <!-- 右侧内容区 -->
    <div class="right-content">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="left-tools">
          <!-- 模型选择下拉框 -->
          <el-dropdown trigger="click" @command="handleModelChange">
            <el-button>
              {{ currentModel }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="model in modelOptions" :key="model.value" :command="model.value">
                  {{ model.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 角色编辑按钮 -->
          <el-button @click="handleEditCharacters">
            <el-icon><User /></el-icon>
            角色编辑
          </el-button>

          <!-- 重新匹配角色按钮 -->
          <el-tooltip content="重新匹配角色" placement="bottom">
            <el-button @click="handleRematchCharacters">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 主内容区 - 分镜表视图 -->
      <div class="content-area">
        <StoryboardTable
          ref="storyboardTableRef"
          :shots="shots"
          :aspect-ratio="aspectRatio"
          :loading="loading"
          :project-id="Number(projectStore.currentProjectId) || 0"
          :episodes="projectStore.episodeInfoList"
          @image-upload="handleImageUpload"
          @image-regenerate="handleImageRegenerate"
          @toggle-favorite="handleToggleFavorite"
          @update-shot="handleUpdateShot"
          @refresh="loadShots"
        />
      </div>
    </div>

    <!-- 新增剧集对话框 -->
    <AddEpisodeDialog
      v-model="addEpisodeDialogVisible"
      :project-id="Number(projectStore.currentProjectId) || 0"
      :next-episode-number="projectStore.episodes.length + 1"
      @success="handleAddEpisodeSuccess"
    />
  </div>
</template>

<script setup lang="ts" name="StepShotList">
  import {
    deleteEpisodes,
    getEpisodeImgSceneList,
    rematchCharacters,
    renameEpisode,
    updateShot
  } from '@/api/workbench/episode';
  import type { EpisodeInfoResponseDto, EpisodeSceneItemInfo } from '@/api/workbench/episode/types';
  import type { Episode, Shot, ShotForm } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { convertModelsToOptions, getDefaultModel, getModelName } from '@/utils/projectUtils';
  import { ArrowDown, Refresh, User } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, onMounted, ref, watch } from 'vue';

  // 导入组件
  import AddEpisodeDialog from '../../components/AddEpisodeDialog.vue';
  import EpisodeListPanel from '../StepScript/components/EpisodeListPanel.vue';
  import StoryboardTable from './components/StoryboardTable.vue';

  const projectStore = useProjectStore();
  console.log('projectStore.episodes', projectStore.episodes);

  // StoryboardTable 组件引用
  const storyboardTableRef = ref<InstanceType<typeof StoryboardTable>>();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 当前模型码（用于图片生成，使用文生图模型）
  const currentModelCode = ref<string>('');

  // 动态模型选项
  const modelOptions = computed(() => {
    return convertModelsToOptions(projectStore.t2iModelInfoList);
  });

  // 当前模型名称
  const currentModel = computed(() => {
    return getModelName(projectStore.t2iModelInfoList, currentModelCode.value) || '请选择模型';
  });

  // 分镜列表
  const shots = ref<Shot[]>([]);

  // 图片比例（从项目设置中获取，这里默认16:9）
  const aspectRatio = ref('16:9');

  // 加载状态
  const loading = ref(false);

  // 新增剧集对话框
  const addEpisodeDialogVisible = ref(false);

  // 初始化
  onMounted(async () => {
    // 初始化默认模型
    currentModelCode.value = getDefaultModel(projectStore.t2iModelInfoList);

    // 如果有当前剧集ID，直接加载分镜数据
    if (projectStore.currentEpisodeId) {
      selectedEpisodeId.value = projectStore.currentEpisodeId;
      await loadShots();
    } else if (projectStore.episodes.length > 0) {
      // 如果没有当前剧集但有剧集列表，选择第一个
      selectedEpisodeId.value = projectStore.episodes[0].id;
      await loadShots();
    }
  });

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

  // 将后端数据转换为 Shot 类型
  const convertToShots = (sceneList: EpisodeSceneItemInfo[]): Shot[] => {
    return sceneList.map((scene, index) => ({
      id: index + 1,
      episodeId: selectedEpisodeId.value!,
      shotNumber: index + 1,
      // 场景基础信息ID（用于编辑接口）
      basicId: scene.basicId,
      // 画面图片（优先使用预览图，没有则使用原图）
      sceneImage: scene.materialInfoVoList?.[0]?.previewOssUrl || scene.materialInfoVoList?.[0]?.originOssUrl || '',
      // 画面描述（用于编辑时使用，保存完整描述）
      sceneDescription: `${scene.sceneDesc || ''}${scene.sceneDesc && scene.sceneHint ? '\n' : ''}${
        scene.sceneHint || ''
      }`,
      // 特写镜头描述（显示用）
      sceneDesc: scene.sceneDesc || '',
      // 场景描述（显示用）
      sceneHint: scene.sceneHint || '',
      // 场景图片（环境素材）- 保留向后兼容
      sceneLocationImage: scene.envMaterialInfoVo?.previewOssUrl || scene.envMaterialInfoVo?.originOssUrl || '',
      // 环境素材信息对象（新增，用于场景选择功能）
      envMaterialInfoVo: scene.envMaterialInfoVo
        ? {
            id: scene.envMaterialInfoVo.id,
            originOssId: scene.envMaterialInfoVo.originOssId,
            originOssUrl: scene.envMaterialInfoVo.originOssUrl,
            previewOssId: scene.envMaterialInfoVo.previewOssId,
            previewOssUrl: scene.envMaterialInfoVo.previewOssUrl,
            projectId: scene.envMaterialInfoVo.projectId,
            status: scene.envMaterialInfoVo.status,
            userId: scene.envMaterialInfoVo.userId
          }
        : undefined,
      // 台词
      dialogue: scene.dialogues || '',
      // 人物列表（直接使用服装信息列表）
      characters: scene.characterClothingInfoList || [],
      // 场景名称（使用场景提示作为场景名称）
      sceneLocation: scene.sceneHint || '',
      // 收藏状态（默认未收藏）
      isFavorite: false,
      // 图片加载状态（1-执行中）
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

  // 选择剧集
  const handleSelectEpisode = async (episodeId: string | number) => {
    if (episodeId === selectedEpisodeId.value) return;

    // 重置编辑状态
    storyboardTableRef.value?.resetEditState();

    selectedEpisodeId.value = episodeId;
    // await projectStore.switchEpisode(episodeId);
    loadShots();
  };

  // 显示新增剧集对话框
  const handleShowAddEpisodeDialog = () => {
    addEpisodeDialogVisible.value = true;
  };

  // 新增剧集成功回调
  const handleAddEpisodeSuccess = async () => {
    // 重新加载项目信息以获取最新的剧集列表
    await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));

    // 如果有剧集，选择最后一个（最新创建的）
    if (projectStore.episodes.length > 0) {
      const latestEpisode = projectStore.episodes[projectStore.episodes.length - 1];
      selectedEpisodeId.value = latestEpisode.id;
      await loadShots();
    }
  };

  // 模型切换
  const handleModelChange = (modelCode: string) => {
    currentModelCode.value = modelCode;
    const modelName = getModelName(projectStore.t2iModelInfoList, modelCode);
    ElMessage.success(`已切换到 ${modelName}`);
  };

  // 角色编辑
  const handleEditCharacters = () => {
    ElMessage.info('角色编辑功能开发中...');
  };

  // 重新匹配角色
  const handleRematchCharacters = async () => {
    if (!selectedEpisodeId.value) {
      ElMessage.warning('请先选择剧集');
      return;
    }

    try {
      loading.value = true;
      const res = await rematchCharacters(Number(selectedEpisodeId.value));
      const errorSceneNums = res.data?.errorSceneNums;

      // 如果有超过角色数量的镜头，显示警告对话框
      if (errorSceneNums && errorSceneNums.length > 0) {
        const sceneNumsText = errorSceneNums.join('、');
        await ElMessageBox.alert(`单镜头最多支持三位角色\n\n镜号【${sceneNumsText}】超出角色数量`, '提示', {
          confirmButtonText: '确认',
          type: 'warning',
          center: false,
          customClass: 'character-match-warning-dialog'
        });
      } else {
        ElMessage.success('角色匹配成功');
      }

      // 重新加载分镜列表以显示更新后的数据
      await loadShots();
    } catch (error) {
      console.log('重新匹配角色失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 重命名剧集
  const handleRenameEpisode = async (episode: Episode) => {
    try {
      const { value: newName } = await ElMessageBox.prompt('请输入新的剧集名称', '重命名', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: episode.name,
        inputPattern: /\S+/,
        inputErrorMessage: '剧集名称不能为空'
      });

      if (newName && newName.trim()) {
        // 调用重命名接口
        await renameEpisode(Number(episode.id), newName.trim());

        // 重新加载项目信息以获取最新的剧集列表
        await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));

        ElMessage.success('重命名成功');
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('重命名剧集失败:', error);
      }
    }
  };

  // 删除剧集
  const handleDeleteEpisode = async (episode: Episode) => {
    try {
      await ElMessageBox.confirm(`确定要删除剧集「${episode.name}」吗？此操作不可恢复。`, '删除剧集', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      // 调用删除接口（使用新接口支持批量删除）
      await deleteEpisodes([Number(episode.id)]);

      // 重新加载项目信息以获取最新的剧集列表
      await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));

      // 如果删除的是当前选中的剧集，切换到第一个剧集
      if (episode.id === selectedEpisodeId.value) {
        shots.value = [];
        selectedEpisodeId.value = projectStore.episodes.length > 0 ? projectStore.episodes[0].id : null;
        if (selectedEpisodeId.value) {
          await loadShots();
        }
      }

      ElMessage.success('删除成功');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除剧集失败:', error);
      }
    }
  };

  // 图片上传
  const handleImageUpload = async (shot: Shot, file: File) => {
    ElMessage.info(`上传图片: 镜号${shot.shotNumber}`);
    // TODO: 调用上传接口
    setTimeout(() => {
      shot.sceneImage = URL.createObjectURL(file);
      ElMessage.success('上传成功');
    }, 1000);
  };

  // 重新生成图片
  const handleImageRegenerate = async (shot: Shot) => {
    ElMessage.info(`重新生成图片: 镜号${shot.shotNumber}`);
    // TODO: 调用生成接口
    shot.imageLoading = true;
    setTimeout(() => {
      shot.imageLoading = false;
      shot.sceneImage = 'https://via.placeholder.com/300x200';
      ElMessage.success('生成成功');
    }, 2000);
  };

  // 切换收藏
  const handleToggleFavorite = (shot: Shot) => {
    shot.isFavorite = !shot.isFavorite;
    ElMessage.success(shot.isFavorite ? '已收藏' : '已取消收藏');
  };

  // 更新分镜信息
  const handleUpdateShot = async (shot: Shot) => {
    if (!selectedEpisodeId.value) return;

    try {
      const updateData: ShotForm = {
        id: shot.id,
        episodeId: selectedEpisodeId.value,
        shotNumber: shot.shotNumber,
        sceneDescription: shot.sceneDescription,
        dialogue: shot.dialogue,
        characters: shot.characters,
        sceneLocation: shot.sceneLocation,
        sceneImage: shot.sceneImage
      };

      await updateShot(updateData);
      ElMessage.success('更新成功');
    } catch (error) {
      console.error('更新分镜失败:', error);
      await loadShots();
    }
  };
</script>

<style scoped lang="scss">
  .step-shot-list {
    display: flex;
    width: 100%;
    height: 100%;
  }

  .right-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0px 20px 0;
      // border-bottom: 1px solid #e4e7ed;
      // background: white;

      .left-tools {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .content-area {
      flex: 1;
      overflow: hidden;
      // background: white;
    }
  }
</style>
