import { generateEpisodeImg, generateVideo } from '@/api/workbench/episode';
import type { AddTaskRequest, TaskQueueItem, TaskStatus } from '@/api/workbench/project/types';
import { useProjectStore } from '@/store/modules/project';
import { useTaskQueueStore } from '@/store/modules/taskQueue';
import { ElMessage } from 'element-plus';
import { computed } from 'vue';

/**
 * 任务队列管理 Composable
 * 封装任务队列的操作逻辑，包括添加任务、调用生成接口、处理任务状态更新等
 * 改为镜头级别：每个镜头最多4个并发任务
 */
export function useTaskQueue() {
  const taskQueueStore = useTaskQueueStore();
  const projectStore = useProjectStore();

  // 防重复提交：记录每个镜头的最近API调用时间
  const pendingApiCalls = new Map<string | number, number>();
  const API_CALL_COOLDOWN = 600; // API调用冷却时间（毫秒），比后端的500ms稍长

  // ==================== 计算属性 ====================

  /**
   * 根据镜头ID获取该镜头的所有任务
   */
  const getTasksByShotId = (shotId: string | number) => {
    return taskQueueStore.getTasksByShotId(shotId);
  };

  /**
   * 根据镜头ID获取该镜头正在执行的任务数量
   */
  const getActiveTaskCountByShotId = (shotId: string | number) => {
    return taskQueueStore.getActiveTaskCountByShotId(shotId);
  };

  /**
   * 根据镜头ID判断该镜头是否可以添加新任务
   */
  const canAddTaskForShot = (shotId: string | number) => {
    return taskQueueStore.canAddTaskForShot(shotId);
  };

  /**
   * 当前活跃任务数（全局）
   */
  const activeTaskCount = computed(() => taskQueueStore.activeTasks.length);

  /**
   * 排队任务数（全局）
   */
  const queuedTaskCount = computed(() => taskQueueStore.queuedTasks.length);

  // ==================== 任务操作 ====================

  /**
   * 添加图片生成任务到队列
   * @param shot 分镜数据
   * @param modelCode 模型代码（可选，从项目Store获取）
   * @returns 创建的任务对象，失败返回 null
   */
  const addImageGenerationTask = (
    shot: {
      basicId?: number;
      id: string | number;
      shotNumber: string | number;
      sceneDescription?: string;
      sceneHint?: string;
      dialogue?: string;
    },
    modelCode?: string
  ): TaskQueueItem | null => {
    // 检查镜头是否有 basicId
    if (!shot.basicId) {
      ElMessage.warning('镜头基础信息不存在，无法生成');
      return null;
    }

    // 检查API调用冷却期（防重复提交）
    const lastCallTime = pendingApiCalls.get(shot.basicId);
    const now = Date.now();
    if (lastCallTime && now - lastCallTime < API_CALL_COOLDOWN) {
      const remainingTime = Math.ceil((API_CALL_COOLDOWN - (now - lastCallTime)) / 1000);
      ElMessage.warning(`请求过快，请等待 ${remainingTime} 秒后再试`);
      return null;
    }

    // 检查该镜头是否可以添加新任务
    if (!canAddTaskForShot(shot.id)) {
      const activeCount = getActiveTaskCountByShotId(shot.id);
      ElMessage.warning(`该镜头正在生成中（${activeCount}/4），请稍后再试`);
      return null;
    }

    // 获取剧集ID和项目ID
    const episodeId = projectStore.currentEpisodeId;
    const projectId = projectStore.currentProjectId;

    if (!episodeId || !projectId) {
      ElMessage.error('项目或剧集信息不存在');
      return null;
    }

    // 使用传入的 modelCode 或从项目Store获取
    const finalModelCode = modelCode || projectStore.selectedModeCodeImage?.modelCode;
    if (!finalModelCode) {
      ElMessage.error('请先选择图片生成模型');
      return null;
    }

    // 清理该镜头的旧已完成任务（保留最近4个）
    cleanupOldCompletedTasks(shot.id);

    // 构造提示词
    const prompt = shot.sceneDescription || shot.sceneHint || '';

    // 构造请求参数
    const request: AddTaskRequest = {
      basicId: shot.basicId,
      shotId: shot.id,
      shotNumber: String(shot.shotNumber),
      episodeId,
      projectId: Number(projectId),
      mode: 't2i',
      prompt,
      dialogue: shot.dialogue
    };

    // 添加到队列
    const task = taskQueueStore.addTask(request);

    if (task) {
      // 设置模型代码
      task.modelCode = finalModelCode;

      // 记录API调用时间（在调用API前记录，防止重复）
      pendingApiCalls.set(shot.basicId, Date.now());

      // 调用生成接口
      callImageGenerateAPI(task.basicId, finalModelCode, Number(episodeId));
    }

    return task;
  };

  /**
   * 添加视频生成任务到队列
   * @param shot 分镜数据
   * @param videoPrompt 视频提示词（可选）
   * @returns 创建的任务对象，失败返回 null
   */
  const addVideoGenerationTask = (
    shot: {
      basicId?: number;
      id: string | number;
      shotNumber: string | number;
      sceneDescription?: string;
      dialogue?: string;
    },
    videoPrompt?: string
  ): TaskQueueItem | null => {
    // 检查镜头是否有 basicId
    if (!shot.basicId) {
      ElMessage.warning('镜头基础信息不存在，无法生成');
      return null;
    }

    // 检查该镜头是否可以添加新任务
    if (!canAddTaskForShot(shot.id)) {
      const activeCount = getActiveTaskCountByShotId(shot.id);
      ElMessage.warning(`该镜头正在生成中（${activeCount}/4），请稍后再试`);
      return null;
    }

    // 获取剧集ID和项目ID
    const episodeId = projectStore.currentEpisodeId;
    const projectId = projectStore.currentProjectId;

    if (!episodeId || !projectId) {
      ElMessage.error('项目或剧集信息不存在');
      return null;
    }

    // 获取视频模型配置
    const videoModelConfig = projectStore.selectedModeCodeVideo;
    if (!videoModelConfig) {
      ElMessage.error('请先选择视频生成模型');
      return null;
    }

    // 构造请求参数
    const request: AddTaskRequest = {
      basicId: shot.basicId,
      shotId: shot.id,
      shotNumber: String(shot.shotNumber),
      episodeId,
      projectId: Number(projectId),
      mode: 'i2v',
      prompt: videoPrompt || shot.sceneDescription || '',
      dialogue: shot.dialogue
    };

    // 添加到队列
    const task = taskQueueStore.addTask(request);

    if (task) {
      // 设置模型配置
      task.modelCode = videoModelConfig.modelCode;
      task.resolution = videoModelConfig.resolution;
      task.duration = videoModelConfig.duration;

      // 调用生成接口
      callVideoGenerateAPI(task.basicId, Number(episodeId));
    }

    return task;
  };

  /**
   * 调用图片生成接口
   * @param basicId 镜头基础ID
   * @param modelCode 模型代码
   * @param episodeId 剧集ID
   */
  const callImageGenerateAPI = async (basicId: number, modelCode: string, episodeId: number) => {
    try {
      await generateEpisodeImg({
        basicId,
        episodeId,
        modelCode
      });
      console.log('[useTaskQueue] 图片生成接口调用成功:', basicId);
    } catch (error: any) {
      console.error('[useTaskQueue] 图片生成接口调用失败:', error);

      // 如果是防重复提交错误，不标记任务为失败（任务已加入后端队列）
      if (error?.message?.includes('不允许重复提交')) {
        console.warn('[useTaskQueue] 检测到防重复提交，任务已加入后端队列');
        // 清除冷却时间，允许下次调用
        pendingApiCalls.delete(basicId);
        return;
      }

      // 其他错误：查找对应的任务并标记为失败
      const task = taskQueueStore.getTaskByBasicId(basicId);
      if (task) {
        taskQueueStore.updateTask(task.id, 3, undefined, '接口调用失败');
      }

      // 清除冷却时间
      pendingApiCalls.delete(basicId);

      ElMessage.error('图片生成请求失败');
    }
  };

  /**
   * 调用视频生成接口
   * @param basicId 镜头基础ID
   * @param _episodeId 剧集ID（保留以备将来使用）
   */
  const callVideoGenerateAPI = async (basicId: number, _episodeId: number) => {
    // 获取视频模型配置
    const videoModelConfig = projectStore.selectedModeCodeVideo;
    if (!videoModelConfig) {
      console.error('[useTaskQueue] 视频模型配置不存在');
      const task = taskQueueStore.getTaskByBasicId(basicId);
      if (task) {
        taskQueueStore.updateTask(task.id, 3, undefined, '视频模型配置不存在');
      }
      return;
    }

    try {
      await generateVideo({
        basicIds: [basicId], // 视频生成接口需要数组形式
        resolution: videoModelConfig.resolution || '1080p',
        duration: videoModelConfig.duration || 5,
        modelCode: videoModelConfig.modelCode || 'jm-3.0'
      });
      console.log('[useTaskQueue] 视频生成接口调用成功:', basicId);
    } catch (error) {
      console.error('[useTaskQueue] 视频生成接口调用失败:', error);

      // 查找对应的任务并标记为失败
      const task = taskQueueStore.getTaskByBasicId(basicId);
      if (task) {
        taskQueueStore.updateTask(task.id, 3, undefined, '接口调用失败');
      }

      ElMessage.error('视频生成请求失败');
    }
  };

  /**
   * 处理SSE任务状态更新
   * @param basicId 镜头基础ID
   * @param status 任务状态
   * @param resultUrls 结果URL列表（可选）
   * @param errorMessage 错误信息（可选）
   */
  const handleTaskStatusUpdate = (
    basicId: number,
    status: TaskStatus,
    resultUrls?: string[],
    errorMessage?: string
  ) => {
    // 查找对应的任务
    const task = taskQueueStore.getTaskByBasicId(basicId);

    if (!task) {
      console.warn('[useTaskQueue] 未找到对应的任务:', basicId);
      return;
    }

    // 更新任务状态
    taskQueueStore.updateTask(task.id, status, resultUrls, errorMessage);

    // 根据状态显示提示
    if (status === 2) {
      // 成功
      ElMessage.success(`镜头 ${task.shotNumber} 生成完成`);
    } else if (status === 3) {
      // 失败
      ElMessage.error(`镜头 ${task.shotNumber} 生成失败${errorMessage ? ': ' + errorMessage : ''}`);
    }
  };

  /**
   * 处理SSE批量任务状态更新
   * @param detail SSE事件详情
   */
  const handleBatchTaskUpdate = (detail: {
    batchStatus?: number;
    episodeSceneItemInfoList?: Array<{
      basicId?: number;
      taskStatus?: number;
      materialVoList?: Array<{ originOssUrl?: string }>;
    }>;
  }) => {
    if (!detail.episodeSceneItemInfoList || detail.episodeSceneItemInfoList.length === 0) {
      return;
    }

    // 遍历每个镜头的状态更新
    detail.episodeSceneItemInfoList.forEach((item) => {
      if (!item.basicId || item.taskStatus === undefined) {
        return;
      }

      // 提取结果URL
      const resultUrls = item.materialVoList?.map((m) => m.originOssUrl).filter(Boolean) as string[];

      // 处理任务状态更新
      handleTaskStatusUpdate(
        item.basicId,
        item.taskStatus as TaskStatus,
        resultUrls.length > 0 ? resultUrls : undefined
      );
    });
  };

  /**
   * 移除已完成的任务
   * @param taskId 任务ID
   */
  const removeCompletedTask = (taskId: string) => {
    taskQueueStore.removeTask(taskId);
  };

  /**
   * 清空所有已完成和失败的任务
   */
  const clearCompletedTasks = () => {
    taskQueueStore.clearCompletedTasks();
  };

  /**
   * 重试失败的任务
   * @param taskId 任务ID
   */
  const retryTask = (taskId: string) => {
    const task = taskQueueStore.getTaskById(taskId);
    if (!task) {
      ElMessage.warning('任务不存在');
      return;
    }

    // 重置任务
    const success = taskQueueStore.retryTask(taskId);

    if (success) {
      // 重新调用生成接口
      if (task.mode === 't2i' && task.modelCode) {
        callImageGenerateAPI(task.basicId, task.modelCode, Number(task.episodeId));
      } else if ((task.mode === 'i2v' || task.mode === 'r2v') && task.basicId) {
        callVideoGenerateAPI(task.basicId, Number(task.episodeId));
      }
    }
  };

  /**
   * 切换剧集时清空队列
   * @param episodeId 新的剧集ID
   */
  const switchEpisode = (episodeId: string | number) => {
    taskQueueStore.switchEpisode(episodeId);
  };

  /**
   * 清理指定镜头的旧已完成任务（保留最近4个）
   * @param shotId 镜头ID
   */
  const cleanupOldCompletedTasks = (shotId: string | number) => {
    const allTasks = taskQueueStore.getTasksByShotId(shotId);
    const completedTasks = allTasks.filter((t) => t.status === 2 || t.status === 3);

    // 如果完成的任务超过4个，删除最旧的
    if (completedTasks.length > 4) {
      const tasksToRemove = completedTasks.slice(0, completedTasks.length - 4);
      tasksToRemove.forEach((task) => {
        taskQueueStore.removeTask(task.id);
      });
    }
  };

  // ==================== 返回 ====================

  return {
    // 状态
    activeTaskCount,
    queuedTaskCount,

    // 镜头级别操作
    getTasksByShotId,
    getActiveTaskCountByShotId,
    canAddTaskForShot,

    // 任务操作
    addImageGenerationTask,
    addVideoGenerationTask,
    handleTaskStatusUpdate,
    handleBatchTaskUpdate,
    removeCompletedTask,
    clearCompletedTasks,
    retryTask,
    switchEpisode,

    // Store实例（供直接访问）
    taskQueueStore
  };
}

export default useTaskQueue;
