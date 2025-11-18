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
        <el-button type="primary" class="review-button" @click="handleOpenReviewDialog"> 审批 </el-button>
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
        @selection-change="handleSelectionChange"
        @generate-video="handleGenerateVideo"
        @refresh="loadVideos"
      />
    </div>

    <!-- 批量导入文本弹窗 -->
    <ImportTextDialog ref="importDialogRef" v-model="importDialogVisible" @confirm="handleConfirmUpload" />

    <!-- 故事板审阅弹窗 -->
    <StoryboardReviewDialog
      v-model="storyboardReviewDialogVisible"
      :scene-list="reviewSceneList"
      :initial-index="0"
      @refresh="loadVideos"
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
  import { useProjectStore } from '@/store/modules/project';
  import { useUserStore } from '@/store/modules/user';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import StoryboardReviewDialog from '../StepGridView/components/StoryboardReviewDialog.vue';
  import ImportTextDialog from './components/ImportTextDialog.vue';
  import VideoPointsConfirmDialog from './components/VideoPointsConfirmDialog.vue';
  import VideoTable from './components/VideoTable.vue';

  const projectStore = useProjectStore();
  const userStore = useUserStore();

  // 视频表格引用
  const videoTableRef = ref<InstanceType<typeof VideoTable>>();

  // 导入弹窗引用
  const importDialogRef = ref<InstanceType<typeof ImportTextDialog>>();

  // 选中的剧集
  const selectedEpisodeId = ref<string | number | null>(null);

  // 视频列表
  const videos = ref<VideoSceneItemInfo[]>([]);

  // 加载状态
  const loading = ref(false);

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
    console.log('Selected config:', currentModelConfigObj.value);
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

  // 转换为审阅弹窗需要的数据格式
  const reviewSceneList = computed(() => {
    return videos.value.map((video) => ({
      id: video.basicId,
      orderNo: video.basicId,
      sceneDesc: video.sceneDesc,
      sceneHint: video.sceneHint,
      dialogues: video.dialogues,
      imgStatus: video.sceneStatus,
      commentCnt: video.commentCount || 0,
      // 使用视频URL作为图片URL（审阅弹窗会显示视频封面或视频本身）
      originOssUrl: video.materialInfoVoList?.[0]?.originOssUrl || video.materialInfoVoList?.[0]?.previewOssUrl || '',
      previewOssUrl: video.materialInfoVoList?.[0]?.previewOssUrl || video.materialInfoVoList?.[0]?.originOssUrl || ''
    }));
  });

  // 添加滚动监听的函数
  const addScrollListener = () => {
    // 移除旧的监听器（如果存在）
    const tableWrapper = getTableWrapper();
    if (tableWrapper) {
      tableWrapper.removeEventListener('scroll', saveScrollPosition);
      tableWrapper.addEventListener('scroll', saveScrollPosition);
      console.log('已添加滚动监听');
    } else {
      console.log('表格容器未找到，无法添加滚动监听');
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
      console.log('videoTableRef 为空');
      return null;
    }

    // 方法1: 通过组件的 $refs.tableRef 查找
    let wrapper = videoTableRef.value.$refs?.tableRef?.$el?.querySelector('.el-table__body-wrapper');
    if (wrapper) {
      console.log('通过 $refs.tableRef 找到表格容器');
      return wrapper;
    }

    // 方法2: 直接通过类名查找
    wrapper = document.querySelector('.video-table-container .el-table__body-wrapper');
    if (wrapper) {
      console.log('通过类名找到表格容器');
      return wrapper;
    }

    console.log('未找到表格容器');
    return null;
  };

  // 保存滚动位置
  const saveScrollPosition = () => {
    const tableWrapper = getTableWrapper();
    if (tableWrapper && selectedEpisodeId.value) {
      const scrollKey = `videolist_scroll_${projectStore.currentProjectId}_${selectedEpisodeId.value}`;
      const scrollTop = tableWrapper.scrollTop;
      sessionStorage.setItem(scrollKey, String(scrollTop));
      console.log('保存滚动位置:', scrollKey, scrollTop);
    }
  };

  // 恢复滚动位置
  const restoreScrollPosition = () => {
    if (!selectedEpisodeId.value) return;

    const scrollKey = `videolist_scroll_${projectStore.currentProjectId}_${selectedEpisodeId.value}`;
    const savedScroll = sessionStorage.getItem(scrollKey);
    console.log('尝试恢复滚动位置:', scrollKey, savedScroll);

    if (savedScroll) {
      // 使用多次 nextTick 确保 DOM 完全渲染
      nextTick(() => {
        nextTick(() => {
          setTimeout(() => {
            const tableWrapper = getTableWrapper();
            console.log('表格容器:', tableWrapper);
            if (tableWrapper) {
              tableWrapper.scrollTop = Number(savedScroll);
              console.log('已恢复滚动位置:', tableWrapper.scrollTop);
            }
          }, 100);
        });
      });
    }
  };

  // 加载视频列表
  const loadVideos = async () => {
    if (!selectedEpisodeId.value) return;

    loading.value = true;
    try {
      const res = await getVideoSceneList(Number(selectedEpisodeId.value));
      const episodeData: VideoEpisodeInfoResponseDto = res.data;

      if (episodeData && episodeData.episodeSceneItemInfoList && Array.isArray(episodeData.episodeSceneItemInfoList)) {
        // 过滤掉无效的场景数据
        const validScenes = episodeData.episodeSceneItemInfoList.filter((scene) => scene && scene.basicId);
        videos.value = validScenes;
      } else {
        videos.value = [];
      }

      // 恢复滚动位置
      restoreScrollPosition();
    } catch (error) {
      console.error('加载视频列表失败:', error);
      videos.value = [];
      ElMessage.error('加载视频列表失败');
    } finally {
      loading.value = false;
    }
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

      await loadVideos();
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
      await importVideoPromptTemplate(file);
      ElMessage.success('导入成功');
      // 关闭弹窗
      importDialogRef.value.close();
      await loadVideos();
    } catch (error) {
      console.error('导入失败:', error);
      ElMessage.error('导入失败');
    } finally {
      importDialogRef.value.setUploading(false);
    }
  };

  // 打开故事板审阅弹窗
  const handleOpenReviewDialog = () => {
    if (videos.value.length === 0) {
      ElMessage.warning('暂无视频可供审阅');
      return;
    }
    storyboardReviewDialogVisible.value = true;
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
      // 刷新列表
      await loadVideos();
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
