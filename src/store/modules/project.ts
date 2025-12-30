import { createProcessRecord, getProjectInfo, getReferPage } from '@/api/workbench/project';
import type {
  AiModelInfoDto,
  Character,
  Episode,
  EpisodeInfo,
  MaterialStaticsInfo,
  ProductionStats,
  ProjectInfoResponse,
  ProjectModelRequestDto,
  ProjectProcessRecordVo,
  ProjectProgress,
  Scene,
  TeamUserDetail
} from '@/api/workbench/project/types';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';

interface StepInfo {
  key: number;
  name: string;
  icon: string;
  isSubView?: boolean; // 标记是否为子视图（不在主步骤栏显示）
}

interface ProjectState {
  // 项目基础信息
  currentProjectId: string | number | null;
  currentEpisodeId: string | number | null;
  projectName: string;
  pictureRatio: number | null;
  allEpisodePercent: string;

  // 剧集列表
  episodes: Episode[];
  episodeInfoList: EpisodeInfo[];
  currentEpisode: Episode | null;

  // 步骤定义（直接使用后端的1-7编号，与WorkflowPage枚举对应）
  steps: StepInfo[];
  currentStep: number; // 当前步骤：1-剧本 2-角色 3-场景 4-分镜头 5-故事板 6-瀑布流 7-视频

  // 角色和场景数据
  characters: Character[];
  scenes: Scene[];

  // 团队信息
  teamUserInfoList: TeamUserDetail[];

  // 素材统计
  materialStaticsInfo: MaterialStaticsInfo | null;

  // AI模型信息
  i2vModelInfoList: AiModelInfoDto[];
  t2iModelInfoList: AiModelInfoDto[];
  t2tModelInfoList: AiModelInfoDto[];

  // 用户选择的模型配置
  selectedModeCodeImage: ProjectModelRequestDto | null;
  selectedModeCodeVideo: ProjectModelRequestDto | null;

  // 统计数据
  progress: ProjectProgress | null;
  stats: ProductionStats | null;

  // 项目权限
  projectPermissions: string[];

  // 加载状态
  loading: boolean;
  // 初始化状态（用于优化首次加载体验）
  isInitializing: boolean;
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    currentProjectId: null,
    currentEpisodeId: null,
    projectName: '',
    pictureRatio: null,
    allEpisodePercent: '0%',
    episodes: [],
    episodeInfoList: [],
    currentEpisode: null,
    // 直接使用后端WorkflowPage枚举值（1-7）
    steps: [
      { key: 1, name: '剧本', icon: 'document' },
      { key: 2, name: '角色', icon: 'user' },
      { key: 3, name: '场景', icon: 'picture' },
      { key: 4, name: '分镜头', icon: 'step-fenjing' },
      { key: 5, name: '故事板', icon: 'step-story', isSubView: true },
      { key: 6, name: '瀑布流', icon: 'step-pubu', isSubView: true },
      { key: 7, name: '视频', icon: 'video-camera' }
    ],
    currentStep: 1,
    characters: [],
    scenes: [],
    teamUserInfoList: [],
    materialStaticsInfo: null,
    i2vModelInfoList: [],
    t2iModelInfoList: [],
    t2tModelInfoList: [],
    selectedModeCodeImage: null,
    selectedModeCodeVideo: null,
    progress: null,
    stats: null,
    projectPermissions: [],
    loading: false,
    isInitializing: false
  }),

  getters: {
    /**
     * 获取主步骤列表（排除子视图）
     */
    mainSteps: (state) => {
      return state.steps.filter((step) => !step.isSubView);
    },

    /**
     * 判断当前是否在分镜头相关步骤（4/5/6）
     */
    isInStoryboardStep: (state) => {
      return state.currentStep >= 4 && state.currentStep <= 6;
    }
  },

  actions: {
    // ==================== 项目初始化 ====================

    /**
     * 初始化项目（使用新接口）
     * @param projectId 项目ID
     * @param forceStep 强制跳转到指定步骤（用于新建项目等场景，优先级高于工作流记录）
     */
    async initProject(projectId: string | number, forceStep?: number) {
      // 清除可能残留的旧项目数据
      this.currentEpisodeId = null;
      this.currentEpisode = null;
      this.episodeInfoList = [];
      this.episodes = [];

      this.currentProjectId = projectId;
      this.loading = true;
      this.isInitializing = true; // 标记正在初始化

      try {
        // 如果有强制步骤参数，先预设步骤（避免闪烁）
        if (forceStep && forceStep >= 1 && forceStep <= 7) {
          this.currentStep = forceStep;
        }

        // 并行加载项目信息和工作流记录（统一获取工作流记录，不再跳过）
        const [, processRecord] = await Promise.allSettled([
          this.loadProjectInfo(Number(projectId)),
          getReferPage({ projectId: Number(projectId) }).then((res) => res.data)
        ]);

        // 提取工作流记录
        const record =
          processRecord.status === 'fulfilled' ? (processRecord.value as ProjectProcessRecordVo | null) : null;

        // 确定要使用的步骤：优先使用工作流记录，如果没有则使用forceStep，最后兜底使用步骤1
        let targetStep = 1;
        if (record?.currentPage) {
          // 有工作流记录，直接使用记录中的步骤（无需映射）
          targetStep = record.currentPage;
        } else if (forceStep && forceStep >= 1 && forceStep <= 7) {
          // 没有工作流记录但有forceStep（新建项目场景），使用forceStep
          targetStep = forceStep;

          // 创建工作流记录，保存当前步骤
          try {
            await createProcessRecord({
              projectId: Number(projectId),
              episodeId: undefined, // 首次进入可能还没有剧集
              currentPage: targetStep
            });
          } catch (error) {
            console.error('[initProject] 创建工作流记录失败:', error);
            // 继续执行，不阻塞初始化
          }
        }

        // 设置当前步骤
        this.currentStep = targetStep;

        // 然后加载剧集
        if (record?.episodeId && this.episodeInfoList.length > 0) {
          // 如果工作流记录中有剧集ID，切换到对应剧集
          const episode = this.episodeInfoList.find((ep) => ep.episodeId === record!.episodeId);
          if (episode) {
            await this.switchEpisodeFromInfo(episode);
          } else if (this.episodeInfoList.length > 0) {
            // 找不到记录的剧集，加载第一个
            await this.switchEpisodeFromInfo(this.episodeInfoList[0]);
          }
        } else if (this.episodeInfoList.length > 0) {
          // 没有工作流记录，加载第一个剧集
          await this.switchEpisodeFromInfo(this.episodeInfoList[0]);
        }
      } catch (error) {
        console.error('初始化项目失败:', error);
        ElMessage.error('加载项目数据失败');
      } finally {
        this.loading = false;
        // 延迟结束初始化状态，确保UI渲染完成和过渡动画能正常播放
        // 使用 requestAnimationFrame 确保DOM更新完成
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.isInitializing = false;
          }, 100); // 缩短延迟时间，避免用户看到空白页面过久
        });
      }
    },

    /**
     * 加载项目详细信息（新接口）
     * @param projectId 项目ID
     */
    async loadProjectInfo(projectId: number) {
      try {
        const projectInfoRes = await getProjectInfo(projectId);
        const data: ProjectInfoResponse = projectInfoRes.data;

        // 更新项目基础信息
        this.projectName = data.projectName;
        this.pictureRatio = data.pictureRatio;
        this.allEpisodePercent = data.allEpisodePercent;

        // 更新剧集信息
        this.episodeInfoList = data.episodeInfoList || [];

        // 更新团队信息
        this.teamUserInfoList = data.teamUserInfoList || [];

        // 更新素材统计
        this.materialStaticsInfo = data.materialStaticsInfo;

        // 更新AI模型信息
        this.i2vModelInfoList = data.i2vModelInfoList || [];
        this.t2iModelInfoList = data.t2iModelInfoList || [];
        this.t2tModelInfoList = data.t2tModelInfoList || [];

        // 更新用户选择的模型代码
        this.selectedModeCodeImage = data.selectedModeCodeImage || null;
        this.selectedModeCodeVideo = data.selectedModeCodeVideo || null;

        // 更新项目权限
        this.projectPermissions = data.permissions || [];

        // 转换剧集信息为旧格式（兼容现有逻辑）
        this.episodes = this.episodeInfoList
          .filter((ep) => ep.episodeId !== undefined && ep.episodeName !== undefined)
          .map((ep) => ({
            id: ep.episodeId!,
            projectId: projectId,
            name: ep.episodeName!,
            currentStep: 1,
            progress: parseFloat(ep.episodePercent || '0') || 0,
            scriptContent: ep.storyText,
            taskStatus: ep.taskStatus // 添加任务状态字段
          }));

        // 如果剧集列表为空，清除当前剧集ID
        if (this.episodes.length === 0) {
          this.currentEpisodeId = null;
          this.currentEpisode = null;
        } else if (this.currentEpisodeId) {
          // 如果当前剧集ID不在新的剧集列表中，清除它
          const episodeExists = this.episodes.some((ep) => ep.id === this.currentEpisodeId);
          if (!episodeExists) {
            this.currentEpisodeId = null;
            this.currentEpisode = null;
          }
        }
      } catch (error) {
        console.error('加载项目信息失败:', error);
        throw error;
      }
    },

    /**
     * 重置项目状态
     */
    resetProject() {
      this.currentProjectId = null;
      this.currentEpisodeId = null;
      this.episodes = [];
      this.currentEpisode = null;
      this.currentStep = 1;
      this.characters = [];
      this.scenes = [];
      this.progress = null;
      this.stats = null;
      this.projectPermissions = [];
    },

    // ==================== 剧集管理 ====================

    /**
     * 从 EpisodeInfo 切换剧集（新接口）
     * @param episodeInfo 剧集信息
     */
    async switchEpisodeFromInfo(episodeInfo: EpisodeInfo) {
      try {
        // 保存当前步骤（在切换剧集时保留）
        const previousStep = this.currentStep;

        // 转换为旧格式
        this.currentEpisode = {
          id: episodeInfo.episodeId!,
          projectId: this.currentProjectId!,
          name: episodeInfo.episodeName!,
          currentStep: previousStep, // 保留当前步骤，不要重置为1
          progress: parseFloat(episodeInfo.episodePercent || '0') || 0,
          scriptContent: episodeInfo.storyText
        };

        this.currentEpisodeId = episodeInfo.episodeId!;
        // 不要再次设置 currentStep，保持当前值

        // 更新工作流记录，保存当前剧集ID和步骤
        if (this.currentProjectId) {
          try {
            await createProcessRecord({
              projectId: Number(this.currentProjectId),
              episodeId: Number(episodeInfo.episodeId!),
              currentPage: previousStep
            });
          } catch (error) {
            console.error('[switchEpisodeFromInfo] 更新工作流记录失败:', error);
            // 继续执行，不阻塞剧集切换
          }
        }

        // 加载剧集相关数据
      } catch (error) {
        console.error('切换剧集失败:', error);
      }
    },

    /**
     * 切换剧集
     * @param episodeId 剧集ID
     */
    async switchEpisode(episodeId: string | number) {
      if (!this.currentProjectId) return;

      // 优先从 episodeInfoList 查找（来自 getProjectInfo 接口）
      const episodeInfo = this.episodeInfoList.find((ep) => ep.episodeId === episodeId);
      if (episodeInfo) {
        return await this.switchEpisodeFromInfo(episodeInfo);
      }

      // 如果没有找到，说明数据可能过期，重新加载项目信息
      console.warn('未找到剧集信息，重新加载项目数据');
      await this.loadProjectInfo(Number(this.currentProjectId));

      // 再次尝试查找
      const episodeInfoRetry = this.episodeInfoList.find((ep) => ep.episodeId === episodeId);
      if (episodeInfoRetry) {
        return await this.switchEpisodeFromInfo(episodeInfoRetry);
      }

      // 如果还是找不到，使用模拟数据
      console.error('切换剧集失败: 未找到剧集', episodeId);
      this.currentEpisodeId = episodeId;
      this.currentStep = this.currentEpisode?.currentStep || 1;
    },

    // ==================== 步骤管理 ====================

    /**
     * 跳转到指定步骤
     * @param step 步骤编号 (1-7)，对应后端WorkflowPage枚举
     */
    async goToStep(step: number) {
      if (!this.currentProjectId) {
        console.warn('项目ID不存在，无法切换步骤');
        return false;
      }

      // 创建工作流记录（直接使用步骤号，无需映射）
      // 重要：保存当前剧集ID到工作流记录中，确保下次进入时能恢复到当前剧集
      try {
        await createProcessRecord({
          projectId: Number(this.currentProjectId),
          episodeId: this.currentEpisodeId ? Number(this.currentEpisodeId) : undefined,
          currentPage: step
        });
      } catch (error) {
        console.error('创建工作流记录失败:', error);
        // 继续执行，不阻塞步骤切换
      }

      // 更新本地状态
      this.currentStep = step;

      if (this.currentEpisode) {
        this.currentEpisode.currentStep = step;
      }

      return true;
    },

    /**
     * 下一步
     */
    async nextStep() {
      const nextStep = this.currentStep + 1;
      if (nextStep <= 7) {
        return await this.goToStep(nextStep);
      }
      return false;
    },

    /**
     * 切换分镜头视图模式
     * @param viewMode 视图模式：4-分镜头 / 5-故事板 / 6-瀑布流
     */
    async switchStoryboardView(viewMode: 4 | 5 | 6) {
      if (!this.currentProjectId) return;

      // 直接跳转到对应步骤（4/5/6）
      return await this.goToStep(viewMode);
    },

    // ==================== SSE 数据更新 ====================

    /**
     * 处理 SSE 推送的数据更新
     * @param data SSE 推送的数据
     * messageType: 1-文生文 2-文生图 3-文生视频
     * projectId: 项目ID
     * episodeId: 剧集ID
     * message: 消息内容
     */
    async handleSSEUpdate(data: any) {
      try {
        const { messageType, projectId, episodeId, message } = data;

        // 检查是否是当前项目的消息
        if (projectId && projectId !== Number(this.currentProjectId)) {
          return;
        }

        // 检查是否是当前剧集的消息
        if (episodeId && episodeId !== Number(this.currentEpisodeId)) {
          return;
        }

        // 根据消息类型处理不同的更新
        switch (messageType) {
          case 1: // 文生文
            await this.handleTextGenerationUpdate(message, projectId, episodeId);
            break;

          case 2: // 文生图（分镜头图片生成）
            await this.handleImageGenerationUpdate(message, projectId, episodeId);
            break;

          case 3: // 文生视频
            await this.handleVideoGenerationUpdate(message, projectId, episodeId);
            break;

          default:
        }
      } catch (error) {
        console.error('[SSE] 处理数据更新失败:', error);
      }
    },

    /**
     * 处理文生文更新（messageType = 1）
     */
    async handleTextGenerationUpdate(message: any, projectId: number, episodeId: number) {
      // 发送事件通知，让分镜头列表组件刷新
      window.dispatchEvent(
        new CustomEvent('sse-image-update', {
          detail: { message, projectId, episodeId }
        })
      );
    },

    /**
     * 处理文生图更新（messageType = 2）
     * 对应接口：hivision/story/episode/img-scene-list
     */
    async handleImageGenerationUpdate(message: any, projectId: number, episodeId: number) {
      // 发送事件通知，让分镜头列表组件刷新
      window.dispatchEvent(
        new CustomEvent('sse-image-update', {
          detail: { message, projectId, episodeId }
        })
      );
    },

    /**
     * 处理文生视频更新（messageType = 3）
     * 对应接口：hivision/story/episode/video-scene-list
     */
    async handleVideoGenerationUpdate(message: any, projectId: number, episodeId: number) {
      // 发送事件通知，让视频列表组件刷新
      window.dispatchEvent(
        new CustomEvent('sse-video-update', {
          detail: { message, projectId, episodeId }
        })
      );
    }
  }
});
