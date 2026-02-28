import type { AddTaskRequest, GenerationMode, TaskQueueItem, TaskStatus } from '@/api/workbench/project/types';
import { defineStore } from 'pinia';

/**
 * 单个镜头最大并发任务数量
 */
const MAX_CONCURRENT_PER_SHOT = 4;

/**
 * 任务队列状态管理
 * 改为镜头级别：每个镜头最多4个并发任务
 */
export const useTaskQueueStore = defineStore('taskQueue', () => {
  // ==================== 状态 ====================

  /**
   * 任务队列列表
   */
  const tasks = ref<TaskQueueItem[]>([]);

  /**
   * 单个镜头最大并发任务数量
   */
  const maxConcurrentPerShot = ref<number>(MAX_CONCURRENT_PER_SHOT);

  /**
   * 当前活跃的剧集ID（用于切换剧集时清空队列）
   */
  const currentEpisodeId = ref<string | number | null>(null);

  /**
   * 完成任务清理定时器
   */
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * 启动自动清理已完成的任务（每30秒清理一次超过5分钟前完成的任务）
   */
  const startAutoCleanup = () => {
    if (cleanupTimer) return;

    cleanupTimer = setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      tasks.value = tasks.value.filter((task) => {
        // 保留活跃任务和最近完成的任务
        if (task.status === 0 || task.status === 1) return true;
        if (task.endTime && task.endTime > fiveMinutesAgo) return true;
        return false;
      });
    }, 30000);
  };

  // 启动自动清理
  startAutoCleanup();

  // ==================== Getters ====================

  /**
   * 获取正在执行的任务列表（状态为 Generating）
   */
  const activeTasks = computed(() => {
    return tasks.value.filter((task) => task.status === 1);
  });

  /**
   * 获取排队中的任务列表（状态为 Queued）
   */
  const queuedTasks = computed(() => {
    return tasks.value.filter((task) => task.status === 0);
  });

  /**
   * 获取已完成/失败的任务列表（状态为 Success 或 Failed）
   */
  const completedTasks = computed(() => {
    return tasks.value.filter((task) => task.status === 2 || task.status === 3);
  });

  /**
   * 队列是否已满（已弃用，保留兼容性）
   * 现在每个镜头独立计算并发数
   */
  const isQueueFull = computed(() => {
    return false; // 不再使用全局队列限制
  });

  /**
   * 根据镜头ID获取该镜头的所有任务
   */
  const getTasksByShotId = (shotId: string | number) => {
    return tasks.value.filter((task) => task.shotId === shotId);
  };

  /**
   * 根据镜头ID获取该镜头正在执行的任务数量
   */
  const getActiveTaskCountByShotId = (shotId: string | number) => {
    return tasks.value.filter((task) => task.shotId === shotId && task.status === 1).length;
  };

  /**
   * 根据镜头ID判断该镜头是否可以添加新任务
   */
  const canAddTaskForShot = (shotId: string | number) => {
    const activeCount = getActiveTaskCountByShotId(shotId);
    return activeCount < maxConcurrentPerShot.value;
  };

  /**
   * 根据任务ID获取任务
   */
  const getTaskById = computed(() => {
    return (taskId: string) => {
      return tasks.value.find((task) => task.id === taskId);
    };
  });

  /**
   * 根据 basicId 获取任务
   */
  const getTaskByBasicId = (basicId: number) => {
    return tasks.value.find((task) => task.basicId === basicId);
  };

  // ==================== Actions ====================

  /**
   * 生成唯一任务ID
   */
  const generateTaskId = (): string => {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 添加任务到队列
   * @param request 任务请求参数
   * @returns 创建的任务对象，如果该镜头队列已满返回 null
   */
  const addTask = (request: AddTaskRequest): TaskQueueItem | null => {
    // 检查该镜头是否可以添加新任务
    if (!canAddTaskForShot(request.shotId)) {
      console.warn(
        `[TaskQueue] 镜头 ${request.shotId} 并发任务已满（最大${maxConcurrentPerShot.value}个），无法添加新任务`
      );
      return null;
    }

    // 创建任务对象
    const task: TaskQueueItem = {
      id: generateTaskId(),
      basicId: request.basicId,
      shotNumber: request.shotNumber,
      shotId: request.shotId,
      episodeId: request.episodeId,
      projectId: request.projectId,
      status: 1, // 直接设为生成中（排队逻辑由后端控制）
      mode: request.mode,
      prompt: request.prompt,
      dialogue: request.dialogue,
      startTime: Date.now()
    };

    tasks.value.push(task);
    console.log(`[TaskQueue] 任务已添加:`, task);

    return task;
  };

  /**
   * 开始任务（将排队中的任务改为执行中）
   */
  const startTask = (taskId: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (task && task.status === 0) {
      task.status = 1;
      task.startTime = Date.now();
    }
  };

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 新状态
   * @param resultUrls 结果URL列表（可选）
   * @param errorMessage 错误信息（可选）
   */
  const updateTask = (taskId: string, status: TaskStatus, resultUrls?: string[], errorMessage?: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) {
      console.warn(`[TaskQueue] 未找到任务: ${taskId}`);
      return;
    }

    task.status = status;

    if (status === 2 || status === 3) {
      // 任务完成或失败
      task.endTime = Date.now();
    }

    if (resultUrls) {
      task.resultUrls = resultUrls;
    }

    if (errorMessage) {
      task.errorMessage = errorMessage;
    }

    console.log(`[TaskQueue] 任务状态已更新:`, task);
  };

  /**
   * 根据 basicId 更新任务状态
   */
  const updateTaskByBasicId = (basicId: number, status: TaskStatus, resultUrls?: string[], errorMessage?: string) => {
    const task = tasks.value.find((t) => t.basicId === basicId);
    if (task) {
      updateTask(task.id, status, resultUrls, errorMessage);
    }
  };

  /**
   * 移除任务
   * @param taskId 任务ID
   */
  const removeTask = (taskId: string) => {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks.value.splice(index, 1);
      console.log(`[TaskQueue] 任务已移除: ${taskId}`);
    }
  };

  /**
   * 重试失败的任务
   * @param taskId 任务ID
   * @returns 是否成功重试
   */
  const retryTask = (taskId: string): boolean => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) {
      return false;
    }

    // 检查该镜头是否可以添加新任务
    if (!canAddTaskForShot(task.shotId)) {
      console.warn(`[TaskQueue] 镜头 ${task.shotId} 并发任务已满，无法重试`);
      return false;
    }

    // 重置任务状态
    task.status = 1;
    task.startTime = Date.now();
    task.endTime = undefined;
    task.resultUrls = undefined;
    task.errorMessage = undefined;

    console.log(`[TaskQueue] 任务已重试:`, task);
    return true;
  };

  /**
   * 清空所有已完成和失败的任务
   */
  const clearCompletedTasks = () => {
    tasks.value = tasks.value.filter((task) => task.status !== 2 && task.status !== 3);
    console.log(`[TaskQueue] 已清空已完成任务`);
  };

  /**
   * 切换剧集时清空队列
   */
  const switchEpisode = (episodeId: string | number) => {
    if (currentEpisodeId.value !== episodeId) {
      currentEpisodeId.value = episodeId;
      tasks.value = [];
      console.log(`[TaskQueue] 已切换到剧集 ${episodeId}，队列已清空`);
    }
  };

  /**
   * 清空整个队列
   */
  const clearAll = () => {
    tasks.value = [];
    console.log(`[TaskQueue] 队列已清空`);
  };

  // ==================== 返回 ====================

  return {
    // 状态
    tasks,
    maxConcurrentPerShot,
    currentEpisodeId,

    // Getters
    activeTasks,
    queuedTasks,
    completedTasks,
    isQueueFull,
    getTasksByShotId,
    getActiveTaskCountByShotId,
    canAddTaskForShot,
    getTaskById,
    getTaskByBasicId,

    // Actions
    addTask,
    startTask,
    updateTask,
    updateTaskByBasicId,
    removeTask,
    retryTask,
    clearCompletedTasks,
    switchEpisode,
    clearAll
  };
});
