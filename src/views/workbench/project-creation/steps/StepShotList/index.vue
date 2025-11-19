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
            <el-button class="model-btn">
              {{ currentModel }}
              <svg-icon icon-class="fy-down" style="height: 16px; width: 16px; margin-left: 6px" />
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
          <el-button class="edit-role" @click="handleEditCharacters">
            <svg-icon icon-class="fy-role" style="height: 16px; width: 16px; margin-right: 4px" />
            角色编辑
          </el-button>

          <!-- 重新匹配角色按钮 -->
          <el-tooltip content="重新匹配角色" placement="bottom">
            <el-button class="refresh-btn" @click="handleRematchCharacters">
              <svg-icon icon-class="fy-refresh" style="height: 16px; width: 16px" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 主内容区 - 分镜表视图 -->
      <div class="content-area">
        <!-- 分镜生成中提示 -->
        <div v-if="episodeTaskStatus === 1" class="generating-overlay">
          <div class="generating-content">
            <svg-icon icon-class="fy-loading" class="loading-icon" />
            <p class="generating-text">分镜生成中，请稍等...</p>
          </div>
        </div>

        <StoryboardTable
          ref="storyboardTableRef"
          :shots="shots"
          :aspect-ratio="aspectRatio"
          :loading="loading"
          :project-id="Number(projectStore.currentProjectId) || 0"
          :episodes="projectStore.episodeInfoList"
          :model-points="getCurrentModelPoints"
          @image-upload="handleImageUpload"
          @image-regenerate="handleImageRegenerate"
          @toggle-favorite="handleToggleFavorite"
          @update-shot="handleUpdateShot"
          @refresh="loadShots"
          @delete-success="handleDeleteSuccess"
        />
      </div>
      <!-- 右下批量生成按钮 -->
      <div v-if="batchStatus === 0" class="right-tools">
        <el-button class="bottom-btn" :loading="batchGenerateLoading" @click="handleBatchGenerate"> 继续 </el-button>
      </div>
    </div>

    <!-- 新增剧集对话框 -->
    <AddEpisodeDialog
      v-model="addEpisodeDialogVisible"
      :project-id="Number(projectStore.currentProjectId) || 0"
      :next-episode-number="projectStore.episodes.length + 1"
      @success="handleAddEpisodeSuccess"
    />

    <!-- 角色编辑对话框 -->
    <CharacterEditDialog
      v-model="characterEditDialogVisible"
      :episode-id="Number(selectedEpisodeId)"
      :project-id="Number(projectStore.currentProjectId)"
      @success="handleCharacterEditSuccess"
    />

    <!-- 扣点确认对话框（单个生成） -->
    <PointsConfirmDialog
      v-model="pointsConfirmDialogVisible"
      :shot-count="1"
      :total-points="getCurrentModelPoints"
      @confirm="handleConfirmGenerate"
    />

    <!-- 批量生成扣点确认对话框 -->
    <PointsConfirmDialog
      v-model="batchGenerateDialogVisible"
      :shot-count="batchShotCount"
      :total-points="batchTotalPoints"
      @confirm="handleConfirmBatchGenerate"
    />
  </div>
</template>

<script setup lang="ts" name="StepShotList">
  import {
    checkEpisodeImg,
    deleteEpisodes,
    generateEpisodeImg,
    getEpisodeImgSceneList,
    rematchCharacters,
    renameEpisode,
    updateShot
  } from '@/api/workbench/episode';
  import type { EpisodeInfoResponseDto, EpisodeSceneItemInfo } from '@/api/workbench/episode/types';
  import type { Episode, Shot, ShotForm } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { useUserStore } from '@/store/modules/user';
  import { convertModelsToOptions, getDefaultModel, getModelName, ratioToSize } from '@/utils/projectUtils';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, onMounted, ref, watch } from 'vue';

  // 导入组件
  import AddEpisodeDialog from '../../components/AddEpisodeDialog.vue';
  import EpisodeListPanel from '../StepScript/components/EpisodeListPanel.vue';
  import CharacterEditDialog from './components/CharacterEditDialog.vue';
  import PointsConfirmDialog from './components/PointsConfirmDialog.vue';
  import StoryboardTable from './components/StoryboardTable.vue';

  const projectStore = useProjectStore();
  const userStore = useUserStore();
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

  // 图片比例（从项目设置中获取 pictureRatio 并转换为字符串格式）
  const aspectRatio = computed(() => {
    return projectStore.pictureRatio ? ratioToSize(projectStore.pictureRatio) : '16:9';
  });

  // 加载状态
  const loading = ref(false);

  // 剧集任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败
  const episodeTaskStatus = ref<number | undefined>(undefined);

  // 批量状态 0-未操作 1-已操作
  const batchStatus = ref<number | undefined>(undefined);

  // 新增剧集对话框
  const addEpisodeDialogVisible = ref(false);

  // 角色编辑对话框
  const characterEditDialogVisible = ref(false);

  // 扣点确认对话框
  const pointsConfirmDialogVisible = ref(false);
  const currentRegenerateShot = ref<Shot | null>(null);

  // 批量生成相关状态
  const batchGenerateDialogVisible = ref(false);
  const batchTotalPoints = ref(0);
  const batchShotCount = ref(0);
  const batchGenerateLoading = ref(false);

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
      // 所有生成的图片列表
      materialInfoVoList: scene.materialInfoVoList || [],
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
      // 历史明细ID（用于判断是否本地上传）
      historyDetailId: scene.historyDetailId,
      // 收藏状态（默认未收藏）
      isCollect: scene.isCollect,
      // 图片加载状态（1-执行中）
      imageLoading: scene.taskStatus === 1,
      // 文生图任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败
      taskStatus: scene.taskStatus,
      // 评论数
      commentCount: Number(scene.commentCount) || 0,
      // 最新一条评论信息（从后端返回的数据中获取）
      // 确保 commentInfo 是有效对象或 undefined
      commentInfo:
        scene.commentInfo && typeof scene.commentInfo === 'object' && scene.commentInfo.id
          ? scene.commentInfo
          : undefined,
      // 图片状态 0-白色 1-橙色 2-绿色 3-红色
      imgStatus: scene.sceneStatus
    }));
  };

  // 加载分镜列表
  const loadShots = async () => {
    if (!selectedEpisodeId.value) return;

    loading.value = true;
    try {
      const res = await getEpisodeImgSceneList(Number(selectedEpisodeId.value));
      const episodeData: EpisodeInfoResponseDto = res.data;

      // 设置剧集任务状态
      episodeTaskStatus.value = episodeData?.taskStatus;

      // 设置批量状态
      batchStatus.value = episodeData?.batchStatus;

      if (episodeData && episodeData.episodeSceneItemInfoList && Array.isArray(episodeData.episodeSceneItemInfoList)) {
        // 过滤掉无效的场景数据
        const validScenes = episodeData.episodeSceneItemInfoList.filter((scene) => scene && scene.basicId);
        shots.value = convertToShots(validScenes);
      } else {
        shots.value = [];
      }
    } catch (error) {
      console.error('加载分镜列表失败:', error);
      shots.value = [];
      episodeTaskStatus.value = undefined;
      batchStatus.value = undefined;
    } finally {
      loading.value = false;
    }
  };

  // 选择剧集
  const handleSelectEpisode = async (episodeId: string | number, taskStatus?: number) => {
    // 如果是当前剧集且处于生成中状态，刷新项目信息
    if (projectStore.currentProjectId && taskStatus === 1) {
      if (projectStore.currentProjectId) {
        try {
          await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));
          // 刷新后重新加载分镜头列表
          loadShots();
        } catch (error) {
          console.error('刷新项目信息失败:', error);
        }
      }
      return;
    }

    if (episodeId === selectedEpisodeId.value) return;

    // 重置编辑状态
    storyboardTableRef.value?.resetEditState();

    selectedEpisodeId.value = episodeId;
    // 更新全局状态和工作流记录
    await projectStore.switchEpisode(episodeId);
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
    if (!selectedEpisodeId.value) {
      ElMessage.warning('请先选择剧集');
      return;
    }
    characterEditDialogVisible.value = true;
  };

  // 角色编辑成功回调
  const handleCharacterEditSuccess = async () => {
    ElMessage.success('角色编辑成功');
    // 重新加载分镜列表以显示更新后的数据
    await loadShots();
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

  // 获取当前模型的积分
  const getCurrentModelPoints = computed(() => {
    const model = projectStore.t2iModelInfoList?.find((m) => m.modelCode === currentModelCode.value);
    return model?.points || 0;
  });

  // 重新生成图片
  const handleImageRegenerate = async (shot: Shot) => {
    // 保存当前要生成的镜头
    currentRegenerateShot.value = shot;
    // 打开扣点确认弹窗
    pointsConfirmDialogVisible.value = true;
  };

  // 确认生成图片
  const handleConfirmGenerate = async () => {
    if (!currentRegenerateShot.value || !selectedEpisodeId.value) return;

    const shot = currentRegenerateShot.value;

    try {
      // 设置加载状态
      shot.imageLoading = true;

      // 调用生成图片接口
      await generateEpisodeImg({
        basicId: shot.basicId,
        episodeId: Number(selectedEpisodeId.value),
        modelCode: currentModelCode.value
      });

      ElMessage.success('图片生成中，请稍候...');

      // 更新钱包积分
      await userStore.updateWalletPoints();

      // 重新加载分镜列表以获取最新状态
      await loadShots();
    } catch (error) {
      console.error('生成图片失败:', error);
      ElMessage.error('生成图片失败，请重试');
      shot.imageLoading = false;
    } finally {
      currentRegenerateShot.value = null;
    }
  };

  // 切换收藏
  const handleToggleFavorite = (shot: Shot) => {
    shot.isCollect = !shot.isCollect;
    ElMessage.success(shot.isCollect ? '已收藏' : '已取消收藏');
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

  // 处理删除成功 - 直接从列表中移除
  const handleDeleteSuccess = (basicId: number) => {
    // 找到被删除的镜头索引
    const index = shots.value.findIndex((shot) => shot.basicId === basicId);
    if (index !== -1) {
      // 直接从数组中移除
      shots.value.splice(index, 1);
      // 重新计算镜号
      shots.value.forEach((shot, idx) => {
        shot.shotNumber = idx + 1;
        shot.id = idx + 1;
      });
    }
  };

  // 批量生成图片
  const handleBatchGenerate = async () => {
    if (!selectedEpisodeId.value) {
      ElMessage.warning('请先选择剧集');
      return;
    }

    if (!currentModelCode.value) {
      ElMessage.warning('请先选择模型');
      return;
    }

    try {
      batchGenerateLoading.value = true;

      // 调用检查接口
      const checkRes = await checkEpisodeImg({
        episodeId: Number(selectedEpisodeId.value),
        modelCode: currentModelCode.value
      });

      const checkData = checkRes.data;

      if (!checkData || !checkData.basicIdList || checkData.basicIdList.length === 0) {
        ElMessage.warning('没有需要生成的镜头');
        return;
      }

      // 设置批量生成的数据
      batchShotCount.value = checkData.basicIdList.length;
      batchTotalPoints.value = checkData.consumerTotalPoints || 0;

      // 打开确认弹窗
      batchGenerateDialogVisible.value = true;
    } catch (error) {
      console.error('检查图片失败:', error);
      ElMessage.error('检查图片失败，请重试');
    } finally {
      batchGenerateLoading.value = false;
    }
  };

  // 确认批量生成
  const handleConfirmBatchGenerate = async () => {
    if (!selectedEpisodeId.value) return;

    try {
      loading.value = true;

      // 调用批量生成接口（不传 basicId）
      await generateEpisodeImg({
        episodeId: Number(selectedEpisodeId.value),
        modelCode: currentModelCode.value
      });

      ElMessage.success('批量生成中，请稍候...');

      // 更新钱包积分
      await userStore.updateWalletPoints();

      // 重新加载分镜列表以获取最新状态
      await loadShots();
    } catch (error) {
      console.error('批量生成失败:', error);
      ElMessage.error('批量生成失败，请重试');
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .step-shot-list {
    display: flex;
    width: 100%;
    height: 100%;
    .episode-list-panel {
      min-width: 200px;
    }
  }
  .right-tools {
    display: flex;
    justify-content: end;
    margin-top: 12px;
    .bottom-btn {
      display: flex;
      align-items: center;
      width: 80px;
      height: 32px;
      padding: 8px 16px;
      gap: 4px;
      border-radius: 8px;
      background: #5252ff;
      color: #fff;
      font-size: 13px;
    }
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
      padding: 0px 20px 20px;

      .left-tools {
        display: flex;
        align-items: center;
        .model-btn {
          display: flex;
          height: 32px;
          padding: 2px 12px;
          justify-content: center;
          align-items: center;
          gap: 6px;
          border-radius: 8px;
          border: 1px solid #eee;
          background: #fff;
          margin-right: 12px;
        }
        .edit-role {
          display: flex;
          height: 32px;
          padding: 8px 16px;
          justify-content: center;
          align-items: center;
          gap: 4px;
          border-radius: 8px;
          border: 1px solid #eee;
          background: #fff;
        }
        .refresh-btn {
          display: flex;
          width: 32px;
          height: 32px;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          border: 1px solid #eee;
          background: #fff;
        }
      }
    }

    .content-area {
      flex: 1;
      overflow: hidden;
      position: relative;

      // 分镜生成中遮罩层
      .generating-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        .generating-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;

          .loading-icon {
            width: 48px;
            height: 48px;
            color: #5b5bff;
            animation: rotate 1.5s linear infinite;
          }

          .generating-text {
            color: #1d2129;
            font-size: 16px;
            font-weight: 500;
            margin: 0;
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      }
    }
  }
</style>
