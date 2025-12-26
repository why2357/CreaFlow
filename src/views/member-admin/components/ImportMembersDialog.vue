<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量导入成员"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">批量导入成员</span>
        <el-button class="download-template-btn" @click="handleDownloadTemplate"> 下载模版 </el-button>
      </div>
    </template>

    <!-- 临时上传功能（用于获取OSS链接） -->
    <!-- <div v-if="showTempUpload" class="temp-upload-section">
      <el-alert title="临时上传功能" type="info" :closable="false" style="margin-bottom: 20px">
        上传文件后将显示OSS链接，可用于测试
      </el-alert>
      <el-upload
        ref="tempUploadRef"
        class="upload-area"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleTempUploadChange"
        :file-list="tempFileList"
      >
        <div class="upload-content">
          <svg-icon icon-class="fy-el-upload" style="width: 48px; height: 44px" />
          <div class="upload-text">临时上传（获取OSS链接）</div>
        </div>
      </el-upload>
      <el-button
        v-if="tempFileList.length > 0"
        type="primary"
        :loading="tempUploading"
        @click="handleTempUploadSubmit"
        style="margin-top: 10px; width: 100%"
      >
        上传并获取OSS链接
      </el-button>
      <div v-if="tempOssUrl" class="oss-url-display">
        <el-input v-model="tempOssUrl" readonly>
          <template #append>
            <el-button @click="copyToClipboard(tempOssUrl)">复制</el-button>
          </template>
        </el-input>
      </div>
      <el-divider />
    </div> -->

    <!-- 正式上传功能 -->
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
        <div class="upload-tip">支持 excel 格式(.xlsx, .xls)</div>
      </div>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleConfirm">确认导入</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { importMembers } from '@/api/system/user';
  import type { UploadInstance, UploadUserFile } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    showTempUpload?: boolean; // 是否显示临时上传功能
  }

  const props = withDefaults(defineProps<Props>(), {
    showTempUpload: true
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }>();

  // 上传组件引用
  const uploadRef = ref<UploadInstance>();
  // const tempUploadRef = ref<UploadInstance>();

  // 对话框显示状态
  const dialogVisible = ref(false);

  // 上传状态
  const uploading = ref(false);
  // const tempUploading = ref(false);

  // 当前上传的文件
  const currentUploadFile = ref<File | null>(null);
  // const tempCurrentFile = ref<File | null>(null);

  // 文件列表
  const fileList = ref<UploadUserFile[]>([]);
  // const tempFileList = ref<UploadUserFile[]>([]);

  // 临时上传的OSS URL
  // const tempOssUrl = ref('');

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
    // tempCurrentFile.value = null;
    fileList.value = [];
    // tempFileList.value = [];
    // tempOssUrl.value = '';
    uploadRef.value?.clearFiles();
    // tempUploadRef.value?.clearFiles();
  };

  // 处理正式上传文件变化
  const handleUploadChange = (uploadFile: any) => {
    currentUploadFile.value = uploadFile.raw;
    fileList.value = [uploadFile];
  };

  // 处理临时上传文件变化
  // const handleTempUploadChange = (uploadFile: any) => {
  //   tempCurrentFile.value = uploadFile.raw;
  //   tempFileList.value = [uploadFile];
  //   tempOssUrl.value = '';
  // };

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

  // 处理临时上传提交（获取OSS链接）
  // const handleTempUploadSubmit = async () => {
  //   if (!tempCurrentFile.value) {
  //     ElMessage.warning('请先选择文件');
  //     return;
  //   }

  //   try {
  //     tempUploading.value = true;

  //     // 获取文件后缀
  //     const fileSuffix = tempCurrentFile.value.name.substring(tempCurrentFile.value.name.lastIndexOf('.'));

  //     // 上传文件到 OSS
  //     const uploadRes = await uploadFile({
  //       file: tempCurrentFile.value,
  //       fileSuffix,
  //       originalFileName: tempCurrentFile.value.name,
  //       fileType: 'excel',
  //       resourceType: 2,
  //       needSync: 0
  //     });

  //     tempOssUrl.value = uploadRes.url || '';
  //     ElMessage.success('上传成功，OSS链接已生成');
  //   } catch (error) {
  //     console.error('临时上传失败:', error);
  //     ElMessage.error('上传失败，请稍后重试');
  //   } finally {
  //     tempUploading.value = false;
  //   }
  // };

  // 复制到剪贴板
  // const copyToClipboard = async (text: string) => {
  //   try {
  //     await navigator.clipboard.writeText(text);
  //     ElMessage.success('已复制到剪贴板');
  //   } catch (error) {
  //     console.error('复制失败:', error);
  //     ElMessage.error('复制失败');
  //   }
  // };

  // 处理确认导入
  const handleConfirm = async () => {
    if (!currentUploadFile.value) {
      ElMessage.warning('请先选择文件');
      return;
    }

    try {
      uploading.value = true;

      // 创建 FormData 并添加文件
      const formData = new FormData();
      formData.append('file', currentUploadFile.value);

      // 调用导入接口
      ElMessage.info('正在导入成员...');
      await importMembers(formData);

      ElMessage.success('导入成功');
      dialogVisible.value = false;
      emit('success');
    } catch (error) {
      console.error('导入成员失败:', error);
      ElMessage.error('导入失败，请检查文件格式');
    } finally {
      uploading.value = false;
    }
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    const templateUrl =
      'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/excel/2025121917/9ac27ee07a6644f7.xlsx';
    const fileName = '成员导入模板.xlsx';

    try {
      ElMessage.info('正在下载模板...');

      // 使用 fetch 获取文件
      const response = await fetch(templateUrl, {
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      // 转换为 blob
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 创建临时链接并触发下载
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      ElMessage.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      // 如果 fetch 失败（可能是跨域问题），尝试直接打开链接
      try {
        window.open(templateUrl, '_blank');
        ElMessage.info('已在新标签页打开模板，请手动保存');
      } catch {
        ElMessage.error('下载失败，请稍后重试');
      }
    }
  };

  // 暴露方法给父组件
  defineExpose({
    setUploading: (value: boolean) => {
      uploading.value = value;
    },
    close: () => {
      dialogVisible.value = false;
    }
  });
</script>

<style scoped lang="scss">
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-right: 40px;

    .dialog-title {
      color: #1d2129;
      font-size: 18px;
    }

    .download-template-btn {
      display: flex;
      width: 92px;
      height: 28px;
      padding: 10px;
      justify-content: center;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      border-radius: 4px;
      border: 1px solid #eee;
      background: #fff;

      &:hover {
        color: #7375ff;
      }

      .el-icon {
        font-size: 13px;
      }
    }
  }

  .temp-upload-section {
    margin-bottom: 20px;

    .oss-url-display {
      margin-top: 10px;
    }
  }

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

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
