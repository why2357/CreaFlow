<template>
  <div class="video-cell" :data-aspect-ratio="aspectRatio">
    <!-- 视频显示区域 - 点击打开预览弹窗 -->
    <div v-if="hasVideo" class="video-container" @click="handleVideoClick">
      <!-- 视频封面 -->
      <div class="video-cover-wrapper">
        <!-- 如果有封面图片，使用图片 -->
        <img v-if="hasCoverImage" :src="videoCoverUrl" class="video-cover-image" alt="视频封面" />
        <!-- 如果没有封面图片，使用video标签展示视频第一帧 -->
        <video v-else :src="videoUrl" class="video-cover-video" preload="metadata" muted />

        <!-- 播放按钮覆盖层 -->
        <div class="play-overlay">
          <div class="play-button">
            <svg-icon icon-class="fy-play" style="width: 18px; height: 18px; color: #1d2129" />
          </div>
        </div>
      </div>
    </div>
    <!-- 图片显示区域（当没有视频但有图片时） -->
    <div v-else-if="hasImage" class="image-container">
      <el-image :src="imageUrl" fit="contain" class="scene-image" :preview-src-list="[imageUrl]" />
    </div>
    <!-- 空状态（既没有视频也没有图片） -->
    <div v-else class="empty-video">
      <img
        style="width: 80px; height: 80px"
        src="../../../../../../assets/images/no-image.png"
        alt="暂无视频"
        class="placeholder-img"
      />
    </div>

    <!-- 视频预览弹窗 -->
    <VideoPreviewDialog v-model="videoPreviewVisible" :video-url="videoUrl" />
  </div>
</template>

<script setup lang="ts">
  import type { VideoSceneItemInfo } from '@/api/workbench/episode/types';
  import { computed, ref } from 'vue';
  import VideoPreviewDialog from './VideoPreviewDialog.vue';

  interface Props {
    video: VideoSceneItemInfo;
    modelConfig?: {
      resolution: string;
      duration: number;
      points: number;
    } | null;
    aspectRatio?: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  }

  const props = withDefaults(defineProps<Props>(), {
    aspectRatio: '16:9'
  });

  const emit = defineEmits<{
    (e: 'refresh'): void;
  }>();

  // 视频预览弹窗状态
  const videoPreviewVisible = ref(false);

  // 点击视频封面，打开预览弹窗
  const handleVideoClick = () => {
    videoPreviewVisible.value = true;
  };

  // 检测URL是否为视频
  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.flv', '.wmv', '.mkv'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some((ext) => urlLower.includes(ext));
  };

  // 视频URL - 优先从 episodeSceneItemInfoList 中查找
  const videoUrl = computed(() => {
    // 1. 优先从 materialInfoVoList 中查找视频
    if (props.video.materialInfoVoList && props.video.materialInfoVoList.length > 0) {
      for (const material of props.video.materialInfoVoList) {
        // 优先使用 originOssUrl
        const originUrl = material.originOssUrl || '';
        if (originUrl && isVideoUrl(originUrl)) {
          return originUrl;
        }
        // 其次使用 previewOssUrl
        const previewUrl = material.previewOssUrl || '';
        if (previewUrl && isVideoUrl(previewUrl)) {
          return previewUrl;
        }
      }
    }

    // 2. 如果 materialInfoVoList 中没有视频，检查顶层的 videoUrl
    const topLevelVideoUrl = (props.video as any).videoUrl || '';
    if (topLevelVideoUrl && isVideoUrl(topLevelVideoUrl)) {
      return topLevelVideoUrl;
    }

    return '';
  });

  // 图片URL - 如果没有视频，则查找图片
  const imageUrl = computed(() => {
    // 如果已经有视频了，就不需要显示图片
    if (videoUrl.value) {
      return '';
    }

    // 1. 优先从 materialInfoVoList 中查找图片
    if (props.video.materialInfoVoList && props.video.materialInfoVoList.length > 0) {
      for (const material of props.video.materialInfoVoList) {
        // 优先使用 originOssUrl
        const originUrl = material.originOssUrl || '';
        if (originUrl && !isVideoUrl(originUrl)) {
          return originUrl;
        }
        // 其次使用 previewOssUrl
        const previewUrl = material.previewOssUrl || '';
        if (previewUrl && !isVideoUrl(previewUrl)) {
          return previewUrl;
        }
      }
    }

    // 2. 如果 materialInfoVoList 中没有图片，使用顶层的 imgUrl
    const topLevelImgUrl = props.video.imgUrl || '';
    if (topLevelImgUrl && !isVideoUrl(topLevelImgUrl)) {
      return topLevelImgUrl;
    }

    return '';
  });

  // 视频封面URL - 用于视频封面展示
  const videoCoverUrl = computed(() => {
    // 使用 imgUrl 作为视频封面
    return props.video.imgUrl || '';
  });

  // 是否有封面图片
  const hasCoverImage = computed(() => {
    return !!videoCoverUrl.value && !isVideoUrl(videoCoverUrl.value);
  });

  // 是否有视频
  const hasVideo = computed(() => {
    return !!videoUrl.value;
  });

  // 是否有图片
  const hasImage = computed(() => {
    return !!imageUrl.value;
  });
</script>

<style scoped lang="scss">
  .video-cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%; // 填满父容器高度
    overflow: hidden;
    // background: #f5f7fa;

    // 根据宽高比设置宽度,高度由父容器决定(190px)
    &[data-aspect-ratio='16:9'] {
      width: 338px; // 190 * (16/9) ≈ 338
    }
    &[data-aspect-ratio='9:16'] {
      width: 107px; // 190 * (9/16) ≈ 107
    }
    &[data-aspect-ratio='1:1'] {
      width: 190px; // 190 * 1 = 190
    }
    &[data-aspect-ratio='4:3'] {
      width: 253px; // 190 * (4/3) ≈ 253
    }
    &[data-aspect-ratio='3:4'] {
      width: 143px; // 190 * (3/4) ≈ 143
    }

    .video-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;

      .video-cover-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;

        .video-cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-cover-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-placeholder-cover {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: #fff;
          opacity: 0.5;
        }

        // 播放按钮覆盖层
        .play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          opacity: 1;
          transition: opacity 0.3s;

          .play-button {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

            &:hover {
              transform: scale(1.1);
              background: #fff;
            }
          }
        }
      }

      &:hover .play-overlay {
        opacity: 1;
      }
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .scene-image {
        width: 100%;
        height: 100%;

        :deep(.el-image__inner) {
          object-fit: cover; // 填满容器，不留白
        }
      }
    }

    .empty-video {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      .placeholder-img {
        width: 60px;
        height: 60px;
        opacity: 0.3;
        margin-bottom: 8px;
      }

      .empty-text {
        color: #86909c;
        font-size: 12px;
      }
    }
  }
</style>
