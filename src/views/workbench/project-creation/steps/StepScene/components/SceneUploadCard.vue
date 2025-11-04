<template>
  <div
    class="scene-upload-card"
    :class="{ 'is-dragging': isDragging }"
    @click="handleClick"
    @drop.prevent="handleDrop"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
  >
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      :max="maxFiles"
      style="display: none"
      @change="handleFileSelect"
    />

    <div class="upload-content">
      <el-icon :size="40" class="upload-icon">
        <Upload />
      </el-icon>
      <div class="upload-text">上传</div>
      <div class="upload-subtext">点击或拖拽图片</div>
      <div class="upload-limit">最多{{ maxFiles }}张/每张{{ formatFileSize(maxSize) }}</div>
    </div>

    <!-- 上传进度遮罩 -->
    <div v-if="uploading" class="upload-overlay">
      <el-progress type="circle" :percentage="uploadProgress" :width="80" />
      <div class="upload-status">上传中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Upload } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { ref } from 'vue';

  interface Props {
    maxFiles?: number;
    maxSize?: number; // 单个文件最大大小（字节）
    accept?: string[]; // 允许的文件后缀
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 默认10MB
    accept: () => ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    disabled: false
  });

  interface Emits {
    (e: 'upload', files: File[]): void;
  }

  const emit = defineEmits<Emits>();

  const fileInputRef = ref<HTMLInputElement>();
  const isDragging = ref(false);
  const uploading = ref(false);
  const uploadProgress = ref(0);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(0) + 'MB';
  };

  // 验证文件
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    // 检查文件数量
    if (files.length > props.maxFiles) {
      errors.push(`最多只能上传${props.maxFiles}张图片`);
      return { valid, errors };
    }

    files.forEach((file) => {
      // 检查文件类型
      const suffix = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
      if (!props.accept.includes(suffix)) {
        errors.push(`${file.name} 格式不支持，只允许上传 ${props.accept.join(' ')} 格式的文件`);
        return;
      }

      // 检查文件大小
      if (file.size > props.maxSize) {
        errors.push(`${file.name} 文件过大，单个文件最大 ${formatFileSize(props.maxSize)}`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  // 处理文件上传
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || props.disabled) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    // 显示错误信息
    if (errors.length > 0) {
      errors.forEach((error) => ElMessage.error(error));
    }

    // 触发上传事件
    if (valid.length > 0) {
      emit('upload', valid);
    }
  };

  // 点击上传
  const handleClick = () => {
    if (props.disabled || uploading.value) return;
    fileInputRef.value?.click();
  };

  // 文件选择
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    handleFiles(target.files);
    // 清空input，允许重复选择相同文件
    if (target) {
      target.value = '';
    }
  };

  // 拖拽进入
  const handleDragOver = (event: DragEvent) => {
    if (props.disabled || uploading.value) return;
    isDragging.value = true;
  };

  // 拖拽离开
  const handleDragLeave = () => {
    isDragging.value = false;
  };

  // 拖拽放下
  const handleDrop = (event: DragEvent) => {
    if (props.disabled || uploading.value) return;
    isDragging.value = false;
    handleFiles(event.dataTransfer?.files || null);
  };

  // 设置上传进度（供父组件调用）
  const setUploadProgress = (progress: number) => {
    uploadProgress.value = progress;
  };

  // 设置上传状态（供父组件调用）
  const setUploading = (status: boolean) => {
    uploading.value = status;
  };

  // 暴露方法给父组件
  defineExpose({
    setUploadProgress,
    setUploading
  });
</script>

<style scoped lang="scss">
  .scene-upload-card {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    // min-height: 280px;
    overflow: hidden;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 8px;
    border: 1px dashed #5252ff;
    background: #f3f3ff;

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #8c8c8c;
      text-align: center;
      user-select: none;

      .upload-icon {
        color: #5252ff;
        transition: all 0.3s;
      }

      .upload-text {
        font-size: 14px;
        color: #5252ff;
        font-weight: 500;
      }

      .upload-subtext {
        font-size: 12px;
        color: #86909c;
      }

      .upload-limit {
        font-size: 12px;
        color: #86909c;
      }
    }

    &:hover .upload-icon {
      transform: translateY(-2px);
    }

    // 上传遮罩
    .upload-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 16px;
      background: rgb(255 255 255 / 95%);
      backdrop-filter: blur(2px);

      .upload-status {
        color: #5252ff;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
</style>
