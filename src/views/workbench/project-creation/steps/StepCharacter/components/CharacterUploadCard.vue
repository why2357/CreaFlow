<template>
  <div
    class="character-upload-card"
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
      <div class="upload-limit">最多{{ maxFiles }}张/{{ formatFileSize(maxSize) }}</div>
    </div>

    <!-- 上传进度遮罩 -->
    <div v-if="uploading" class="upload-overlay">
      <el-progress type="circle" :percentage="uploadProgress" :width="80" />
      <div class="upload-status">上传中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getLibraryDetailCount } from '@/api/workbench/library';
  import { Upload } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { ref } from 'vue';

  interface Props {
    maxFiles?: number;
    maxSize?: number; // 单个文件最大大小（字节）
    accept?: string[]; // 允许的文件后缀
    disabled?: boolean;
    libraryId?: number; // 资源库ID，用于获取最新上传数量
    totalLimit?: number; // 总数限制
    validateDimensions?: boolean; // 是否校验图片尺寸
  }

  const props = withDefaults(defineProps<Props>(), {
    maxFiles: 10, // 单次最多上传10张
    maxSize: 10 * 1024 * 1024, // 默认25MB
    accept: () => ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    disabled: false,
    totalLimit: 10, // 总数最多10张
    validateDimensions: true // 默认校验尺寸
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
    return (bytes / (1024 * 1024)).toFixed(0) + 'M';
  };

  // 验证图片尺寸
  const validateImageDimensions = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!props.validateDimensions) {
        resolve({ valid: true });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const minSide = Math.min(img.width, img.height);

        if (minSide < 320) {
          resolve({
            valid: false,
            error: `${file.name} 图片尺寸过小，最短边不能低于320像素（当前最短边：${minSide}px）`
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

  // 验证文件
  const validateFiles = async (files: File[]): Promise<{ valid: File[]; errors: string[] }> => {
    const valid: File[] = [];
    const errors: string[] = [];

    // 如果没有 libraryId，无法获取最新数量，直接返回错误
    if (!props.libraryId) {
      errors.push('无法获取资源库信息，请刷新页面后重试');
      return { valid, errors };
    }

    // 调用接口获取最新的已上传数量
    let currentCount = 0;
    try {
      const res = await getLibraryDetailCount(props.libraryId);
      currentCount = res.data ?? 0;
    } catch (error) {
      console.error('获取资源库详情数量失败:', error);
      errors.push('获取资源库信息失败，请稍后重试');
      return { valid, errors };
    }

    // 检查总数限制
    const remainingSlots = props.totalLimit - currentCount;
    if (remainingSlots <= 0) {
      errors.push(`已达到总数限制（${props.totalLimit}张），请先删除一些图片后再上传`);
      return { valid, errors };
    }

    // 检查单次上传数量
    if (files.length > props.maxFiles) {
      errors.push(`单次最多只能上传${props.maxFiles}张图片`);
      return { valid, errors };
    }

    // 检查上传后是否会超过总数限制
    if (files.length > remainingSlots) {
      errors.push(`还可以上传${remainingSlots}张图片，当前选择了${files.length}张，请重新选择`);
      return { valid, errors };
    }

    for (const file of files) {
      // 检查文件类型
      const suffix = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
      if (!props.accept.includes(suffix)) {
        errors.push(`${file.name} 格式不支持，只允许上传 ${props.accept.join(' ')} 格式的文件`);
        continue;
      }

      // 检查文件大小
      if (file.size > props.maxSize) {
        errors.push(`${file.name} 文件过大，单个文件最大 ${formatFileSize(props.maxSize)}`);
        continue;
      }

      // 检查图片尺寸
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

  // 处理文件上传
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || props.disabled) return;

    const fileArray = Array.from(files);
    const { valid, errors } = await validateFiles(fileArray);

    // 显示错误信息
    if (errors.length > 0) {
      errors.forEach((error: string) => ElMessage.error(error));
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
  .character-upload-card {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 240px;
    max-height: 289px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px dashed #5252ff;
    background: #f3f3ff;
    cursor: pointer;
    transition: all 0.3s;

    // 拖拽悬停状态
    &.is-dragging {
      background: linear-gradient(135deg, rgba(82, 82, 255, 0.15) 0%, rgba(190, 117, 254, 0.15) 100%);
      border: 2px dashed #5252ff;
      box-shadow: inset 0 0 20px rgba(82, 82, 255, 0.2);

      &::after {
        // content: '释放以上传图片';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        padding: 16px 32px;
        border-radius: 8px;
        background: rgba(82, 82, 255, 0.95);
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 4px 16px rgba(82, 82, 255, 0.4);
        animation: fadeInScale 0.2s ease-out;
      }

      .upload-content {
        opacity: 0.3;
      }
    }

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

    &:hover .upload-icon,
    &.is-dragging .upload-icon {
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
