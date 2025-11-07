<template>
  <el-dialog v-model="visible" title="裁剪图片" width="800px" :close-on-click-modal="false" @close="handleClose">
    <div class="crop-container">
      <div class="crop-area">
        <img ref="imageRef" :src="imageUrl" alt="裁剪图片" />
      </div>

      <div class="crop-info">
        <div class="info-item">
          <span class="label">裁剪比例：</span>
          <span class="value">{{ aspectRatio }}</span>
        </div>
        <div class="info-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>裁剪后的图片将保持 {{ aspectRatio }} 的比例</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button :disabled="uploading" @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="uploading" @click="handleConfirm">
        {{ uploading ? '上传中...' : '确认裁剪' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { replaceSceneImage } from '@/api/workbench/episode';
  import { uploadFile } from '@/utils/uploadFile';
  import { InfoFilled } from '@element-plus/icons-vue';
  import Cropper from 'cropperjs';
  import 'cropperjs/dist/cropper.css';
  import { ElMessage } from 'element-plus';
  import { nextTick, onMounted, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    imageUrl: string;
    aspectRatio: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
    basicId?: number; // 镜头id，用于调用替换接口
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', file: Blob): void;
    (e: 'success'): void; // 上传成功后触发
  }>();

  const visible = ref(false);
  const imageRef = ref<HTMLImageElement>();
  const uploading = ref(false);
  let cropper: Cropper | null = null;

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        nextTick(() => {
          initCropper();
        });
      } else {
        destroyCropper();
      }
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 初始化裁剪器
  const initCropper = () => {
    if (!imageRef.value) return;

    const ratio = getAspectRatioValue(props.aspectRatio);

    cropper = new Cropper(imageRef.value, {
      aspectRatio: ratio,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false
    });
  };

  // 销毁裁剪器
  const destroyCropper = () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  };

  // 获取宽高比数值
  const getAspectRatioValue = (ratio: string): number => {
    const ratioMap: Record<string, number> = {
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '3:4': 3 / 4
    };
    return ratioMap[ratio] || 16 / 9;
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };

  // 确认裁剪
  const handleConfirm = async () => {
    if (!cropper) {
      ElMessage.error('裁剪器未初始化');
      return;
    }

    if (uploading.value) {
      return;
    }

    cropper.getCroppedCanvas().toBlob(async (blob) => {
      if (!blob) {
        ElMessage.error('裁剪失败');
        return;
      }

      // 如果有 basicId，则上传并调用替换接口
      if (props.basicId) {
        try {
          uploading.value = true;
          ElMessage.info('正在上传裁剪后的图片...');

          // 将 blob 转换为 File 对象
          const file = new File([blob], `cropped-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });

          // 获取文件后缀
          const fileSuffix = '.jpg';

          // 上传文件到 OSS
          const uploadRes = await uploadFile({
            file,
            fileSuffix,
            originalFileName: file.name,
            fileType: 'image',
            resourceType: 2, // 用户资源
            needSync: 0
          });

          // 调用替换场景图片接口
          await replaceSceneImage({
            basicId: props.basicId,
            ossId: Number(uploadRes.ossId)
          });

          emit('success');
          handleClose();
        } catch (error) {
          console.error('上传裁剪图片失败:', error);
          ElMessage.error('上传裁剪图片失败');
        } finally {
          uploading.value = false;
        }
      } else {
        // 没有 basicId，使用原来的逻辑
        emit('confirm', blob);
        handleClose();
      }
    });
  };

  // 组件挂载
  onMounted(() => {
    if (props.modelValue) {
      visible.value = true;
      nextTick(() => {
        initCropper();
      });
    }
  });
</script>

<style scoped lang="scss">
  .crop-container {
    .crop-area {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-height: 500px;
      margin-bottom: 20px;
      background: #000000;

      img {
        max-width: 100%;
        max-height: 500px;
      }
    }

    .crop-info {
      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .label {
          margin-right: 8px;
          color: #606266;
          font-size: 14px;
          font-weight: 600;
        }

        .value {
          color: #409eff;
          font-size: 14px;
          font-weight: 600;
        }
      }

      .info-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-left: 3px solid #409eff;
        border-radius: 4px;
        background: #f0f9ff;
        color: #606266;
        font-size: 13px;

        .el-icon {
          color: #409eff;
          font-size: 16px;
        }
      }
    }
  }
</style>
