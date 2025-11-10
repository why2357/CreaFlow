<template>
  <el-dialog
    v-model="dialogVisible"
    title="图片编辑"
    width="720px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="scene-image-edit-dialog">
      <!-- 主图片预览区 -->
      <div class="main-image-preview">
        <el-image
          v-if="mainImageUrl"
          :src="mainImageUrl"
          fit="contain"
          class="preview-image"
          :preview-src-list="[mainImageUrl]"
        />
        <div v-else class="empty-preview">
          <el-icon :size="60"><Picture /></el-icon>
          <p>暂无图片</p>
        </div>
      </div>

      <!-- 上传图片区域 -->
      <div class="upload-section">
        <div class="upload-label">上传图片</div>
        <div class="upload-area-container">
          <!-- 空状态 / 上传状态 -->
          <div class="upload-grid" :class="{ 'has-images': uploadedImages.length > 0 }">
            <!-- 已上传的图片 -->
            <div
              v-for="(img, index) in uploadedImages"
              :key="index"
              class="upload-item uploaded"
              @mouseenter="hoveredIndex = index"
              @mouseleave="hoveredIndex = null"
            >
              <el-image :src="img.url" fit="cover" class="upload-image" />

              <!-- Hover 展开删除按钮 -->
              <transition name="expand">
                <div v-if="hoveredIndex === index" class="delete-overlay" @click="removeImage(index)">
                  <el-icon :size="24"><Delete /></el-icon>
                </div>
              </transition>
            </div>

            <!-- 上传按钮 (最多3张) -->
            <div
              v-if="uploadedImages.length < 3"
              class="upload-item upload-trigger"
              @click="triggerUpload"
            >
              <el-icon :size="32"><Plus /></el-icon>
              <span class="upload-hint">请输入编辑图</span>
            </div>
          </div>

          <!-- 提示文本 -->
          <div class="upload-tips">
            <span>{{ uploadedImages.length }}/3张</span>
            <span class="tip-text">最多上传3张图片</span>
          </div>
        </div>
      </div>

      <!-- 模型选择 -->
      <div class="model-section">
        <div class="model-label">模型选择</div>
        <el-select v-model="selectedModel" placeholder="请选择模型" class="model-select">
          <el-option label="Nano Banana" value="nano_banana" />
          <el-option label="Model A" value="model_a" />
          <el-option label="Model B" value="model_b" />
        </el-select>
        <span class="model-points">{{ modelPoints }}张</span>
      </div>

      <!-- 提示语输入 -->
      <div class="prompt-section">
        <div class="prompt-label">请输入编辑图的提示词</div>
        <el-input
          v-model="prompt"
          type="textarea"
          :rows="4"
          placeholder="请输入编辑图的提示词"
          class="prompt-input"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleGenerate">生成</el-button>
      </div>
    </template>

    <!-- 隐藏的文件上传 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handleFileSelected"
    />
  </el-dialog>
</template>

<script setup lang="ts">
  import { Delete, Picture, Plus } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';
  import { uploadFile } from '@/utils/uploadFile';
  import { editSceneImage } from '@/api/workbench/storyboard';

  interface UploadedImage {
    url: string;
    ossId: number;
    file?: File;
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

  // 对话框显示状态
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  // 状态
  const loading = ref(false);
  const uploadedImages = ref<UploadedImage[]>([]);
  const hoveredIndex = ref<number | null>(null);
  const selectedModel = ref('nano_banana');
  const prompt = ref('');
  const fileInputRef = ref<HTMLInputElement>();

  // 模型点数 (这里可以根据实际模型配置)
  const modelPoints = computed(() => {
    const pointsMap: Record<string, number> = {
      nano_banana: 1,
      model_a: 2,
      model_b: 3
    };
    return pointsMap[selectedModel.value] || 1;
  });

  // 触发文件上传
  const triggerUpload = () => {
    fileInputRef.value?.click();
  };

  // 文件选择处理
  const handleFileSelected = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (files.length === 0) return;

    // 检查上传数量限制
    const remainingSlots = 3 - uploadedImages.value.length;
    if (files.length > remainingSlots) {
      ElMessage.warning(`最多只能上传${remainingSlots}张图片`);
      target.value = '';
      return;
    }

    // 验证文件
    for (const file of files) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.error(`${file.name} 不是图片文件`);
        target.value = '';
        return;
      }

      // 验证文件大小（限制为10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`${file.name} 大小超过10MB`);
        target.value = '';
        return;
      }
    }

    // 上传文件
    try {
      loading.value = true;

      for (const file of files) {
        // 获取文件后缀
        const fileSuffix = file.name.substring(file.name.lastIndexOf('.'));

        // 上传到OSS
        const uploadRes = await uploadFile({
          file,
          fileSuffix,
          originalFileName: file.name,
          fileType: 'image',
          resourceType: 2,
          needSync: 0
        });

        // 添加到已上传列表
        uploadedImages.value.push({
          url: uploadRes.url || '',
          ossId: Number(uploadRes.ossId),
          file
        });
      }

      ElMessage.success('上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      ElMessage.error('上传失败');
    } finally {
      loading.value = false;
      target.value = '';
    }
  };

  // 移除图片
  const removeImage = (index: number) => {
    uploadedImages.value.splice(index, 1);
  };

  // 生成
  const handleGenerate = async () => {
    // 验证
    if (!props.basicId) {
      ElMessage.error('镜头ID不存在');
      return;
    }

    if (uploadedImages.value.length === 0) {
      ElMessage.warning('请至少上传一张图片');
      return;
    }

    if (!selectedModel.value) {
      ElMessage.warning('请选择模型');
      return;
    }

    try {
      loading.value = true;

      // 调用图片编辑接口
      await editSceneImage({
        basicId: props.basicId,
        imgOssIdList: uploadedImages.value.map((img) => img.ossId),
        modelCode: selectedModel.value,
        prompt: prompt.value || undefined
      });

      ElMessage.success('生成成功');
      emit('success');
      handleClose();
    } catch (error) {
      console.error('生成失败:', error);
      ElMessage.error('生成失败');
    } finally {
      loading.value = false;
    }
  };

  // 关闭对话框
  const handleClose = () => {
    dialogVisible.value = false;
  };

  // 监听对话框关闭，重置数据
  watch(dialogVisible, (val) => {
    if (!val) {
      uploadedImages.value = [];
      selectedModel.value = 'nano_banana';
      prompt.value = '';
      hoveredIndex.value = null;
    }
  });
</script>

<style scoped lang="scss">
  .scene-image-edit-dialog {
    display: flex;
    flex-direction: column;
    gap: 24px;

    // 主图片预览区
    .main-image-preview {
      width: 100%;
      height: 360px;
      border-radius: 8px;
      background: #f5f7fa;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-image {
        width: 100%;
        height: 100%;
      }

      .empty-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #c0c4cc;
        gap: 12px;

        p {
          margin: 0;
          font-size: 14px;
        }
      }
    }

    // 上传区域
    .upload-section {
      .upload-label {
        margin-bottom: 12px;
        color: #1d2129;
        font-size: 14px;
        font-weight: 500;
      }

      .upload-area-container {
        .upload-grid {
          display: flex;
          gap: 12px;
          align-items: center;

          .upload-item {
            position: relative;
            width: 120px;
            height: 120px;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &.uploaded {
              border: 1px solid #e5e6eb;
              cursor: pointer;

              .upload-image {
                width: 100%;
                height: 100%;
              }

              .delete-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
                transform-origin: center;

                &:hover {
                  background: rgba(0, 0, 0, 0.75);
                }
              }
            }

            &.upload-trigger {
              border: 1px dashed #c9cdd4;
              background: #f7f8fa;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 8px;
              cursor: pointer;
              transition: all 0.3s;

              .el-icon {
                color: #86909c;
              }

              .upload-hint {
                color: #86909c;
                font-size: 12px;
              }

              &:hover {
                border-color: #6157ff;
                background: #f5f3ff;

                .el-icon,
                .upload-hint {
                  color: #6157ff;
                }
              }
            }
          }
        }

        .upload-tips {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #86909c;
          font-size: 12px;

          .tip-text {
            &::before {
              content: '·';
              margin-right: 4px;
            }
          }
        }
      }
    }

    // 模型选择区
    .model-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .model-label {
        color: #1d2129;
        font-size: 14px;
        font-weight: 500;
        flex-shrink: 0;
      }

      .model-select {
        flex: 1;
      }

      .model-points {
        color: #ff7d00;
        font-size: 14px;
        font-weight: 500;
        flex-shrink: 0;
      }
    }

    // 提示语区
    .prompt-section {
      .prompt-label {
        margin-bottom: 12px;
        color: #1d2129;
        font-size: 14px;
        font-weight: 500;
      }

      .prompt-input {
        :deep(.el-textarea__inner) {
          resize: none;
        }
      }
    }
  }

  // 展开动画
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .expand-enter-from {
    opacity: 0;
    transform: scale(0.8);
  }

  .expand-leave-to {
    opacity: 0;
    transform: scale(0.8);
  }

  .expand-enter-to,
  .expand-leave-from {
    opacity: 1;
    transform: scale(1);
  }

  // Dialog footer
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
