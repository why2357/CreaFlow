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
export function useScriptUpdateListener(callback: (detail: SSEEventDetail) => void, options: SSEListenerOptions = {}) {
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
        return;
      }

      // 检查剧集ID是否匹配
      // 如果当前没有选中剧集(currentEpisodeId为null/undefined)，但SSE消息有剧集ID，则忽略
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }

      // 如果都有值但不匹配，也忽略
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

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
export function useImageUpdateListener(callback: (detail: SSEEventDetail) => void, options: SSEListenerOptions = {}) {
  const handleImageUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<SSEEventDetail>;
    const detail = customEvent.detail;

    // 如果启用自动过滤（默认启用）
    if (options.autoFilter !== false) {
      // 获取当前的项目ID和剧集ID（支持响应式引用）
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      // 检查项目ID是否匹配
      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        return;
      }

      // 检查剧集ID是否匹配
      // 如果当前没有选中剧集(currentEpisodeId为null/undefined)，但SSE消息有剧集ID，则忽略
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }

      // 如果都有值但不匹配，也忽略
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

    // 消息匹配，执行回调
    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-image-update', handleImageUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-image-update', handleImageUpdate);
  });
}

/**
 * SSE 视频生成更新监听（messageType=3）
 * @param callback 回调函数
 * @param options 监听器选项
 */
export function useVideoUpdateListener(callback: (detail: SSEEventDetail) => void, options: SSEListenerOptions = {}) {
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
        return;
      }

      // 检查剧集ID是否匹配
      // 如果当前没有选中剧集(currentEpisodeId为null/undefined)，但SSE消息有剧集ID，则忽略
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }

      // 如果都有值但不匹配，也忽略
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

    // 消息匹配，执行回调
    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-video-update', handleVideoUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-video-update', handleVideoUpdate);
  });
}

// ==================== 任务队列专用监听器 ====================

/**
 * 任务队列更新事件详情接口
 */
export interface TaskQueueUpdateDetail {
  /** 镜头基础ID */
  basicId?: number;
  /** 任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败 */
  taskStatus?: number;
  /** 批量任务状态 */
  batchStatus?: number;
  /** 剧集镜头信息列表 */
  episodeSceneItemInfoList?: Array<{
    basicId?: number;
    taskStatus?: number;
    materialVoList?: Array<{ originOssUrl?: string }>;
  }>;
  /** 错误信息 */
  message?: string;
  /** 项目ID */
  projectId?: number;
  /** 剧集ID */
  episodeId?: number;
}

/**
 * 任务队列监听器选项
 */
export interface TaskQueueListenerOptions {
  /** 当前项目ID（用于过滤消息，支持响应式引用） */
  projectId?: number | string | null | Ref<number | string | null>;
  /** 当前剧集ID（用于过滤消息，支持响应式引用） */
  episodeId?: number | string | null | Ref<number | string | null>;
  /** 是否启用自动过滤（默认为 true） */
  autoFilter?: boolean;
}

/**
 * 图片生成任务队列监听器
 * 监听图片生成任务的SSE更新，并自动更新任务队列状态
 *
 * @param callback 任务状态更新回调函数
 * @param options 监听器选项
 *
 * @example
 * ```ts
 * const { handleTaskStatusUpdate } = useTaskQueue();
 *
 * useImageTaskQueueListener((detail) => {
 *   if (detail.basicId && detail.taskStatus !== undefined) {
 *     handleTaskStatusUpdate(detail.basicId, detail.taskStatus);
 *   }
 * }, { projectId, episodeId });
 * ```
 */
export function useImageTaskQueueListener(
  callback: (detail: TaskQueueUpdateDetail) => void,
  options: TaskQueueListenerOptions = {}
) {
  const handleImageUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<TaskQueueUpdateDetail>;
    const detail = customEvent.detail;

    // 如果启用自动过滤（默认启用）
    if (options.autoFilter !== false) {
      // 获取当前的项目ID和剧集ID（支持响应式引用）
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      // 检查项目ID是否匹配
      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        return;
      }

      // 检查剧集ID是否匹配
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }

      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

    // 消息匹配，执行回调
    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-image-update', handleImageUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-image-update', handleImageUpdate);
  });
}

/**
 * 视频生成任务队列监听器
 * 监听视频生成任务的SSE更新，并自动更新任务队列状态
 *
 * @param callback 任务状态更新回调函数
 * @param options 监听器选项
 *
 * @example
 * ```ts
 * const { handleTaskStatusUpdate } = useTaskQueue();
 *
 * useVideoTaskQueueListener((detail) => {
 *   if (detail.basicId && detail.taskStatus !== undefined) {
 *     handleTaskStatusUpdate(detail.basicId, detail.taskStatus);
 *   }
 * }, { projectId, episodeId });
 * ```
 */
export function useVideoTaskQueueListener(
  callback: (detail: TaskQueueUpdateDetail) => void,
  options: TaskQueueListenerOptions = {}
) {
  const handleVideoUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<TaskQueueUpdateDetail>;
    const detail = customEvent.detail;

    // 如果启用自动过滤（默认启用）
    if (options.autoFilter !== false) {
      // 获取当前的项目ID和剧集ID（支持响应式引用）
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      // 检查项目ID是否匹配
      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        return;
      }

      // 检查剧集ID是否匹配
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }

      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

    // 消息匹配，执行回调
    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-video-update', handleVideoUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-video-update', handleVideoUpdate);
  });
}

/**
 * 统一任务队列监听器
 * 同时监听图片和视频生成任务的SSE更新
 *
 * @param callback 任务状态更新回调函数
 * @param options 监听器选项
 *
 * @example
 * ```ts
 * const { handleBatchTaskUpdate } = useTaskQueue();
 *
 * useTaskQueueListener((detail) => {
 *   handleBatchTaskUpdate(detail);
 * }, { projectId, episodeId });
 * ```
 */
export function useTaskQueueListener(
  callback: (detail: TaskQueueUpdateDetail) => void,
  options: TaskQueueListenerOptions = {}
) {
  const handleImageUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<TaskQueueUpdateDetail>;
    const detail = customEvent.detail;

    // 过滤检查
    if (options.autoFilter !== false) {
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        return;
      }
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

    callback(detail);
  };

  const handleVideoUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<TaskQueueUpdateDetail>;
    const detail = customEvent.detail;

    // 过滤检查
    if (options.autoFilter !== false) {
      const currentProjectId = unref(options.projectId);
      const currentEpisodeId = unref(options.episodeId);

      if (currentProjectId && detail.projectId && Number(currentProjectId) !== Number(detail.projectId)) {
        return;
      }
      if (!currentEpisodeId && detail.episodeId) {
        return;
      }
      if (currentEpisodeId && detail.episodeId && Number(currentEpisodeId) !== Number(detail.episodeId)) {
        return;
      }
    }

    callback(detail);
  };

  onMounted(() => {
    window.addEventListener('sse-image-update', handleImageUpdate);
    window.addEventListener('sse-video-update', handleVideoUpdate);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('sse-image-update', handleImageUpdate);
    window.removeEventListener('sse-video-update', handleVideoUpdate);
  });
}
