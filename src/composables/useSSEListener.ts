import { onBeforeUnmount, onMounted, Ref, unref } from 'vue';

/**
 * SSE 事件详情接口
 */
export interface SSEEventDetail {
  projectId?: number;
  episodeId?: number;
  taskStatus?: number;
  batchStatus?: number;
  episodeSceneItemInfoList?: any[];
  message?: any;
}

/**
 * SSE 监听器选项
 */
export interface SSEListenerOptions {
  /** 当前项目ID（用于过滤消息，支持响应式引用） */
  projectId?: number | string | null | Ref<number | string | null>;
  /** 当前剧集ID（用于过滤消息，支持响应式引用） */
  episodeId?: number | string | null | Ref<number | string | null>;
  /** 是否启用自动过滤（默认为 true） */
  autoFilter?: boolean;
}

/**
 * SSE 脚本生成更新监听（messageType=1）
 * @param callback 回调函数
 * @param options 监听器选项
 */
export function useScriptUpdateListener(
  callback: (detail: SSEEventDetail) => void,
  options: SSEListenerOptions = {}
) {
  const handleScriptUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<SSEEventDetail>;
    const detail = customEvent.detail;

    // 如果启用自动过滤（默认启用）
    if (options.autoFilter !== false) {
      // 获取当前的项目ID和剧集ID（支持响应式引用）
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      // 检查项目ID是否匹配
      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        console.log('[SSE] 项目ID不匹配，忽略消息', {
          current: currentProjectId,
          received: detail.projectId
        });
        return;
      }

      // 检查剧集ID是否匹配
      // 如果当前没有选中剧集(currentEpisodeId为null/undefined)，但SSE消息有剧集ID，则忽略
      if (!currentEpisodeId && detail.episodeId) {
        console.log('[SSE] 当前无选中剧集，忽略消息', {
          current: currentEpisodeId,
          received: detail.episodeId
        });
        return;
      }

      // 如果都有值但不匹配，也忽略
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        console.log('[SSE] 剧集ID不匹配，忽略消息', {
          current: currentEpisodeId,
          received: detail.episodeId
        });
        return;
      }
    }

    // 消息匹配，执行回调
    console.log('[SSE] 脚本更新消息已匹配，触发回调');
    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-script-update', handleScriptUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-script-update', handleScriptUpdate);
  });
}

/**
 * SSE 图片生成更新监听（messageType=2）
 * @param callback 回调函数
 * @param options 监听器选项
 */
export function useImageUpdateListener(
  callback: (detail: SSEEventDetail) => void,
  options: SSEListenerOptions = {}
) {
  const handleImageUpdate = (event: Event) => {
    console.log('[SSE Listener] 收到 sse-image-update 事件');
    const customEvent = event as CustomEvent<SSEEventDetail>;
    const detail = customEvent.detail;
    console.log('[SSE Listener] 事件详情:', detail);

    // 如果启用自动过滤（默认启用）
    if (options.autoFilter !== false) {
      // 获取当前的项目ID和剧集ID（支持响应式引用）
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);
      console.log('[SSE Listener] 当前过滤条件 - projectId:', currentProjectId, 'episodeId:', currentEpisodeId);

      // 检查项目ID是否匹配
      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        console.log('[SSE] 项目ID不匹配，忽略消息', {
          current: currentProjectId,
          received: detail.projectId
        });
        return;
      }

      // 检查剧集ID是否匹配
      // 如果当前没有选中剧集(currentEpisodeId为null/undefined)，但SSE消息有剧集ID，则忽略
      if (!currentEpisodeId && detail.episodeId) {
        console.log('[SSE] 当前无选中剧集，忽略消息', {
          current: currentEpisodeId,
          received: detail.episodeId
        });
        return;
      }

      // 如果都有值但不匹配，也忽略
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        console.log('[SSE] 剧集ID不匹配，忽略消息', {
          current: currentEpisodeId,
          received: detail.episodeId
        });
        return;
      }
    }

    // 消息匹配，执行回调
    console.log('[SSE] 图片更新消息已匹配，触发回调');
    callback(detail);
  };

  onMounted(() => {
    console.log('[SSE Listener] 注册 sse-image-update 监听器');
    window.addEventListener('sse-image-update', handleImageUpdate);
  });

  onBeforeUnmount(() => {
    console.log('[SSE Listener] 移除 sse-image-update 监听器');
    window.removeEventListener('sse-image-update', handleImageUpdate);
  });
}

/**
 * SSE 视频生成更新监听（messageType=3）
 * @param callback 回调函数
 * @param options 监听器选项
 */
export function useVideoUpdateListener(
  callback: (detail: SSEEventDetail) => void,
  options: SSEListenerOptions = {}
) {
  const handleVideoUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<SSEEventDetail>;
    const detail = customEvent.detail;

    // 如果启用自动过滤（默认启用）
    if (options.autoFilter !== false) {
      // 获取当前的项目ID和剧集ID（支持响应式引用）
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      // 检查项目ID是否匹配
      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        console.log('[SSE] 项目ID不匹配，忽略消息', {
          current: currentProjectId,
          received: detail.projectId
        });
        return;
      }

      // 检查剧集ID是否匹配
      // 如果当前没有选中剧集(currentEpisodeId为null/undefined)，但SSE消息有剧集ID，则忽略
      if (!currentEpisodeId && detail.episodeId) {
        console.log('[SSE] 当前无选中剧集，忽略消息', {
          current: currentEpisodeId,
          received: detail.episodeId
        });
        return;
      }

      // 如果都有值但不匹配，也忽略
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        console.log('[SSE] 剧集ID不匹配，忽略消息', {
          current: currentEpisodeId,
          received: detail.episodeId
        });
        return;
      }
    }

    // 消息匹配，执行回调
    console.log('[SSE] 视频更新消息已匹配，触发回调');
    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-video-update', handleVideoUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-video-update', handleVideoUpdate);
  });
}
