<template>
  <div class="banner-carousel">
    <div class="banner-video-container">
      <video
        ref="videoRef"
        class="banner-video"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        :src="videoUrl"
        :poster="posterUrl"
        @loadeddata="handleVideoLoaded"
        @error="handleVideoError"
      ></video>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';

  // 视频 URL
  const videoUrl =
    'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122519/e8e182b5fc284554.mp4';

  // 占位图片 URL
  const posterUrl =
    'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122519/f52a0e6b285642ac.png';

  const videoRef = ref<HTMLVideoElement | null>(null);

  const handleVideoLoaded = () => {
    console.log('Banner 视频加载完成');
    // 确保视频开始播放
    if (videoRef.value) {
      videoRef.value.play().catch((e) => console.log('视频自动播放被阻止:', e));
    }
  };

  const handleVideoError = (e: Event) => {
    console.error('Banner 视频加载失败:', e);
  };

  onMounted(() => {
    // 尝试播放视频
    if (videoRef.value) {
      videoRef.value.play().catch((e) => console.log('视频自动播放被阻止:', e));
    }
  });

  onUnmounted(() => {
    // 清理视频资源
    if (videoRef.value) {
      videoRef.value.pause();
      videoRef.value.src = '';
    }
  });
</script>

<style scoped lang="scss">
  .banner-carousel {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 32px;
    min-height: 300px;
    max-height: 300px;
    background-color: #000;

    .banner-video-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      .banner-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
      }
    }
  }

  // 响应式设计 - 确保小屏幕上有合适的显示高度
  @media (max-width: 1024px) {
    .banner-carousel {
      min-height: 250px;
    }
  }

  @media (max-width: 768px) {
    .banner-carousel {
      min-height: 200px;
    }
  }

  @media (max-width: 480px) {
    .banner-carousel {
      min-height: 180px;
    }
  }
</style>
