<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量导入文本"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-upload
      ref="uploadRef"
      class="upload-area"
      drag
      :auto-upload="false"
      :limit="1"
      accept=".xlsx,.xls"
      :on-change="handleUploadChange"
      :on-exceed="handleExceed"
      :file-list="fileList"
    >
      <div class="upload-content">
        <svg-icon icon-class="fy-el-upload" style="width: 48px; height: 44px" />
        <div class="upload-text">将文件拖到此处，或<span class="upload-link">点击上传</span></div>
        <div class="upload-tip">您可以上传制作好的剧集，支持：excel格式</div>
      </div>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import type { UploadInstance, UploadUserFile } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', file: File): void;
  }>();

  // 上传组件引用
  const uploadRef = ref<UploadInstance>();

  // 对话框显示状态
  const dialogVisible = ref(false);

  // 上传状态
  const uploading = ref(false);

  // 当前上传的文件
  const currentUploadFile = ref<File | null>(null);

  // 文件列表
  const fileList = ref<UploadUserFile[]>([]);

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (newVal) => {
      dialogVisible.value = newVal;
      if (newVal) {
        // 打开弹窗时重置状态
        resetUpload();
      }
    },
    { immediate: true }
  );

  // 监听 dialogVisible 变化，同步到父组件
  watch(dialogVisible, (newVal) => {
    emit('update:modelValue', newVal);
  });

  // 重置上传状态
  const resetUpload = () => {
    currentUploadFile.value = null;
    fileList.value = [];
    uploadRef.value?.clearFiles();
  };

  // 处理上传文件变化
  const handleUploadChange = (uploadFile: any) => {
    currentUploadFile.value = uploadFile.raw;
    fileList.value = [uploadFile];
  };

  // 处理文件数量超出限制
  const handleExceed = () => {
    ElMessage.warning('只能上传一个文件');
  };

  // 处理取消
  const handleCancel = () => {
    dialogVisible.value = false;
  };

  // 处理关闭
  const handleClose = () => {
    resetUpload();
  };

  // 处理确认
  const handleConfirm = () => {
    if (!currentUploadFile.value) {
      ElMessage.warning('请先选择文件');
      return;
    }

    emit('confirm', currentUploadFile.value);
  };

  // 设置上传状态
  const setUploading = (value: boolean) => {
    uploading.value = value;
  };

  // 关闭弹窗
  const close = () => {
    dialogVisible.value = false;
  };

  // 暴露方法给父组件
  defineExpose({
    setUploading,
    close
  });
</script>

<style scoped lang="scss">
  :deep(.el-dialog) {
    .el-dialog__header {
      padding: 20px 20px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 24px 20px;
    }
  }
  // 文件上传区域
  .upload-area {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 40px 20px;
      border: 1px dashed #d9d9d9;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.3s;

      &:hover {
        border-color: #5252ff;
        background: #f5f5ff;
      }
    }

    .upload-content {
      text-align: center;
    }

    .upload-icon {
      margin-bottom: 16px;
      color: #bfbfbf;
      font-size: 48px;
    }

    .upload-text {
      color: #1d2129;
      font-size: 14px;
      font-weight: 500;
      margin-top: 16px;
      margin-bottom: 16px;

      .upload-link {
        color: #5252ff;
        cursor: pointer;
      }
    }

    .upload-tip {
      color: #86909c;
      font-size: 12px;
    }
  }
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
