<template>
  <el-dialog
    v-model="visible"
    width="60%"
    append-to-body
    :z-index="3100"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">视频预览</span>
        <div v-if="videoInfo" class="video-info">
          <span v-if="videoInfo.modelName" class="info-item">{{ videoInfo.modelName }}</span>
          <span v-if="videoInfo.ratio" class="info-item">{{ videoInfo.ratio }}</span>
          <span v-if="videoInfo.duration" class="info-item">{{ videoInfo.duration }}</span>
          <span v-if="videoInfo.createTime" class="info-item">{{ videoInfo.createTime }}</span>
        </div>
      </div>
    </template>
    <video v-if="videoUrl" ref="videoRef" :src="videoUrl" controls autoplay class="preview-video">
      您的浏览器不支持视频播放
    </video>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';

  interface VideoInfo {
    modelName?: string; // 模型名称
    ratio?: string; // 分辨率
    duration?: string; // 时长
    createTime?: string; // 创建时间
  }

  interface Props {
    modelValue: boolean;
    videoUrl?: string;
    videoInfo?: VideoInfo; // 视频信息
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
  }>();

  const visible = ref(false);
  const videoRef = ref<HTMLVideoElement>();

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
    // 关闭时暂停视频并重置播放位置
    if (!val && videoRef.value) {
      videoRef.value.pause();
      videoRef.value.currentTime = 0;
    }
  });

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };
</script>

<style scoped lang="scss">
  .dialog-header {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .dialog-title {
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
    }

    .video-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .info-item {
        padding: 4px 12px;
        background: #f7f8fa;
        border-radius: 4px;
        font-size: 13px;
        color: #4e5969;
        white-space: nowrap;

        &:first-child {
          color: #5252ff;
          background: #f3f3ff;
          font-weight: 500;
        }
      }
    }
  }

  .preview-video {
    width: 100%;
    height: auto;
    min-height: 300px;
    max-height: 70vh;
  }
</style>
