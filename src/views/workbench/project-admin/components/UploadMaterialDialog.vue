<template>
  <el-dialog
    v-model="dialogVisible"
    title="临时上传素材"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-alert title="上传说明" type="info" :closable="false" style="margin-bottom: 20px">
      上传文件后将生成 OSS 链接，可用于项目中使用
    </el-alert>

    <el-upload
      ref="uploadRef"
      class="upload-area"
      drag
      :auto-upload="false"
      :limit="1"
      :on-change="handleUploadChange"
      :on-exceed="handleExceed"
      :file-list="fileList"
    >
      <div class="upload-content">
        <svg-icon icon-class="fy-el-upload" style="width: 48px; height: 44px" />
        <div class="upload-text">将文件拖到此处，或<span class="upload-link">点击上传</span></div>
        <div class="upload-tip">支持任意格式文件，无大小限制</div>
      </div>
    </el-upload>

    <el-button
      v-if="fileList.length > 0"
      type="primary"
      :loading="uploading"
      @click="handleUploadSubmit"
      style="margin-top: 20px; width: 100%"
    >
      上传并获取链接
    </el-button>

    <div v-if="ossUrl" class="oss-url-display">
      <el-alert title="上传成功！" type="success" :closable="false" style="margin-bottom: 10px">
        OSS 链接已生成
      </el-alert>
      <el-input v-model="ossUrl" readonly>
        <template #append>
          <el-button @click="copyToClipboard(ossUrl)">复制</el-button>
        </template>
      </el-input>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { uploadFile } from '@/utils/uploadFile';
  import type { UploadInstance, UploadUserFile } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
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

  // OSS URL
  const ossUrl = ref('');

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
    ossUrl.value = '';
    uploadRef.value?.clearFiles();
  };

  // 处理上传文件变化
  const handleUploadChange = (uploadFile: any) => {
    currentUploadFile.value = uploadFile.raw;
    fileList.value = [uploadFile];
    ossUrl.value = '';
  };

  // 处理文件数量超出限制
  const handleExceed = () => {
    ElMessage.warning('只能上传一个文件');
  };

  // 处理关闭
  const handleClose = () => {
    dialogVisible.value = false;
  };

  // 处理上传提交（获取OSS链接）
  const handleUploadSubmit = async () => {
    if (!currentUploadFile.value) {
      ElMessage.warning('请先选择文件');
      return;
    }

    try {
      uploading.value = true;
      ElMessage.info('正在上传文件...');

      // 获取文件后缀
      const fileName = currentUploadFile.value.name;
      const fileSuffix = fileName.substring(fileName.lastIndexOf('.'));

      // 判断文件类型
      let fileType = 'other';
      const fileExt = fileSuffix.toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(fileExt)) {
        fileType = 'image';
      } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(fileExt)) {
        fileType = 'video';
      } else if (['.mp3', '.wav', '.flac', '.aac', '.ogg'].includes(fileExt)) {
        fileType = 'audio';
      } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExt)) {
        fileType = 'document';
      }

      // 上传文件到 OSS
      const uploadRes = await uploadFile({
        file: currentUploadFile.value,
        fileSuffix,
        originalFileName: fileName,
        fileType,
        resourceType: 2,
        needSync: 0
      });

      ossUrl.value = uploadRes.url || '';
      ElMessage.success('上传成功，OSS链接已生成');
    } catch (error) {
      console.error('上传失败:', error);
      ElMessage.error('上传失败，请稍后重试');
    } finally {
      uploading.value = false;
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      ElMessage.success('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案：使用传统方法
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        ElMessage.success('已复制到剪贴板');
      } catch (fallbackError) {
        ElMessage.error('复制失败，请手动复制');
      }
    }
  };
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

    .upload-text {
      color: #1d2129;
      font-size: 14px;
      font-weight: 500;
      margin-top: 16px;
      margin-bottom: 8px;

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

  .oss-url-display {
    margin-top: 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
