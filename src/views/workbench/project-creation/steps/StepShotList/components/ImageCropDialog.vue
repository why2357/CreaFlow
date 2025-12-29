<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="image-crop-dialog">
        <div class="crop-overlay">
          <!-- 裁剪图片区域 -->
          <div class="crop-wrapper">
            <!-- 裁剪尺寸提示 - 左上角 -->
            <div v-if="cropSize" class="crop-size-tip">{{ cropSize }}</div>

            <img ref="imageRef" :src="imageUrl" alt="裁剪图片" class="crop-image" />

            <!-- 底部提示文字 -->
            <div class="crop-tip">拖动裁切框调整位置，拖动右下角调整大小</div>

            <!-- 底部操作按钮 -->
            <div class="crop-footer">
              <el-button class="cancel-btn" :disabled="uploading" @click="handleClose">取消</el-button>
              <el-button class="confirm-btn" :loading="uploading" @click="handleConfirm">
                {{ uploading ? '上传中...' : '确认裁切' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
  import { replaceSceneImage } from '@/api/workbench/episode';
  import { sizeToValue } from '@/utils/projectUtils';
  import { uploadFile } from '@/utils/uploadFile';
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
  const cropSize = ref('');
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
      autoCropArea: 0.7, // 增大初始裁剪区域，提供更好的视觉效果
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      responsive: true, // 响应式调整
      // 监听裁剪框变化，更新尺寸显示
      crop(event) {
        const width = Math.round(event.detail.width);
        const height = Math.round(event.detail.height);
        updateCropSize(width, height);
      }
    });
  };

  // 更新裁剪框尺寸显示
  const updateCropSize = (width: number, height: number) => {
    cropSize.value = `${width} × ${height} (${props.aspectRatio})`;
  };

  // 销毁裁剪器
  const destroyCropper = () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  };

  // 获取宽高比数值（使用统一的工具函数）
  const getAspectRatioValue = (ratio: string): number => {
    return sizeToValue(ratio);
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

    // 获取裁剪后的画布
    const canvas = cropper.getCroppedCanvas();

    // 验证裁剪尺寸
    const width = canvas.width;
    const height = canvas.height;

    if (width < 320 || height < 320) {
      ElMessage.error(`裁剪尺寸不能小于320×320，当前尺寸为${width}×${height}`);
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        ElMessage.error('裁剪失败');
        return;
      }

      // 验证文件大小（不能超过25M）
      const maxSize = 10 * 1024 * 1024; // 25MB
      if (blob.size > maxSize) {
        ElMessage.error(`图片大小不能超过25M，当前大小为${(blob.size / 1024 / 1024).toFixed(2)}M`);
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
  // 淡入淡出动画
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .image-crop-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;

    .crop-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .crop-wrapper {
      position: relative;
      width: 80vw;
      height: 80vh;
      max-width: 1200px;
      max-height: 800px;

      .crop-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    // 自定义 Cropper.js 样式以匹配设计稿
    :deep(.cropper-container) {
      // 裁剪框外的黑色蒙层
      .cropper-modal {
        background: rgba(0, 0, 0, 0.6);
      }

      // 裁剪框边框
      .cropper-view-box {
        outline: 2px solid #ffffff;
        outline-offset: 0;
      }

      // 九宫格辅助线
      .cropper-dashed {
        border: 1px solid rgba(255, 255, 255, 0.3);
        opacity: 1;
      }

      // 隐藏中心十字线
      .cropper-center {
        display: none;
      }

      // 裁剪框四角和边的拖拽点 - 隐藏大部分，只保留右下角
      .cropper-point {
        display: none;
        // width: 16px;
        // height: 16px;
        background: #ffffff;
        border: 3px solid #5252ff;
        border-radius: 2px;
        opacity: 1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

        // 只显示右下角的拖拽点
        &.point-se {
          display: block;
          cursor: se-resize;
        }
      }

      // 隐藏边框线条
      .cropper-line {
        display: none;
      }

      // 裁剪框的尺寸提示 - 移除该样式，使用固定定位
      .cropper-face {
        &::before {
          display: none;
        }
      }
    }

    // 裁剪框尺寸提示 - 相对于 crop-wrapper 定位在左上角
    .crop-size-tip {
      position: absolute;
      top: -40px;
      left: 0;
      z-index: 9000;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 4px;
      padding: 5px 7.406px 3px 8px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
      line-height: 13px;
      white-space: nowrap;
      pointer-events: none;
    }

    .crop-tip {
      position: absolute;
      left: 0;
      bottom: -50px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 28px;
      padding: 16px 18px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
      line-height: 13px;
      white-space: nowrap;
    }

    .crop-footer {
      position: absolute;
      right: 0px;
      bottom: -60px;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      padding: 12px;

      .cancel-btn {
        background: #ffffff;
        color: #4e5969;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        height: 32px;
        padding: 8px 16px;

        &:hover {
          background: #f7f8fa;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .confirm-btn {
        background: #5252ff;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        height: 32px;
        padding: 8px 16px;

        &:hover {
          background: #4040dd;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
</style>
