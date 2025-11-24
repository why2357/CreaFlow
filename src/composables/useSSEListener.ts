import { onBeforeUnmount, onMounted } from 'vue';

/**
 * SSE 图片生成更新监听
 * @param callback 回调函数
 */
export function useImageUpdateListener(callback: (detail: any) => void) {
  const handleImageUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };

  onMounted(() => {
    window.addEventListener('sse-image-update', handleImageUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-image-update', handleImageUpdate);
  });
}

/**
 * SSE 视频生成更新监听
 * @param callback 回调函数
 */
export function useVideoUpdateListener(callback: (detail: any) => void) {
  const handleVideoUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };

  onMounted(() => {
    window.addEventListener('sse-video-update', handleVideoUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-video-update', handleVideoUpdate);
  });
}
