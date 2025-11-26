<template>
  <div class="step-video">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="left-tools">
        <!-- 全选 -->
        <div class="select-btn" @click.self="handleSelectBtnClick">
          <el-checkbox :model-value="selectAll" :indeterminate="isIndeterminate" @change="handleSelectBtnClick">
            <span class="select-text">全选</span>
          </el-checkbox>
        </div>

        <!-- 批量导入文本按钮 -->
        <el-button class="toolbar-btn" @click="handleImportTemplate">
          <svg-icon icon-class="fy-import" style="width: 16px; height: 16px; margin-right: 4px" />
          批量导入文本
        </el-button>

        <!-- 审批按钮 -->
        <el-button
          type="primary"
          class="review-button"
          @click="handleOpenReviewDialog"
          v-has-project-permi="['scene-approval']"
        >
          审阅
        </el-button>
        <!-- 生成按钮 -->
        <el-button v-if="selectedIds.length > 0" type="primary" class="review-button" @click="handleBatchGenerate">
          生成
        </el-button>
      </div>

      <div class="right-tools">
        <!-- 三级联动下拉选择器 -->
        <div class="model-selector">
          <!-- 模型选择 -->
          <el-select
            v-model="selectedModelCode"
            placeholder="选择模型"
            class="model-select"
            @change="handleModelChange"
          >
            <el-option
              v-for="model in modelConfigs"
              :key="model.modelCode"
              :label="model.modelName"
              :value="model.modelCode"
            />
          </el-select>

          <!-- 分辨率选择 -->
          <el-select
            v-model="selectedResolution"
            placeholder="选择分辨率"
            class="resolution-select"
            :disabled="!selectedModelCode"
            @change="handleResolutionChange"
          >
            <el-option
              v-for="resConfig in availableResolutions"
              :key="resConfig.resolution"
              :label="formatResolution(resConfig.resolution)"
              :value="resConfig.resolution"
            />
          </el-select>

          <!-- 时长选择 -->
          <el-select
            v-model="selectedDuration"
            placeholder="选择时长"
            class="duration-select"
            :disabled="!selectedResolution"
            @change="handleDurationChange"
          >
            <el-option
              v-for="durConfig in availableDurations"
              :key="durConfig.duration"
              :label="`${durConfig.duration}S`"
              :value="durConfig.duration"
            />
          </el-select>
        </div>

        <!-- 导出按钮 -->
        <ExportDropdown />
      </div>
    </div>

    <!-- 视频表格 -->
    <div class="content-area">
      <VideoTable
        ref="videoTableRef"
        :videos="videos"
        :loading="loading"
        :selected-ids="selectedIds"
        :model-config="currentModelConfigObj"
        :all-model-configs="videoModelPointConfigs"
        :model-configs="modelConfigs"
        :aspect-ratio="aspectRatio"
        @selection-change="handleSelectionChange"
        @generate-video="handleGenerateVideo"
        @refresh="loadVideos"
      />
    </div>

    <!-- 批量导入文本弹窗 -->
    <ImportTextDialog
      ref="importDialogRef"
      v-model="importDialogVisible"
      :episode-id="selectedEpisodeId ? Number(selectedEpisodeId) : undefined"
      :project-id="projectStore.currentProjectId ? Number(projectStore.currentProjectId) : undefined"
      @confirm="handleConfirmUpload"
    />

    <!-- 故事板审阅弹窗 -->
    <StoryboardReviewDialog
      v-model="storyboardReviewDialogVisible"
      :episode-id="selectedEpisodeId ? Number(selectedEpisodeId) : undefined"
      :scene-type="2"
      :initial-index="0"
      :picture-ratio="projectStore.pictureRatio || 1"
      @refresh="() => loadVideos(true)"
    />

    <!-- 点数确认弹窗 -->
    <VideoPointsConfirmDialog
      v-model="pointsConfirmDialogVisible"
      :video-count="selectedIds.length"
      :total-points="totalPointsForBatch"
      @confirm="handleConfirmGenerate"
    />
  </div>
</template>

<script setup lang="ts" name="StepVideo">
  import {
    generateVideo,
    getVideoModelConfig,
    getVideoSceneList,
    importVideoPromptTemplate
  } from '@/api/workbench/episode';
  import type {
    DurationConfig,
    ResolutionConfig,
    VideoEpisodeInfoResponseDto,
    VideoModelConfigVo,
    VideoModelPointConfig,
    VideoSceneItemInfo
  } from '@/api/workbench/episode/types';
  import { queryStoryBoard } from '@/api/workbench/storyboard';
  import { useVideoUpdateListener } from '@/composables/useSSEListener';
  import { useProjectStore } from '@/store/modules/project';
  import { useUserStore } from '@/store/modules/user';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import ExportDropdown from '../../components/ExportDropdown.vue';
  import StoryboardReviewDialog from '../StepGridView/components/StoryboardReviewDialog.vue';
  import ImportTextDialog from './components/ImportTextDialog.vue';
  import VideoPointsConfirmDialog from './components/VideoPointsConfirmDialog.vue';
  import VideoTable from './components/VideoTable.vue';

  const projectStore = useProjectStore();
  const userStore = useUserStore();

  // 视频表格引用
  const videoTableRef = ref<InstanceType<typeof VideoTable>>();

  // 根据 projectStore.pictureRatio 计算 aspectRatio
  // pictureRatio: 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
  const aspectRatio = computed(() => {
    const ratioMap: Record<number, string> = {
      1: '16:9',
      2: '4:3',
      3: '1:1',
      4: '3:4',
      5: '9:16'
    };
    return ratioMap[projectStore.pictureRatio || 1] || '16:9';
  });

  // 导入弹窗引用
  const importDialogRef = ref<InstanceType<typeof ImportTextDialog>>();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 视频列表
  const videos = ref<VideoSceneItemInfo[]>([]);

  // 加载状态
  const loading = ref(false);

  // 防止重复加载的标记
  let loadingPromise: Promise<void> | null = null;

  // ==================== 新的三级联动模型配置 ====================
  // 所有模型配置列表
  const modelConfigs = ref<VideoModelConfigVo[]>([]);

  // 选中的模型、分辨率、时长
  const selectedModelCode = ref<string>('');
  const selectedResolution = ref<string>('');
  const selectedDuration = ref<number | undefined>(undefined);

  // 当前选中的模型对象
  const currentModel = computed(() => {
    return modelConfigs.value.find((m) => m.modelCode === selectedModelCode.value);
  });

  // 可选的分辨率列表（根据选中的模型）
  const availableResolutions = computed<ResolutionConfig[]>(() => {
    return currentModel.value?.resolutionConfigs || [];
  });

  // 当前选中的分辨率对象
  const currentResolution = computed(() => {
    return availableResolutions.value.find((r) => r.resolution === selectedResolution.value);
  });

  // 可选的时长列表（根据选中的分辨率）
  const availableDurations = computed<DurationConfig[]>(() => {
    return currentResolution.value?.durationConfigs || [];
  });

  // 当前选中的时长对象
  const currentDuration = computed(() => {
    return availableDurations.value.find((d) => d.duration === selectedDuration.value);
  });

  // 当前模型配置对象（用于传递给子组件）
  const currentModelConfigObj = computed<{
    modelCode: string;
    modelName: string;
    resolution: string;
    duration: number;
    points: number;
  } | null>(() => {
    if (!selectedModelCode.value || !selectedResolution.value || !selectedDuration.value) {
      return null;
    }
    return {
      modelCode: selectedModelCode.value,
      modelName: currentModel.value?.modelName || '',
      resolution: selectedResolution.value,
      duration: selectedDuration.value,
      points: currentDuration.value?.points || 0
    };
  });

  // 兼容旧的数据结构（用于传递给子组件）
  const videoModelPointConfigs = ref<VideoModelPointConfig[]>([]);

  // 格式化分辨率显示
  const formatResolution = (resolution?: string) => {
    if (!resolution) return '';
    if (resolution === '1920x1080' || resolution === '1920*1080') return '1080P';
    if (resolution === '1280x720' || resolution === '1280*720') return '720P';
    return resolution;
  };

  // 模型变化处理
  const handleModelChange = (modelCode: string) => {
    // 重置分辨率和时长
    selectedResolution.value = '';
    selectedDuration.value = undefined;

    // 自动选择第一个分辨率
    if (availableResolutions.value.length > 0) {
      selectedResolution.value = availableResolutions.value[0].resolution || '';
      handleResolutionChange(selectedResolution.value);
    }
  };

  // 分辨率变化处理
  const handleResolutionChange = (resolution: string) => {
    // 重置时长
    selectedDuration.value = undefined;

    // 自动选择第一个时长
    if (availableDurations.value.length > 0) {
      selectedDuration.value = availableDurations.value[0].duration;
    }
  };

  // 时长变化处理
  const handleDurationChange = (duration: number) => {
    // 时长变化后无需额外操作，currentModelConfigObj 会自动更新
  };

  // 全选状态
  const selectAll = ref(false);
  const isIndeterminate = ref(false);
  const selectedIds = ref<number[]>([]);

  // 故事板审阅弹窗
  const storyboardReviewDialogVisible = ref(false);

  // 批量导入弹窗
  const importDialogVisible = ref(false);

  // 点数确认弹窗
  const pointsConfirmDialogVisible = ref(false);

  // 计算批量生成所需总点数
  const totalPointsForBatch = computed(() => {
    if (!currentModelConfigObj.value || selectedIds.value.length === 0) {
      return 0;
    }
    return currentModelConfigObj.value.points * selectedIds.value.length;
  });

  // 添加滚动监听的函数
  const addScrollListener = () => {
    // 移除旧的监听器（如果存在）
    const tableWrapper = getTableWrapper();
    if (tableWrapper) {
      tableWrapper.removeEventListener('scroll', saveScrollPosition);
      tableWrapper.addEventListener('scroll', saveScrollPosition);
    }
  };

  // 监听 videos 数据变化，当数据加载完成后添加滚动监听
  watch(
    () => videos.value.length,
    (newLength) => {
      if (newLength > 0) {
        nextTick(() => {
          setTimeout(() => {
            addScrollListener();
          }, 200);
        });
      }
    }
  );

  // 初始化
  onMounted(async () => {
    // 加载视频模型配置
    await loadVideoModelConfig();

    // 如果有当前剧集ID，直接加载视频数据
    if (projectStore.currentEpisodeId) {
      selectedEpisodeId.value = projectStore.currentEpisodeId;
      await loadVideos();
    }
  });

  // 当组件从 KeepAlive 缓存中激活时重新加载数据
  onActivated(async () => {
    if (selectedEpisodeId.value) {
      await loadVideos(true); // 使用静默刷新
    }
  });

  // 监听 SSE 视频生成更新
  useVideoUpdateListener(
    (detail) => {
      // 无感刷新视频列表
      loadVideos(true);
    },
    {
      projectId: projectStore.currentProjectId,
      episodeId: selectedEpisodeId
    }
  );

  // 清理
  onBeforeUnmount(() => {
    const tableWrapper = getTableWrapper();
    if (tableWrapper) {
      tableWrapper.removeEventListener('scroll', saveScrollPosition);
    }
  });

  // 监听剧集变化
  watch(
    () => projectStore.currentEpisodeId,
    (newVal) => {
      if (newVal) {
        selectedEpisodeId.value = newVal;
        loadVideos();
      }
    }
  );

  // 加载视频模型配置
  const loadVideoModelConfig = async () => {
    try {
      const res = await getVideoModelConfig();
      if (res.data) {
        // 新版接口返回的是 VideoModelConfigVo 数组
        if (Array.isArray(res.data)) {
          modelConfigs.value = res.data;

          // 默认选择第一个模型
          if (modelConfigs.value.length > 0) {
            const firstModel = modelConfigs.value[0];
            selectedModelCode.value = firstModel.modelCode || '';

            // 自动选择第一个分辨率
            if (firstModel.resolutionConfigs && firstModel.resolutionConfigs.length > 0) {
              const firstResolution = firstModel.resolutionConfigs[0];
              selectedResolution.value = firstResolution.resolution || '';

              // 自动选择第一个时长
              if (firstResolution.durationConfigs && firstResolution.durationConfigs.length > 0) {
                selectedDuration.value = firstResolution.durationConfigs[0].duration;
              }
            }
          }

          // 构建兼容旧版的扁平化配置列表（用于子组件）
          const flatConfigs: VideoModelPointConfig[] = [];
          modelConfigs.value.forEach((model) => {
            model.resolutionConfigs?.forEach((resConfig) => {
              resConfig.durationConfigs?.forEach((durConfig) => {
                flatConfigs.push({
                  resolution: resConfig.resolution,
                  duration: durConfig.duration,
                  points: durConfig.points
                });
              });
            });
          });
          videoModelPointConfigs.value = flatConfigs;
        }
        // 兼容旧版接口返回格式
        else if (res.data.videoModelPointConfigs) {
          videoModelPointConfigs.value = res.data.videoModelPointConfigs;
          // 默认选择第一个配置
          if (videoModelPointConfigs.value.length > 0) {
            const firstConfig = videoModelPointConfigs.value[0];
            selectedResolution.value = firstConfig.resolution || '';
            selectedDuration.value = firstConfig.duration;
          }
        }
      }
    } catch (error) {
      console.error('加载视频模型配置失败:', error);
      ElMessage.error('加载视频模型配置失败');
    }
  };

  // 获取表格滚动容器
  const getTableWrapper = () => {
    // 尝试多种方式获取表格滚动容器
    if (!videoTableRef.value) {
      return null;
    }

    // 方法1: 通过组件的 $refs.tableRef 查找
    let wrapper = (videoTableRef.value as any)?.$refs?.tableRef?.$el?.querySelector('.el-table__body-wrapper');
    if (wrapper) {
      return wrapper;
    }

    // 方法2: 直接通过类名查找
    wrapper = document.querySelector('.video-table-container .el-table__body-wrapper');
    if (wrapper) {
      return wrapper;
    }

    return null;
  };

  // 保存滚动位置
  const saveScrollPosition = () => {
    const tableWrapper = getTableWrapper();
    if (tableWrapper && selectedEpisodeId.value) {
      const scrollKey = `videolist_scroll_${projectStore.currentProjectId}_${selectedEpisodeId.value}`;
      const scrollTop = tableWrapper.scrollTop;
      sessionStorage.setItem(scrollKey, String(scrollTop));
    }
  };

  // 恢复滚动位置
  const restoreScrollPosition = () => {
    if (!selectedEpisodeId.value) return;

    const scrollKey = `videolist_scroll_${projectStore.currentProjectId}_${selectedEpisodeId.value}`;
    const savedScroll = sessionStorage.getItem(scrollKey);

    if (savedScroll) {
      // 使用多次 nextTick 确保 DOM 完全渲染
      nextTick(() => {
        nextTick(() => {
          setTimeout(() => {
            const tableWrapper = getTableWrapper();
            if (tableWrapper) {
              tableWrapper.scrollTop = Number(savedScroll);
            }
          }, 100);
        });
      });
    }
  };

  // 加载视频列表（支持无感刷新）
  const loadVideos = async (silentRefresh = false) => {
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
        const res = await getVideoSceneList(Number(selectedEpisodeId.value));
        const episodeData: VideoEpisodeInfoResponseDto = res.data;

        if (episodeData && episodeData.episodeSceneItemInfoList && Array.isArray(episodeData.episodeSceneItemInfoList)) {
          // 过滤掉无效的场景数据
          const validScenes = episodeData.episodeSceneItemInfoList.filter((scene) => scene && scene.basicId);

          // 直接替换视频列表数据，确保数据完全同步
          videos.value = validScenes;

          // 过滤 selectedIds，移除已删除镜头的 ID
          const validBasicIds = new Set(validScenes.map((scene) => scene.basicId));
          const filteredSelectedIds = selectedIds.value.filter((id) => validBasicIds.has(id));

          // 只有在选中的 ID 发生变化时才更新（避免不必要的状态更新）
          if (filteredSelectedIds.length !== selectedIds.value.length) {
            selectedIds.value = filteredSelectedIds;
            // 更新全选状态
            selectAll.value = filteredSelectedIds.length === validScenes.length && validScenes.length > 0;
            isIndeterminate.value = filteredSelectedIds.length > 0 && filteredSelectedIds.length < validScenes.length;
          }
        } else {
          videos.value = [];
          // 清空选中状态
          selectedIds.value = [];
          selectAll.value = false;
          isIndeterminate.value = false;
        }

        // 恢复滚动位置
        restoreScrollPosition();
      } catch (error) {
        console.error('加载视频列表失败:', error);
        // 静默刷新失败时不清空数据
        if (!silentRefresh) {
          videos.value = [];
          ElMessage.error('加载视频列表失败');
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

  // 全选按钮点击
  const handleSelectBtnClick = () => {
    // 切换全选状态
    const newValue = !selectAll.value;
    selectAll.value = newValue;
    handleSelectAllChange(newValue);
  };

  // 全选change
  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      selectedIds.value = videos.value.map((v) => v.basicId!).filter((id) => id !== undefined);
    } else {
      selectedIds.value = [];
    }
    isIndeterminate.value = false;
  };

  // 选择change
  const handleSelectionChange = (ids: number[]) => {
    selectedIds.value = ids;
    selectAll.value = ids.length === videos.value.length && videos.value.length > 0;
    isIndeterminate.value = ids.length > 0 && ids.length < videos.value.length;
  };

  // 生成视频
  const handleGenerateVideo = async (basicIds: number[]) => {
    if (!currentModelConfigObj.value) {
      ElMessage.warning('请先选择模型配置');
      return;
    }

    // 保存当前滚动位置
    saveScrollPosition();

    const { resolution, duration, points } = currentModelConfigObj.value;
    const totalPoints = points * basicIds.length;

    try {
      await ElMessageBox.confirm(`确定要生成 ${basicIds.length} 个视频吗？\n将消耗 ${totalPoints} 点数`, '生成视频', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      });

      // 调用生成视频接口
      await generateVideo({
        basicIds,
        resolution,
        duration,
        modelCode: 'jm-3.0', // TODO: 从实际选择的模型获取
        pointsPerVideo: points
      });

      ElMessage.success('视频生成中，请稍候...');

      // 更新钱包积分
      await userStore.updateWalletPoints();

      // 无感刷新视频列表
      await loadVideos(true);
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('生成视频失败:', error);
        ElMessage.error('生成视频失败');
      }
    }
  };

  // 导入模板 - 打开弹窗
  const handleImportTemplate = () => {
    importDialogVisible.value = true;
  };

  // 确认上传
  const handleConfirmUpload = async (file: File) => {
    if (!importDialogRef.value) return;

    // 保存当前滚动位置
    saveScrollPosition();

    // 设置上传状态
    importDialogRef.value.setUploading(true);

    try {
      await importVideoPromptTemplate({ file, projectId: projectStore.currentProjectId || '' });
      ElMessage.success('导入成功');
      // 关闭弹窗
      importDialogRef.value.close();
      // 无感刷新视频列表
      await loadVideos(true);
    } catch (error) {
      console.error('导入失败:', error);
    } finally {
      importDialogRef.value.setUploading(false);
    }
  };

  // 打开故事板审阅弹窗
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
        sceneType: 2 // 视频类型
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

  // 批量生成 - 打开点数确认弹窗
  const handleBatchGenerate = () => {
    if (!currentModelConfigObj.value) {
      ElMessage.warning('请先选择模型配置');
      return;
    }
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请选择要生成的视频');
      return;
    }
    // 打开点数确认弹窗
    pointsConfirmDialogVisible.value = true;
  };

  // 确认生成视频
  const handleConfirmGenerate = async () => {
    if (!currentModelConfigObj.value) return;

    // 保存当前滚动位置
    saveScrollPosition();

    const { resolution, duration, points, modelCode } = currentModelConfigObj.value;

    try {
      // 调用生成视频接口
      await generateVideo({
        basicIds: selectedIds.value,
        resolution,
        duration,
        modelCode: modelCode || selectedModelCode.value,
        pointsPerVideo: points
      });

      ElMessage.success('视频生成中，请稍候...');

      // 更新钱包积分
      await userStore.updateWalletPoints();

      // 清空选中状态
      selectedIds.value = [];
      selectAll.value = false;
      isIndeterminate.value = false;
      // 无感刷新视频列表
      await loadVideos(true);
    } catch (error: any) {
      console.error('生成视频失败:', error);
      ElMessage.error('生成视频失败');
    }
  };
</script>

<style scoped lang="scss">
  .step-video {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    overflow: hidden;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    // background: #fff;
    border-radius: 4px;
    padding-top: 3px;

    .left-tools {
      display: flex;
      align-items: center;
      gap: 12px;

      // 全选按钮样式
      .select-btn {
        height: 32px;
        padding: 0 16px;
        border-radius: 8px;
        border: 1px solid #eee;
        background: #fff;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;
        font-family: 'PingFang SC';

        .select-text {
          color: #1d2129;
          transition: color 0.3s;
        }

        &:hover {
          border-color: #5252ff;

          .select-text {
            color: #5252ff;
          }

          :deep(.el-checkbox__label) {
            color: #5252ff;
          }
        }

        :deep(.el-checkbox) {
          margin: 0;

          .el-checkbox__label {
            font-size: 13px;
            color: #1d2129;
            padding-left: 8px;
            transition: color 0.3s;
          }

          .el-checkbox__inner {
            width: 16px;
            height: 16px;
            border-radius: 4px;
          }

          .el-checkbox__input.is-checked .el-checkbox__inner {
            background-color: #5252ff;
            border-color: #5252ff;
          }

          // 半选状态样式
          .el-checkbox__input.is-indeterminate .el-checkbox__inner {
            background-color: #5252ff;
            border-color: #5252ff;

            &::before {
              background-color: #fff;
            }
          }
        }
      }
      .toolbar-btn {
        height: 32px;
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid #eee;
        background: #fff;
        font-size: 13px;
        display: flex;
        align-items: center;
        color: #1d2129;

        &:hover {
          border-color: #5252ff;
          color: #5252ff;
        }
      }

      .review-button {
        display: flex;
        width: 64px;
        height: 32px;
        padding: 8px 16px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        background: #5252ff;
        color: #fff;
        font-size: 13px;
        margin-left: 0;
      }
    }

    .right-tools {
      display: flex;
      align-items: center;
      gap: 12px;

      .model-selector {
        display: flex;
        align-items: center;
        gap: 12px;

        .model-select,
        .resolution-select,
        .duration-select {
          width: 120px;

          :deep(.el-input__wrapper) {
            background-color: #fff !important;
            border-radius: 6px;
            box-shadow: 0 0 0 1px #dcdfe6 inset;
            transition: all 0.3s;

            &:hover {
              box-shadow: 0 0 0 1px #5252ff inset;
            }

            &.is-focus {
              box-shadow: 0 0 0 1px #5252ff inset;
            }
          }

          :deep(.el-input__inner) {
            font-size: 13px;
            color: #1d2129;
            font-weight: 500;
          }
        }

        .model-select {
          width: 140px;
        }

        .duration-select {
          width: 100px;
        }
      }
    }
  }

  .content-area {
    flex: 1;
    overflow: hidden;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    :deep(.el-table) {
      border-radius: 4px;

      .el-table__header-wrapper {
        .el-table__header {
          th {
            background: #fafafa;
            color: #1d2129;
            font-weight: 600;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
          }
        }
      }

      .el-table__body-wrapper {
        .el-table__body {
          tr {
            &:hover {
              background: #f7f8fa;
            }

            td {
              border-bottom: 1px solid #f0f0f0;
            }
          }
        }
      }
    }
  }
</style>
