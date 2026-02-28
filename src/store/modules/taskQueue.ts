import type { AddTaskRequest, GenerationMode, TaskQueueItem, TaskStatus } from '@/api/workbench/project/types';
import { defineStore } from 'pinia';

/**
 * 任务队列最大并发数量
 */
const MAX_CONCURRENT_TASKS = 3;

/**
 * 任务队列状态管理
 */
export const useTaskQueueStore = defineStore('taskQueue', () => {
  // ==================== 状态 ====================

  /**
   * 任务队列列表
   */
  const tasks = ref<TaskQueueItem[]>([]);

  /**
   * 最大并发任务数量
   */
  const maxConcurrent = ref<number>(MAX_CONCURRENT_TASKS);

  /**
   * 当前活跃的剧集ID（用于切换剧集时清空队列）
   */
  const currentEpisodeId = ref<string | number | null>(null);

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
   * 判断队列是否已满
   */
  const isQueueFull = computed(() => {
    return activeTasks.value.length >= maxConcurrent.value;
  });

  /**
   * 获取当前正在执行和排队中的任务总数
   */
  const pendingTaskCount = computed(() => {
    return activeTasks.value.length + queuedTasks.value.length;
  });

  /**
   * 判断是否可以添加新任务
   */
  const canAddTask = computed(() => {
    return activeTasks.value.length < maxConcurrent.value;
  });

  /**
   * 根据镜头基础ID获取任务
   */
  const getTaskByBasicId = computed(() => {
    return (basicId: number) => {
      return tasks.value.find((task) => task.basicId === basicId);
    };
  });

  /**
   * 根据任务ID获取任务
   */
  const getTaskById = computed(() => {
    return (taskId: string) => {
      return tasks.value.find((task) => task.id === taskId);
    };
  });

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
   * @returns 创建的任务对象，如果队列已满返回 null
   */
  const addTask = (request: AddTaskRequest): TaskQueueItem | null => {
    // 检查是否可以添加新任务
    if (!canAddTask.value) {
      console.warn('[TaskQueue] 队列已满，无法添加新任务');
      return null;
    }

    // 检查是否已存在相同镜头的任务
    const existingTask = tasks.value.find((t) => t.basicId === request.basicId && t.status !== 2 && t.status !== 3);
    if (existingTask) {
      console.warn('[TaskQueue] 该镜头已在队列中:', request.basicId);
      return null;
    }

    // 创建新任务
    const newTask: TaskQueueItem = {
      id: generateTaskId(),
      basicId: request.basicId,
      shotId: request.shotId,
      shotNumber: request.shotNumber,
      episodeId: request.episodeId,
      projectId: request.projectId,
      status: 0, // 默认为排队中
      mode: request.mode,
      prompt: request.prompt,
      dialogue: request.dialogue,
      startTime: Date.now()
    };

    // 添加到队列
    tasks.value.push(newTask);

    console.log('[TaskQueue] 任务已添加到队列:', newTask.id, newTask.shotNumber);

    // 如果当前活跃任务数未达上限，立即开始执行
    if (activeTasks.value.length < maxConcurrent.value) {
      startTask(newTask.id);
    }

    return newTask;
  };

  /**
   * 开始执行任务
   * @param taskId 任务ID
   */
  const startTask = (taskId: string): void => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) {
      console.warn('[TaskQueue] 任务不存在:', taskId);
      return;
    }

    // 更新任务状态为生成中
    task.status = 1;
    console.log('[TaskQueue] 任务开始执行:', taskId, task.shotNumber);
  };

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 新状态
   * @param resultUrls 结果URL列表（可选）
   * @param errorMessage 错误信息（可选）
   */
  const updateTask = (
    taskId: string,
    status: TaskStatus,
    resultUrls?: string[],
    errorMessage?: string
  ): void => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) {
      console.warn('[TaskQueue] 任务不存在:', taskId);
      return;
    }

    // 更新状态
    task.status = status;
    task.endTime = Date.now();

    // 更新结果
    if (resultUrls) {
      task.resultUrls = resultUrls;
    }

    // 更新错误信息
    if (errorMessage) {
      task.errorMessage = errorMessage;
    }

    console.log('[TaskQueue] 任务状态已更新:', taskId, 'status:', status);

    // 如果任务完成或失败，检查是否有排队中的任务需要启动
    if (status === 2 || status === 3) {
      checkAndStartNextTask();
    }
  };

  /**
   * 移除任务
   * @param taskId 任务ID
   */
  const removeTask = (taskId: string): void => {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index === -1) {
      console.warn('[TaskQueue] 任务不存在:', taskId);
      return;
    }

    tasks.value.splice(index, 1);
    console.log('[TaskQueue] 任务已移除:', taskId);

    // 检查是否有排队中的任务需要启动
    checkAndStartNextTask();
  };

  /**
   * 检查并启动下一个排队中的任务
   */
  const checkAndStartNextTask = (): void => {
    // 如果当前活跃任务数未达上限，且有排队中的任务
    if (activeTasks.value.length < maxConcurrent.value && queuedTasks.value.length > 0) {
      const nextTask = queuedTasks.value[0];
      startTask(nextTask.id);
    }
  };

  /**
   * 获取当前队列数量
   * @returns 活跃任务数
   */
  const getQueueCount = (): number => {
    return activeTasks.value.length;
  };

  /**
   * 清空所有任务
   */
  const clearAllTasks = (): void => {
    tasks.value = [];
    console.log('[TaskQueue] 所有任务已清空');
  };

  /**
   * 清空已完成和失败的任务
   */
  const clearCompletedTasks = (): void => {
    tasks.value = tasks.value.filter((task) => task.status === 0 || task.status === 1);
    console.log('[TaskQueue] 已完成任务已清空');
  };

  /**
   * 切换剧集时清空队列
   * @param episodeId 新的剧集ID
   */
  const switchEpisode = (episodeId: string | number): void => {
    if (currentEpisodeId.value !== episodeId) {
      currentEpisodeId.value = episodeId;
      clearAllTasks();
      console.log('[TaskQueue] 剧集切换，队列已清空');
    }
  };

  /**
   * 重试失败的任务
   * @param taskId 任务ID
   */
  const retryTask = (taskId: string): boolean => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) {
      console.warn('[TaskQueue] 任务不存在:', taskId);
      return false;
    }

    if (task.status !== 3) {
      console.warn('[TaskQueue] 只有失败的任务可以重试:', taskId);
      return false;
    }

    // 重置任务状态
    task.status = 0;
    task.startTime = Date.now();
    task.endTime = undefined;
    task.errorMessage = undefined;
    task.resultUrls = undefined;

    console.log('[TaskQueue] 任务已重置，将重新排队:', taskId);

    // 如果当前活跃任务数未达上限，立即开始执行
    if (activeTasks.value.length < maxConcurrent.value) {
      startTask(taskId);
    }

    return true;
  };

  /**
   * 设置最大并发任务数量
   * @param count 最大并发数量
   */
  const setMaxConcurrent = (count: number): void => {
    maxConcurrent.value = Math.max(1, count);
    console.log('[TaskQueue] 最大并发任务数量已设置为:', maxConcurrent.value);
  };

  // ==================== 返回 ====================

  return {
    // 状态
    tasks,
    maxConcurrent,
    currentEpisodeId,

    // Getters
    activeTasks,
    queuedTasks,
    completedTasks,
    isQueueFull,
    pendingTaskCount,
    canAddTask,
    getTaskByBasicId,
    getTaskById,

    // Actions
    addTask,
    startTask,
    updateTask,
    removeTask,
    checkAndStartNextTask,
    getQueueCount,
    clearAllTasks,
    clearCompletedTasks,
    switchEpisode,
    retryTask,
    setMaxConcurrent
  };
});

export default useTaskQueueStore;
