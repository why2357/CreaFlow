<template>
  <!-- Custom full-screen modal overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="dialogVisible" class="scene-image-edit-overlay" @click.self="handleClose">
        <div class="edit-container">
          <!-- Main Image Preview with Close Button -->
          <div class="main-image-wrapper">
            <div class="main-image-container">
              <el-image v-if="mainImageUrl" :src="mainImageUrl" fit="contain" class="main-preview-image" />
              <div v-else class="empty-main-preview">
                <el-icon :size="80"><Picture /></el-icon>
                <p>暂无图片</p>
              </div>

              <!-- Close Button -->
              <div class="close-button" @click="handleClose">
                <el-icon :size="14"><Close /></el-icon>
              </div>
            </div>
          </div>

          <!-- Control Panel -->
          <div class="control-panel">
            <!-- Reference Images (Overlapping) -->
            <div class="reference-images-section">
              <div
                class="reference-images-stack"
                :class="{ 'is-expanded': isHoveringImages }"
                @mouseenter="handleImagesMouseEnter"
                @mouseleave="handleImagesMouseLeave"
              >
                <TransitionGroup name="stack-slide">
                  <div
                    v-for="(img, index) in uploadedImages"
                    :key="img.ossId"
                    class="reference-image-item"
                    :class="{ 'is-hovered': isHoveringImages, 'is-uploading': img.uploading }"
                    :style="getImageStackStyle(index, isHoveringImages)"
                  >
                    <el-image :src="img.url" fit="cover" class="reference-thumbnail" hide-on-click-modal />

                    <!-- Upload Progress Overlay -->
                    <Transition name="progress-fade">
                      <div v-if="img.uploading" class="upload-progress-overlay">
                        <div class="progress-ring">
                          <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle
                              class="progress-ring-bg"
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="rgba(255,255,255,0.2)"
                              stroke-width="3"
                            />
                            <circle
                              class="progress-ring-circle"
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#5252ff"
                              stroke-width="3"
                              stroke-linecap="round"
                              :style="{
                                strokeDasharray: `${2 * Math.PI * 15}`,
                                strokeDashoffset: `${2 * Math.PI * 15 * (1 - (img.progress || 0) / 100)}`
                              }"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                          <span class="progress-text">{{ Math.round(img.progress || 0) }}%</span>
                        </div>
                      </div>
                    </Transition>

                    <!-- Delete Button (shown on hover expand) -->
                    <Transition name="delete-fade">
                      <div
                        v-if="isHoveringImages && !img.uploading"
                        class="delete-button"
                        @click.stop="removeImage(index)"
                      >
                        <el-icon :size="16">
                          <Close />
                        </el-icon>
                      </div>
                    </Transition>
                  </div>

                  <!-- Add More Button when expanded (shown when less than 3 images) -->
                  <div
                    v-if="uploadedImages.length < 3 && (uploadedImages.length === 0 || isHoveringImages)"
                    :key="'add-button'"
                    class="reference-image-item add-more-button"
                    :class="{ 'is-hovered': isHoveringImages, 'is-empty': uploadedImages.length === 0 }"
                    :style="getAddButtonStyle(uploadedImages.length, isHoveringImages)"
                    @click.stop="triggerUpload"
                  >
                    <div class="add-more-content">
                      <svg-icon icon-class="fy-add" style="height: 16px; width: 16px" />
                      <!-- <el-icon :size="uploadedImages.length === 0 ? 16 : 21" class="add-icon">
                        <Plus />
                      </el-icon> -->
                    </div>
                  </div>
                </TransitionGroup>
              </div>

              <!-- Circular Add Button (positioned at bottom-right, shown when collapsed and has images) -->
              <div
                v-if="uploadedImages.length > 0 && uploadedImages.length < 3 && !isHoveringImages"
                class="circular-add-button"
                @click.stop="triggerUpload"
              >
                <svg-icon icon-class="fy-add" style="height: 18px; width: 18px" />
              </div>
            </div>

            <!-- Right Side Controls -->
            <div class="controls-section">
              <!-- Prompt Input -->
              <div class="prompt-input-wrapper">
                <el-input
                  v-model="prompt"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入编辑图像的提示词"
                  class="prompt-textarea"
                  resize="none"
                />
              </div>

              <!-- Bottom Controls Row -->
              <div class="bottom-controls">
                <!-- Model Dropdown -->
                <el-dropdown trigger="click" @command="handleModelChange">
                  <el-button class="model-btn">
                    {{ currentModelName }}
                    <svg-icon icon-class="fy-down" style="height: 16px; width: 16px; margin-left: 6px" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="model in modelList" :key="model.modelCode" :command="model.modelCode">
                        {{ model.modelName }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <!-- Cost Indicator -->
                <div class="cost-indicator">
                  <el-icon :size="14" class="cost-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <g clip-path="url(#clip0_1927_9380)">
                        <path
                          d="M6.4266 1.64127C6.45159 1.50745 6.5226 1.38659 6.62732 1.29962C6.73204 1.21265 6.86388 1.16504 7.00001 1.16504C7.13614 1.16504 7.26798 1.21265 7.37271 1.29962C7.47743 1.38659 7.54844 1.50745 7.57343 1.64127L8.18651 4.88344C8.23006 5.11394 8.34207 5.32596 8.50795 5.49184C8.67382 5.65771 8.88584 5.76973 9.11635 5.81327L12.3585 6.42635C12.4923 6.45135 12.6132 6.52235 12.7002 6.62708C12.7871 6.7318 12.8347 6.86364 12.8347 6.99977C12.8347 7.1359 12.7871 7.26774 12.7002 7.37246C12.6132 7.47718 12.4923 7.54819 12.3585 7.57319L9.11635 8.18627C8.88584 8.22981 8.67382 8.34183 8.50795 8.5077C8.34207 8.67358 8.23006 8.8856 8.18651 9.1161L7.57343 12.3583C7.54844 12.4921 7.47743 12.6129 7.37271 12.6999C7.26798 12.7869 7.13614 12.8345 7.00001 12.8345C6.86388 12.8345 6.73204 12.7869 6.62732 12.6999C6.5226 12.6129 6.45159 12.4921 6.4266 12.3583L5.81351 9.1161C5.76997 8.8856 5.65795 8.67358 5.49208 8.5077C5.32621 8.34183 5.11418 8.22981 4.88368 8.18627L1.64151 7.57319C1.5077 7.54819 1.38684 7.47718 1.29987 7.37246C1.21289 7.26774 1.16528 7.1359 1.16528 6.99977C1.16528 6.86364 1.21289 6.7318 1.29987 6.62708C1.38684 6.52235 1.5077 6.45135 1.64151 6.42635L4.88368 5.81327C5.11418 5.76973 5.32621 5.65771 5.49208 5.49184C5.65795 5.32596 5.76997 5.11394 5.81351 4.88344L6.4266 1.64127Z"
                          fill="#FF7D00"
                          stroke="#FF7D00"
                          stroke-width="1.16667"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1927_9380">
                          <rect width="14" height="14" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </el-icon>
                  <span class="cost-text">{{ modelPoints }}/次</span>
                </div>

                <!-- Generate Button -->
                <el-button type="primary" class="generate-button" :loading="loading" @click="handleGenerate">
                  生成
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Hidden File Input -->
  <input ref="fileInputRef" type="file" accept="image/*" multiple style="display: none" @change="handleFileSelected" />
</template>

<script setup lang="ts">
  import { editSceneImage } from '@/api/workbench/storyboard';
  import { useProjectStore } from '@/store/modules/project';
  import { useUserStore } from '@/store/modules/user';
  import { uploadFile } from '@/utils/uploadFile';
  import { Close, Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';

  interface UploadedImage {
    url: string;
    ossId: number;
    file?: File;
    uploading?: boolean; // 上传中状态
    progress?: number; // 上传进度 0-100
  }

  interface Props {
    modelValue: boolean;
    basicId?: number;
    mainImageUrl?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    mainImageUrl: ''
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }>();

  // Get stores
  const projectStore = useProjectStore();
  const userStore = useUserStore();

  // Dialog visibility
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  // Get text-to-image model list
  const modelList = computed(() => projectStore.t2iModelInfoList || []);

  // State
  const loading = ref(false);
  const uploadedImages = ref<UploadedImage[]>([]);
  const selectedModel = ref('');
  const prompt = ref('');
  const fileInputRef = ref<HTMLInputElement>();
  const isHoveringImages = ref(false);
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  // Model points (from model list)
  const modelPoints = computed(() => {
    const model = modelList.value.find((m) => m.modelCode === selectedModel.value);
    return model?.points || 1;
  });

  // Current model name
  const currentModelName = computed(() => {
    const model = modelList.value.find((m) => m.modelCode === selectedModel.value);
    return model?.modelName || '请选择模型';
  });

  // Handle model change
  const handleModelChange = (modelCode: string) => {
    selectedModel.value = modelCode;
  };

  // Get stacked image styles (overlapping effect with expand animation)
  const getImageStackStyle = (index: number, isExpanded: boolean) => {
    // 旋转角度数组：针对3张图的情况
    // index 0 (第一张上传) -> 最下面，不旋转 (0deg)
    // index 1 (第二张上传) -> 中间，旋转 (-10.567deg)
    // index 2 (第三张上传) -> 最上面，旋转 (-19.954deg)
    const rotations = [0, -10.567, -19.954];

    // 堆叠顺序：第三张(index 2)在最上面，第二张(index 1)在中间，第一张(index 0)在最下面
    const stackOrder = index + 1; // index 越大，zIndex 越大

    if (isExpanded) {
      // 展开状态：横向紧密排列，无间距
      const expandedOffsets = [
        { left: '0px', top: '0px' },
        { left: '60px', top: '0px' },
        { left: '120px', top: '0px' }
      ];

      // 展开状态的旋转角度：第一张不旋转，第二张向左旋转20度，第三张向右旋转20度
      const expandedRotations = [-10, 3, 20];

      return {
        transform: `rotate(${expandedRotations[index]}deg)`,
        transformOrigin: 'center center',
        zIndex: 10 + index,
        position: 'absolute' as const,
        ...expandedOffsets[index],
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    } else {
      // 收起状态：所有图片都围绕第一张图片的中心点 (30px, 40px) 旋转堆叠
      // 图片尺寸：60px × 80px，中心点在 (30px, 40px)

      // 位置偏移数组：
      // index 0 (第一张) -> 最下面，位置基准 (0, 0)
      // index 1 (第二张) -> 中间，偏移
      // index 2 (第三张) -> 最上面，偏移更多
      const collapsedOffsets = [
        { left: '0px', top: '0px' }, // 第一张：最下面
        { left: '5.49px', top: '2.55px' }, // 第二张：中间
        { left: '12.32px', top: '7.38px' } // 第三张：最上面
      ];

      // 计算变换原点：所有图片都围绕第一张图片的中心点旋转
      // 第一张图片：围绕自己的中心点 (50%, 50%)
      // 第二张、第三张：围绕第一张图片的中心点，需要计算相对位置
      let transformOrigin = 'center center';
      if (index > 0) {
        // 计算当前图片相对于第一张图片中心的偏移
        const offset = collapsedOffsets[index];
        const offsetX = -parseFloat(offset.left);
        const offsetY = -parseFloat(offset.top);
        transformOrigin = `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
      }

      return {
        transform: `rotate(${rotations[index]}deg)`,
        transformOrigin, // 围绕第一张图片的中心点旋转
        zIndex: stackOrder, // 第三张 zIndex 最大
        position: 'absolute' as const,
        ...collapsedOffsets[index],
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    }
  };

  // Get add button position style
  const getAddButtonStyle = (currentCount: number, isExpanded: boolean) => {
    // When empty (0 images), take full container size
    if (currentCount === 0) {
      return {
        position: 'relative' as const,
        width: '100%',
        height: '100%',
        left: '0px',
        top: '0px',
        zIndex: 1,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    }

    // Collapsed state: position at bottom-right corner
    const collapsedPositions = [
      { right: '-8px', bottom: '-8px' }, // When 1 image
      { right: '-8px', bottom: '-8px' } // When 2 images
    ];

    // Expanded state: position after last image
    const expandedOffsets = [
      { left: '60px', top: '0px' }, // After 1 image
      { left: '120px', top: '0px' } // After 2 images
    ];

    if (isExpanded) {
      return {
        position: 'absolute' as const,
        ...expandedOffsets[currentCount - 1],
        zIndex: 20 + currentCount,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    } else {
      return {
        position: 'absolute' as const,
        ...collapsedPositions[currentCount - 1],
        zIndex: 5,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    }
  };

  // Validate image dimensions (check minimum width and height)
  const validateImageDimensions = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Check if both width and height are at least 320px
        if (img.width < 32 || img.height < 32) {
          resolve({
            valid: false,
            error: `${file.name} 图片尺寸过小，宽高不能低于32像素（当前尺寸：${img.width}×${img.height}px）`
          });
        } else {
          resolve({ valid: true });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: false,
          error: `${file.name} 图片加载失败，请检查文件是否损坏`
        });
      };

      img.src = objectUrl;
    });
  };

  // Handle mouse enter on images (only trigger when hovering over actual images)
  const handleImagesMouseEnter = (event: MouseEvent) => {
    // Clear any pending leave timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }

    // Only set hover state if hovering over an actual image item, not the circular button
    const target = event.target as HTMLElement;
    if (!target.closest('.circular-add-button')) {
      isHoveringImages.value = true;
    }
  };

  // Handle mouse leave from images
  const handleImagesMouseLeave = () => {
    // Add delay before collapsing to prevent jitter when mouse moves between images
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    hoverTimer = setTimeout(() => {
      isHoveringImages.value = false;
      hoverTimer = null;
    }, 150); // 150ms delay
  };

  // Remove image
  const removeImage = (index: number) => {
    uploadedImages.value.splice(index, 1);
  };

  // Trigger file upload
  const triggerUpload = () => {
    if (uploadedImages.value.length >= 3) {
      ElMessage.warning('最多只能上传3张图片');
      return;
    }
    fileInputRef.value?.click();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(0) + 'M';
  };

  // Validate files before upload
  const validateFiles = async (files: File[]): Promise<{ valid: File[]; errors: string[] }> => {
    const valid: File[] = [];
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    // Check total count limit
    const remainingSlots = 3 - uploadedImages.value.length;
    if (remainingSlots <= 0) {
      errors.push('已达到最大上传数量（3张），请先删除一些图片后再上传');
      return { valid, errors };
    }

    // Check if selected files exceed remaining slots
    if (files.length > remainingSlots) {
      errors.push(`还可以上传${remainingSlots}张图片，当前选择了${files.length}张，请重新选择`);
      return { valid, errors };
    }

    for (const file of files) {
      // Check file type
      const suffix = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
      if (!allowedTypes.includes(suffix)) {
        errors.push(`${file.name} 格式不支持，只允许上传 ${allowedTypes.join(' ')} 格式的文件`);
        continue;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} 文件过大，单个文件最大 ${formatFileSize(maxSize)}`);
        continue;
      }

      // Check image dimensions (minimum side must be >= 320px)
      const dimensionCheck = await validateImageDimensions(file);
      if (!dimensionCheck.valid) {
        if (dimensionCheck.error) {
          errors.push(dimensionCheck.error);
        }
        continue;
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  // Handle file selection
  const handleFileSelected = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (files.length === 0) return;

    // Validate files
    const { valid, errors } = await validateFiles(files);

    // Show all error messages
    if (errors.length > 0) {
      errors.forEach((error: string) => ElMessage.error(error));
    }

    // If no valid files, return early
    if (valid.length === 0) {
      target.value = '';
      return;
    }

    // Upload valid files with progress animation
    try {
      for (const file of valid) {
        // Create preview URL immediately
        const previewUrl = URL.createObjectURL(file);

        // Add placeholder with uploading state
        const placeholderImage: UploadedImage = {
          url: previewUrl,
          ossId: Date.now() + Math.random(), // Temporary ID
          file,
          uploading: true,
          progress: 0
        };

        uploadedImages.value.push(placeholderImage);

        // Simulate smooth progress animation
        const progressInterval = setInterval(() => {
          const currentProgress = placeholderImage.progress || 0;
          if (currentProgress < 90) {
            const newProgress = currentProgress + Math.random() * 15;
            placeholderImage.progress = newProgress > 90 ? 90 : newProgress;
          }
        }, 200);

        try {
          // Get file suffix
          const fileSuffix = file.name.substring(file.name.lastIndexOf('.'));

          // Upload to OSS
          const uploadRes = await uploadFile({
            file,
            fileSuffix,
            originalFileName: file.name,
            fileType: 'image',
            resourceType: 2,
            needSync: 0
          });

          // Clear progress interval
          clearInterval(progressInterval);

          // Complete progress animation
          placeholderImage.progress = 100;

          // Wait for animation to finish
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Update with actual data
          placeholderImage.url = uploadRes.url || '';
          placeholderImage.ossId = Number(uploadRes.ossId);
          placeholderImage.uploading = false;
          placeholderImage.progress = undefined;

          // Clean up preview URL
          URL.revokeObjectURL(previewUrl);
        } catch (error) {
          clearInterval(progressInterval);
          // Remove failed upload
          const index = uploadedImages.value.indexOf(placeholderImage);
          if (index > -1) {
            uploadedImages.value.splice(index, 1);
          }
          URL.revokeObjectURL(previewUrl);
          throw error;
        }
      }

      ElMessage.success(`成功上传${valid.length}张图片`);
    } catch (error) {
      console.error('上传失败:', error);
      ElMessage.error('上传失败');
    } finally {
      target.value = '';
    }
  };

  // Generate
  const handleGenerate = async () => {
    // Validation
    if (!props.basicId) {
      ElMessage.error('镜头ID不存在');
      return;
    }

    if (!selectedModel.value) {
      ElMessage.warning('请选择模型');
      return;
    }

    try {
      loading.value = true;

      // Call image editing API
      await editSceneImage({
        basicId: props.basicId,
        imgOssIdList: uploadedImages.value.map((img) => img.ossId),
        modelCode: selectedModel.value,
        prompt: prompt.value || undefined
      });

      ElMessage.success('生成成功');

      // 更新钱包积分
      await userStore.updateWalletPoints();

      emit('success');
      handleClose();
    } catch (error) {
      console.error('生成失败:', error);
      ElMessage.error('生成失败');
    } finally {
      loading.value = false;
    }
  };

  // Close dialog
  const handleClose = () => {
    dialogVisible.value = false;
  };

  // Watch dialog open, initialize default model
  watch(
    dialogVisible,
    (val) => {
      if (val) {
        // When dialog opens, always select first model
        if (modelList.value.length > 0) {
          selectedModel.value = modelList.value[0].modelCode || '';
        }
      } else {
        // When dialog closes, reset data
        uploadedImages.value = [];
        selectedModel.value = '';
        prompt.value = '';
      }
    },
    { immediate: true }
  );

  // Watch model list changes, auto-select first model if none selected
  watch(modelList, (newList) => {
    if (dialogVisible.value && newList.length > 0 && !selectedModel.value) {
      selectedModel.value = newList[0].modelCode || '';
    }
  });
</script>

<style scoped lang="scss">
  // Full-screen overlay
  .scene-image-edit-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  // Main container
  .edit-container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 90vw;
    max-height: 90vh;
  }

  // Main image preview wrapper
  .main-image-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .main-image-container {
    position: relative;
    width: 39.06vw; // 500px / 1280px ≈ 39.06% 的视口宽度
    height: 39.06vw; // 保持正方形
    // max-width: 500px; // 最大宽度限制
    max-height: 500px; // 最大高度限制
    min-width: 300px; // 最小宽度保证可用性
    min-height: 300px; // 最小高度保证可用性
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

    .main-preview-image {
      width: 100%;
      height: 100%;

      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .empty-main-preview {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #86909c;
      gap: 16px;

      p {
        margin: 0;
        font-size: 16px;
      }
    }

    // Close button
    .close-button {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
      z-index: 10;

      &:hover {
        background: rgba(0, 0, 0, 0.7);
        transform: scale(1.1);
      }
    }
  }

  // Control panel (white box below image)
  .control-panel {
    background: white;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    gap: 12px;
    box-shadow: 0 4px 6px rgba(224, 231, 255, 0.25), 0 10px 15px rgba(224, 231, 255, 0.5);
    width: 39.06vw; // 500px / 1280px ≈ 39.06% 的视口宽度
    // max-width: 500px; // 最大宽度限制
    min-width: 300px; // 最小宽度保证可用性
  }

  // Reference images section (overlapping)
  .reference-images-section {
    flex-shrink: 0;
    width: 60px;
    height: 80px;
    position: relative;
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

    // Uploaded images stack
    .reference-images-stack {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;

      // &.is-expanded {
      //   width: 240px;
      // }

      .reference-image-item {
        width: 60px;
        height: 80px;
        border: 2px solid white;
        border-radius: 4px;
        overflow: visible; // Changed to show delete button
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: transform 0.3s ease;
        position: relative;

        &:hover {
          transform: scale(1.133); // 68px / 60px ≈ 1.133 for 8px increase in width
        }

        // 上传中状态时的样式
        &.is-uploading {
          .reference-thumbnail {
            opacity: 0.6;
          }
        }

        .reference-thumbnail {
          width: 100%;
          height: 100%;
          border-radius: 2px;
          overflow: hidden;
          transition: opacity 0.3s;

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        // 上传进度遮罩层
        .upload-progress-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
          border-radius: 2px;
          z-index: 2;

          .progress-ring {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              display: block;
            }

            .progress-ring-circle {
              transition: stroke-dashoffset 0.3s ease;
            }

            .progress-text {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              font-size: 10px;
              font-weight: 600;
              text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            }
          }
        }

        // Delete button
        .delete-button {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ff4d4f;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
          transition: all 0.2s;
          z-index: 3;

          &:hover {
            background: #ff7875;
            transform: scale(1.15);
          }

          &:active {
            transform: scale(0.95);
          }
        }
      }
      .reference-image-item-new {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #f7f8fa;

        box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.25), 0 10px 15px 0 rgba(224, 231, 255, 0.5);
        overflow: visible; // Changed to show delete button
        cursor: pointer;

        // &.is-hovered {
        //   box-shadow: 0 4px 16px rgba(82, 82, 255, 0.25);
        // }

        // .reference-thumbnail {
        //   width: 100%;
        //   height: 100%;
        //   border-radius: 2px;
        //   overflow: hidden;

        //   :deep(img) {
        //     width: 100%;
        //     height: 100%;
        //     object-fit: cover;
        //   }
        // }

        // Delete button
        .delete-button {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ff4d4f;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
          transition: all 0.2s;

          &:hover {
            background: #ff7875;
            transform: scale(1.15);
          }

          &:active {
            transform: scale(0.95);
          }
        }
      }

      // Add more button
      .add-more-button {
        border-radius: 4px;
        background: #f7f8fa;
        transform: rotate(-5deg);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

        .add-more-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          gap: 6px;

          .add-icon {
            color: #5252ff;
            transition: all 0.3s;
          }

          .empty-text {
            font-size: 12px;
            color: #86909c;
            margin: 0;
            white-space: nowrap;
            transition: color 0.3s;
          }
        }

        &:hover {
          // border-color: #5252ff;
          background: #f3f3ff;
          transform: scale(1.133); // 68px / 60px ≈ 1.133 for 8px increase

          .add-icon {
            transform: rotate(90deg) scale(1.1);
          }

          .empty-text {
            color: #5252ff;
          }
        }

        &:active {
          transform: rotate(-5deg) scale(0.95);
        }

        &.is-hovered {
          box-shadow: 0 4px 16px rgba(82, 82, 255, 0.15);
        }

        // When empty state, adjust icon color to match the original design
        &.is-empty {
          .add-icon {
            color: #86909c;
          }

          &:hover {
            transform: scale(1.133); // No rotation for empty state

            .add-icon {
              color: #5252ff;
            }
          }
        }
      }
      .add-more-button-new {
        background: #f7f8fa;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 50%;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

        .add-more-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          gap: 6px;

          .add-icon {
            color: #5252ff;
            transition: all 0.3s;
          }

          .empty-text {
            font-size: 12px;
            color: #86909c;
            margin: 0;
            white-space: nowrap;
            transition: color 0.3s;
          }
        }

        &:hover {
          border-color: #5252ff;
          background: #f3f3ff;
          transform: scale(1.19); // 50px / 42px ≈ 1.19 for 8px increase in circular button

          .add-icon {
            transform: rotate(90deg) scale(1.1);
          }

          .empty-text {
            color: #5252ff;
          }
        }

        &:active {
          transform: scale(0.95);
        }

        &.is-hovered {
          box-shadow: 0 4px 16px rgba(82, 82, 255, 0.15);
        }

        // When empty state, adjust icon color to match the original design
        &.is-empty {
          .add-icon {
            color: #86909c;
          }

          &:hover .add-icon {
            color: #5252ff;
          }
        }
      }
    }

    // Circular add button (positioned at bottom-right corner)
    .circular-add-button {
      position: absolute;
      right: -20px;
      bottom: -20px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f7f8fa;
      box-shadow: 0 4px 6px rgba(224, 231, 255, 0.25), 0 10px 15px rgba(224, 231, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 10;
      color: #5252ff;

      &:hover {
        background: #f3f3ff;

        .el-icon {
          transform: rotate(90deg);
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  // Controls section (right side)
  .controls-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  // Model selector row (top)
  .model-selector-row {
    display: flex;
    align-items: center;

    .model-dropdown {
      width: 100%;

      :deep(.el-input__wrapper) {
        background: #f7f8fa;
        border-radius: 8px;
        padding: 6px 12px;
        height: 32px;
        box-shadow: none;
        border: 1px solid #e5e6eb;

        .el-input__inner {
          font-size: 12px;
          font-weight: 500;
          color: #1d2129;
        }

        .el-input__suffix {
          .el-icon {
            color: #86909c;
          }
        }

        &:hover {
          border-color: #5252ff;
        }

        &.is-focus {
          border-color: #5252ff;
          box-shadow: 0 0 0 2px rgba(82, 82, 255, 0.1);
        }
      }
    }
  }

  // Prompt textarea wrapper
  .prompt-input-wrapper {
    .prompt-textarea {
      :deep(.el-textarea__inner) {
        border-radius: 10px;
        padding: 10px 16px;
        font-size: 12px;
        line-height: 18px;
        border: 1px solid #e5e6eb;
        background: #f7f8fa;

        &::placeholder {
          color: #86909c;
        }

        &:focus {
          background: white;
          border-color: #5252ff;
        }
      }
    }
  }

  // Bottom controls row
  .bottom-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;

    // Cost indicator
    .cost-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #1d2129;
      font-size: 12px;

      .cost-icon {
        color: #1d2129;
      }

      .cost-text {
        font-family: 'PingFang SC', sans-serif;
      }
    }

    // Generate button
    .generate-button {
      width: 64px;
      height: 32px;
      padding: 8px 16px;
      background: #5252ff;
      border-color: #5252ff;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;

      &:hover {
        background: #6d65ff;
        border-color: #6d65ff;
      }

      &:active {
        background: #4242cc;
        border-color: #4242cc;
      }
    }
  }

  // Fade transition
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  // Delete button fade transition
  .delete-fade-enter-active,
  .delete-fade-leave-active {
    transition: all 0.2s ease;
  }

  .delete-fade-enter-from,
  .delete-fade-leave-to {
    opacity: 0;
    transform: scale(0);
  }

  // Progress overlay fade transition
  .progress-fade-enter-active {
    transition: all 0.3s ease;
  }

  .progress-fade-leave-active {
    transition: all 0.4s ease;
  }

  .progress-fade-enter-from {
    opacity: 0;
    transform: scale(0.8);
  }

  .progress-fade-leave-to {
    opacity: 0;
    transform: scale(1.2);
  }

  // Stack slide transition for adding/removing images (improved with bounce)
  .stack-slide-enter-active {
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .stack-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
  }

  .stack-slide-enter-from {
    opacity: 0;
    transform: scale(0.3) rotate(-15deg) translateY(-20px);
  }

  .stack-slide-leave-to {
    opacity: 0;
    transform: scale(0.5) rotate(10deg) translateY(10px);
  }

  .stack-slide-move {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
</style>
