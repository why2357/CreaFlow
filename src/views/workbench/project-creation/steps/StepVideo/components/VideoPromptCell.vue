<template>
  <div class="video-prompt-cell">
    <!-- 提示词区域 -->
    <div class="prompt-area">
      <!-- 只读状态：点击可进入编辑状态 -->
      <div v-if="!isExpanded" class="prompt-readonly" @click="handlePromptFocus">
        <span class="prompt-text">{{ promptText || '点击输入视频提示词...' }}</span>
      </div>

      <!-- 编辑状态：显示输入框 -->
      <div v-else class="prompt-editing">
        <el-input
          ref="promptInputRef"
          v-model="promptText"
          type="textarea"
          :rows="4"
          placeholder="请输入视频提示词..."
          class="prompt-input"
          @blur="handlePromptBlur"
        />
      </div>
    </div>

    <!-- 底部：尾帧上传、箭头按钮和生成按钮（初始状态） -->
    <div class="bottom-actions-initial">
      <!-- 左侧：尾帧上传 -->
      <div class="left-section">
        <div class="tail-frame-wrapper">
          <!-- 已上传尾帧的预览 -->
          <div v-if="tailFrameUrl" class="tail-frame-preview">
            <el-image :src="tailFrameUrl" fit="cover" class="preview-image" />
            <!-- 删除按钮 -->
            <div class="delete-overlay" @click.stop="handleRemoveTailFrame">
              <el-icon :size="16">
                <Close />
              </el-icon>
            </div>
          </div>
          <!-- 上传按钮 -->
          <div v-else class="tail-frame-upload" @click="handleTailFrameClick">
            <el-icon :size="12" class="upload-icon">
              <Plus />
            </el-icon>
            <span class="upload-text">尾帧</span>
          </div>
        </div>
        <!-- 隐藏的文件上传input -->
        <input
          ref="tailFrameInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleTailFrameUpload"
        />
      </div>
      <div class="rig-box">
        <!-- 右侧：箭头按钮和生成按钮 -->
        <div class="right-section">
          <div class="bottom-actions-expanded" :class="{ 'is-hidden': !showModelSelector }">
            <el-select
              v-model="selectedModelCode"
              placeholder="选择模型"
              size="default"
              class="model-selector"
              @change="handleModelChange"
            >
              <el-option
                v-for="model in modelConfigs"
                :key="model.modelCode"
                :label="model.modelName"
                :value="model.modelCode"
              />
            </el-select>
          </div>
          <!-- 展开/收起箭头按钮 -->
          <el-button circle size="small" class="toggle-btn" @click="showModelSelector = !showModelSelector">
            <el-icon>
              <ArrowUp v-if="showModelSelector" />
              <ArrowDown v-else />
            </el-icon>
          </el-button>
        </div>

        <!-- 展开的模型选择器（第二行） -->
        <div class="bottom-actions-expanded">
          <div v-if="showModelSelector">
            <el-select
              v-model="selectedResolution"
              placeholder="分辨率"
              size="default"
              class="resolution-selector"
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

            <el-select
              v-model="selectedDuration"
              placeholder="时长"
              size="default"
              class="duration-selector"
              :disabled="!selectedResolution"
            >
              <el-option
                v-for="durConfig in availableDurations"
                :key="durConfig.duration"
                :label="`${durConfig.duration}S`"
                :value="durConfig.duration"
              />
            </el-select>
          </div>
          <el-button
            type="primary"
            size="default"
            class="generate-btn"
            :disabled="isGenerating"
            @click="handleGenerate"
          >
            生成
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { editVideoPrompt, generateVideo } from '@/api/workbench/episode';
  import type {
    DurationConfig,
    ResolutionConfig,
    VideoModelConfigVo,
    VideoSceneItemInfo
  } from '@/api/workbench/episode/types';
  import { uploadFile } from '@/utils/uploadFile';
  import { ArrowDown, ArrowUp, Close, Plus } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, nextTick, ref, watch } from 'vue';

  interface Props {
    video: VideoSceneItemInfo;
    modelConfig?: {
      modelCode: string;
      modelName: string;
      resolution: string;
      duration: number;
      points: number;
    } | null;
    allModelConfigs?: Array<{
      resolution?: string;
      duration?: number;
      points?: number;
    }>;
    modelConfigs?: VideoModelConfigVo[];
  }

  const props = withDefaults(defineProps<Props>(), {
    modelConfig: null,
    allModelConfigs: () => [],
    modelConfigs: () => []
  });

  const emit = defineEmits<{
    (e: 'update', basicId: number, videoPrompt: string): void;
    (
      e: 'generate',
      data: { basicId: number; modelCode: string; resolution: string; duration: number; tailFrameOssId?: number }
    ): void;
  }>();

  const promptText = ref(props.video.videoPrompt || '');
  const isExpanded = ref(false);
  const showModelSelector = ref(false);
  const promptInputRef = ref<any>(null);

  // ==================== 提示词相关 ====================
  // 点击只读区域，进入编辑状态并聚焦
  const handlePromptFocus = async () => {
    isExpanded.value = true;
    await nextTick();
    promptInputRef.value?.focus();
  };

  // 失焦时保存并退出编辑状态
  const handlePromptBlur = () => {
    if (!props.video.basicId) return;

    // 只有当内容发生变化时才触发更新
    if (promptText.value !== (props.video.videoPrompt || '')) {
      emit('update', props.video.basicId, promptText.value);
    }

    // 退出编辑状态
    isExpanded.value = false;
  };

  // ==================== 尾帧相关 ====================
  const tailFrameInputRef = ref<HTMLInputElement>();
  const tailFrameUrl = ref<string>(props.video.endFrameOssUrl || '');
  const tailFrameOssId = ref<number | undefined>(props.video.endFrameOssId);

  // 点击尾帧按钮
  const handleTailFrameClick = () => {
    tailFrameInputRef.value?.click();
  };

  // 处理尾帧上传
  const handleTailFrameUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请上传图片文件');
      target.value = '';
      return;
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过10MB');
      target.value = '';
      return;
    }

    // 验证图片尺寸
    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(imageUrl);

          // 检查图片尺寸，长宽都必须大于320px
          if (img.width <= 320 || img.height <= 320) {
            reject(new Error(`图片尺寸过小，当前尺寸为 ${img.width}×${img.height}，长宽都必须大于320px`));
            return;
          }

          resolve(true);
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('图片加载失败，请检查文件是否损坏'));
        };

        img.src = imageUrl;
      });
    } catch (error: any) {
      ElMessage.error(error.message || '图片验证失败');
      target.value = '';
      return;
    }

    try {
      ElMessage.info('正在上传尾帧图片...');

      // 获取文件后缀
      const fileSuffix = file.name.substring(file.name.lastIndexOf('.'));

      // 上传文件到 OSS
      const uploadRes = await uploadFile({
        file,
        fileSuffix,
        originalFileName: file.name,
        fileType: 'image',
        resourceType: 2, // 用户资源
        needSync: 0
      });

      tailFrameUrl.value = uploadRes.url || '';
      tailFrameOssId.value = Number(uploadRes.ossId);

      // 上传成功后，调用接口保存尾帧信息
      if (props.video.basicId) {
        await editVideoPrompt({
          basicId: props.video.basicId,
          endFrameOssId: tailFrameOssId.value,
          endFrameOssUrl: tailFrameUrl.value
        });
      }

      ElMessage.success('尾帧上传成功');
    } catch (error) {
      console.error('上传尾帧失败:', error);
      ElMessage.error('上传尾帧失败');
    } finally {
      // 清空input，允许重复选择同一文件
      target.value = '';
    }
  };

  // 移除尾帧
  const handleRemoveTailFrame = async () => {
    try {
      // 调用接口清空尾帧信息
      if (props.video.basicId) {
        await editVideoPrompt({
          basicId: props.video.basicId,
          endFrameMaterialId: 0,
          endFrameOssUrl: ''
        });
      }

      tailFrameUrl.value = '';
      tailFrameOssId.value = undefined;
      ElMessage.success('尾帧已移除');
    } catch (error) {
      console.error('移除尾帧失败:', error);
      ElMessage.error('移除尾帧失败');
    }
  };

  // ==================== 模型配置相关 ====================
  const selectedModelCode = ref<string>('');
  const selectedResolution = ref<string>('');
  const selectedDuration = ref<number | undefined>(undefined);

  // 当前选中的模型对象
  const currentModel = computed(() => {
    return props.modelConfigs.find((m) => m.modelCode === selectedModelCode.value);
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

  // 格式化分辨率显示
  const formatResolution = (resolution?: string) => {
    if (!resolution) return '';
    if (resolution === '1920x1080' || resolution === '1920*1080') return '1080P';
    if (resolution === '1280x720' || resolution === '1280*720') return '720P';
    return resolution;
  };

  // 模型变化处理
  const handleModelChange = () => {
    // 重置分辨率和时长
    selectedResolution.value = '';
    selectedDuration.value = undefined;

    // 自动选择第一个分辨率
    if (availableResolutions.value.length > 0) {
      selectedResolution.value = availableResolutions.value[0].resolution || '';
      handleResolutionChange();
    }
  };

  // 分辨率变化处理
  const handleResolutionChange = () => {
    // 重置时长
    selectedDuration.value = undefined;

    // 自动选择第一个时长
    if (availableDurations.value.length > 0) {
      selectedDuration.value = availableDurations.value[0].duration;
    }
  };

  // 初始化模型配置（使用传入的prop）
  const initModelConfigs = () => {
    if (props.modelConfigs.length > 0) {
      const firstModel = props.modelConfigs[0];
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
  };

  // 监听modelConfigs prop变化，初始化配置
  watch(
    () => props.modelConfigs,
    (newConfigs) => {
      if (newConfigs && newConfigs.length > 0 && !selectedModelCode.value) {
        initModelConfigs();
      }
    },
    { immediate: true }
  );

  // 监听父组件的 modelConfig 变化，同步到当前组件
  watch(
    () => props.modelConfig,
    (newConfig) => {
      if (newConfig) {
        // 同步模型、分辨率、时长选择
        selectedModelCode.value = newConfig.modelCode;
        selectedResolution.value = newConfig.resolution;
        selectedDuration.value = newConfig.duration;
      }
    },
    { deep: true }
  );

  // 监听video变化
  watch(
    () => props.video.videoPrompt,
    (newVal) => {
      promptText.value = newVal || '';
    }
  );

  // 监听尾帧信息变化
  watch(
    () => [props.video.endFrameOssId, props.video.endFrameOssUrl],
    ([newOssId, newOssUrl]) => {
      tailFrameOssId.value = newOssId as number | undefined;
      tailFrameUrl.value = (newOssUrl as string) || '';
    }
  );

  // 判断是否正在生成中
  const isGenerating = computed(() => {
    // taskStatus: 0-待执行 1-执行中
    return props.video.taskStatus === 0 || props.video.taskStatus === 1;
  });

  // 生成视频
  const handleGenerate = async () => {
    if (!props.video.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    if (!selectedModelCode.value || !selectedResolution.value || !selectedDuration.value) {
      ElMessage.warning('请选择完整的模型配置');
      return;
    }

    // 如果正在生成中，不允许重复生成
    if (isGenerating.value) {
      ElMessage.warning('视频生成中，请稍后...');
      return;
    }

    try {
      // 单个生成时直接生成，不弹确认弹窗
      // 先保存提示词（如果有变更）
      if (promptText.value !== (props.video.videoPrompt || '')) {
        emit('update', props.video.basicId, promptText.value);
      }

      // 调用生成视频API
      const generateRequest = {
        basicIds: [props.video.basicId],
        modelCode: selectedModelCode.value,
        resolution: selectedResolution.value,
        duration: selectedDuration.value,
        tailFrameOssId: tailFrameOssId.value
      };

      // 调用生成视频API
      await generateVideo(generateRequest);

      ElMessage.success('视频生成中，请稍候...');

      // 触发生成事件，通知父组件刷新列表数据
      emit('generate', {
        basicId: props.video.basicId,
        modelCode: selectedModelCode.value,
        resolution: selectedResolution.value,
        duration: selectedDuration.value,
        tailFrameOssId: tailFrameOssId.value
      });
    } catch (error: any) {
      // API调用失败
      console.error('生成视频失败:', error);
      ElMessage.error(error?.message || '生成视频失败，请稍后重试');
    }
  };
</script>

<style scoped lang="scss">
  .video-prompt-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .prompt-area {
      width: 100%;

      // 只读状态样式
      .prompt-readonly {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: text;
        transition: background 0.2s;
        min-height: 36px;

        &:hover {
          background: #eef0f3;
        }

        .prompt-text {
          flex: 1;
          font-size: 13px;
          color: #4e5969;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      // 编辑状态样式
      .prompt-editing {
        .prompt-input {
          width: 100%;

          :deep(.el-textarea__inner) {
            font-size: 13px;
            line-height: 1.5;
            resize: none;
          }
        }
      }
    }

    // 底部初始状态：尾帧上传 + 箭头按钮 + 生成按钮
    .bottom-actions-initial {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      .left-section {
        display: flex;
        align-items: center;

        .tail-frame-wrapper {
          display: flex;
          align-items: center;

          // 尾帧上传按钮（未上传状态）
          .tail-frame-upload {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 52px;
            transform: rotate(-4.971deg);
            padding: 13px 8px 10px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            background: #f7f8fa;

            &:hover {
              color: #5252ff;
              background: #f5f5ff;
              .upload-text {
                color: #5252ff;
              }
              .upload-icon {
                color: #5252ff;
              }
            }

            .upload-icon {
              color: #86909c;
              transition: color 0.2s;
            }

            .upload-text {
              margin-top: 6px;
              font-size: 12px;
              color: #86909c;
            }
          }

          // 尾帧预览（已上传状态）
          .tail-frame-preview {
            position: relative;
            width: 40px;
            height: 52px;
            transform: rotate(-4.971deg);
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid #e5e7eb;

            .preview-image {
              width: 100%;
              height: 100%;
            }

            // 删除按钮遮罩
            .delete-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transition: opacity 0.2s;
              cursor: pointer;

              .el-icon {
                color: #fff;
              }
            }

            &:hover .delete-overlay {
              opacity: 1;
            }
          }
        }
      }
      .rig-box {
        display: flex;
        flex-direction: column;
      }

      .right-section {
        display: flex;
        align-items: center;
        gap: 8px;

        .toggle-btn {
          display: flex;
          width: 20px;
          height: 20px;
          justify-content: center;
          align-items: center;
          border-radius: 4px;
          border: 1px solid #e5e6eb;
        }

        .is-hidden {
          visibility: hidden;
        }
      }
    }

    // 展开的模型选择器（第二行）
    .bottom-actions-expanded {
      display: flex;
      align-items: center;
      justify-content: end;
      gap: 8px;
      margin-top: 8px;

      .model-selector {
        flex: 1;
        width: 210px;
      }

      .resolution-selector {
        width: 90px;
        margin-right: 6px;
      }
      .duration-selector {
        width: 70px;
        margin-right: 6px;
      }

      .generate-btn {
        display: flex;
        width: 64px;
        height: 32px;
        padding: 8px 16px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        background: #5252ff;
      }
    }
  }
</style>
