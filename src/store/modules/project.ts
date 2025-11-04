import { delEpisode } from '@/api/workbench/episode';
import { createProcessRecord, getProjectInfo, getReferPage } from '@/api/workbench/project';
import type {
  AiModelInfoDto,
  Character,
  Episode,
  EpisodeInfo,
  MaterialStaticsInfo,
  ProductionStats,
  ProjectInfoResponse,
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

  // 步骤定义
  steps: StepInfo[];
  currentStep: number;

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

  // 统计数据
  progress: ProjectProgress | null;
  stats: ProductionStats | null;

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
    steps: [
      { key: 1, name: '剧本', icon: 'document' },
      { key: 2, name: '角色', icon: 'user' },
      { key: 3, name: '场景', icon: 'picture' },
      { key: 4, name: '分镜头', icon: 'list' },
      { key: 5, name: '视频', icon: 'video-camera' }
    ],
    currentStep: 1,
    characters: [],
    scenes: [],
    teamUserInfoList: [],
    materialStaticsInfo: null,
    i2vModelInfoList: [],
    t2iModelInfoList: [],
    t2tModelInfoList: [],
    progress: null,
    stats: null,
    loading: false,
    isInitializing: false
  }),

  getters: {
    /**
     * 获取当前剧集的完成进度
     */
    currentEpisodeProgress: (state) => {
      if (!state.currentEpisode) return 0;
      return state.currentEpisode.progress || 0;
    },

    /**
     * 获取剧集总数
     */
    episodeCount: (state) => state.episodes.length,

    /**
     * 获取角色总数
     */
    characterCount: (state) => state.characters.length,

    /**
     * 获取场景总数
     */
    sceneCount: (state) => state.scenes.length,

    /**
     * 获取第4步的视图模式
     */
    step4ViewMode: (state) => {
      return state.currentEpisode?.step4ViewMode || 'storyboard';
    },

    /**
     * 获取第4步的显示信息（名称和图标）
     */
    step4DisplayInfo: (state) => {
      const viewMode = state.currentEpisode?.step4ViewMode || 'storyboard';
      const displayMap = {
        storyboard: { name: '分镜头', icon: 'step-fenjing' },
        grid: { name: '故事板', icon: 'step-story' },
        waterfall: { name: '瀑布流', icon: 'step-pubu' }
      };
      return displayMap[viewMode];
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
      this.currentProjectId = projectId;
      this.loading = true;
      this.isInitializing = true; // 标记正在初始化

      try {
        // 如果有强制步骤参数，先预设步骤（避免闪烁）
        if (forceStep && forceStep >= 1 && forceStep <= 5) {
          this.currentStep = forceStep;
        }

        // 并行加载项目信息和工作流记录（优化加载速度）
        const [, processRecord] = await Promise.allSettled([
          this.loadProjectInfo(Number(projectId)),
          forceStep ? Promise.resolve(null) : getReferPage({ projectId: Number(projectId) }).then((res) => res.data)
        ]);

        // 如果有强制步骤参数，直接使用（如新建项目跳转到角色步骤）
        if (forceStep && forceStep >= 1 && forceStep <= 5) {
          // 加载第一个剧集（如果有）
          if (this.episodeInfoList.length > 0) {
            await this.switchEpisodeFromInfo(this.episodeInfoList[0]);
          }
          return;
        }

        // 提取工作流记录
        const record =
          processRecord.status === 'fulfilled' ? (processRecord.value as ProjectProcessRecordVo | null) : null;

        console.log('[initProject] 工作流记录:', record);

        // 先预设步骤（仅设置步骤号，不设置视图模式）
        if (record?.currentPage) {
          const step = this.mapWorkflowPageToStep(record.currentPage);
          console.log(`[initProject] 映射步骤: currentPage=${record.currentPage} -> step=${step}`);
          this.currentStep = step;
        }

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

        // 剧集加载完成后，再次调用映射方法以正确设置视图模式
        if (record?.currentPage && this.currentEpisode) {
          const step = this.mapWorkflowPageToStep(record.currentPage);
          console.log(`[initProject] 剧集加载后再次映射: currentPage=${record.currentPage} -> step=${step}`);
          console.log('[initProject] currentEpisode.step4ViewMode:', this.currentEpisode.step4ViewMode);
          this.currentStep = step;
        }
        console.log('[initProject] 最终 currentStep:', this.currentStep);
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
          }, 300); // 延长到300ms，让步骤条的active状态平滑过渡
        });
      }
    },

    /**
     * 加载项目详细信息（新接口）
     * @param projectId 项目ID
     */
    async loadProjectInfo(projectId: number) {
      try {
        const res = await getProjectInfo(projectId);
        const data: ProjectInfoResponse = res.data;

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

        // 转换剧集信息为旧格式（兼容现有逻辑）
        this.episodes = this.episodeInfoList
          .filter((ep) => ep.episodeId !== undefined && ep.episodeName !== undefined)
          .map((ep) => ({
            id: ep.episodeId!,
            projectId: projectId,
            name: ep.episodeName!,
            currentStep: 1,
            progress: parseFloat(ep.episodePercent || '0') || 0,
            scriptContent: ep.storyText
          }));
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
    },

    // ==================== 剧集管理 ====================

    /**
     * 从 EpisodeInfo 切换剧集（新接口）
     * @param episodeInfo 剧集信息
     */
    async switchEpisodeFromInfo(episodeInfo: EpisodeInfo) {
      try {
        // 保存当前步骤和视图模式（在切换剧集时保留）
        const previousStep = this.currentStep;
        const previousStep4ViewMode = this.currentEpisode?.step4ViewMode;

        // 转换为旧格式
        this.currentEpisode = {
          id: episodeInfo.episodeId!,
          projectId: this.currentProjectId!,
          name: episodeInfo.episodeName!,
          currentStep: previousStep, // 保留当前步骤，不要重置为1
          step4ViewMode: previousStep4ViewMode || 'storyboard', // 保留之前的视图模式，如果没有则默认使用分镜表
          progress: parseFloat(episodeInfo.episodePercent || '0') || 0,
          scriptContent: episodeInfo.storyText
        };

        this.currentEpisodeId = episodeInfo.episodeId!;
        // 不要再次设置 currentStep，保持当前值

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

    /**
     * 删除剧集
     * @param episodeId 剧集ID
     */
    async deleteEpisode(episodeId: string | number) {
      if (!this.currentProjectId) return;

      try {
        await delEpisode(this.currentProjectId, episodeId);
        this.episodes = this.episodes.filter((ep) => ep.id !== episodeId);

        // 如果删除的是当前剧集，切换到第一个剧集
        if (this.currentEpisodeId === episodeId && this.episodes.length > 0) {
          await this.switchEpisode(this.episodes[0].id);
        }

        ElMessage.success('剧集删除成功');
      } catch (error) {
        console.error('删除剧集失败:', error);
        ElMessage.error('删除剧集失败');
      }
    },

    // ==================== 步骤管理 ====================

    /**
     * 将前端步骤号映射到后端工作流节点
     * @param step 前端步骤号 (1-5)
     * @param viewMode 第4步的视图模式
     * @returns 后端工作流节点 (1-7)
     */
    mapStepToWorkflowPage(step: number, viewMode?: string): number {
      // 1-剧本 2-角色 3-场景 4-分镜头 5-故事板 6-瀑布流 7-视频
      if (step === 4) {
        // 第4步根据视图模式映射到不同的工作流节点
        const mode = viewMode || this.step4ViewMode;
        if (mode === 'storyboard') return 4; // 分镜头
        if (mode === 'grid') return 5; // 故事板
        if (mode === 'waterfall') return 6; // 瀑布流
        return 4; // 默认分镜表
      }
      if (step === 5) return 7; // 视频
      return step; // 1-剧本 2-角色 3-场景
    },

    /**
     * 将后端工作流节点映射回前端步骤号
     * @param workflowPage 后端工作流节点 (1-7)
     * @returns 前端步骤号 (1-5)
     */
    mapWorkflowPageToStep(workflowPage: number): number {
      // 1-剧本 2-角色 3-场景 4-分镜头 5-故事板 6-瀑布流 7-视频
      if (workflowPage >= 4 && workflowPage <= 6) {
        // 分镜头/故事板/瀑布流都映射到第4步
        // 同时更新视图模式
        if (this.currentEpisode) {
          if (workflowPage === 4) this.currentEpisode.step4ViewMode = 'storyboard';
          else if (workflowPage === 5) this.currentEpisode.step4ViewMode = 'grid';
          else if (workflowPage === 6) this.currentEpisode.step4ViewMode = 'waterfall';
        }
        return 4;
      }
      if (workflowPage === 7) return 5; // 视频
      return workflowPage; // 1-剧本 2-角色 3-场景
    },

    /**
     * 跳转到指定步骤
     * @param step 步骤编号 (1-5)
     */
    async goToStep(step: number) {
      if (!this.currentProjectId) {
        console.warn('项目ID不存在，无法切换步骤');
        return false;
      }

      // 创建工作流记录
      try {
        const currentPage = this.mapStepToWorkflowPage(step);
        await createProcessRecord({
          projectId: Number(this.currentProjectId),
          episodeId: this.currentEpisodeId ? Number(this.currentEpisodeId) : undefined,
          currentPage
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
      if (nextStep <= 5) {
        return await this.goToStep(nextStep);
      }
      return false;
    },

    /**
     * 更新第4步的视图模式
     * @param viewMode 视图模式：storyboard(分镜头) / grid(故事板) / waterfall(瀑布流)
     */
    async updateStep4ViewMode(viewMode: 'storyboard' | 'grid' | 'waterfall') {
      if (!this.currentEpisode || !this.currentProjectId) return;

      // 更新当前剧集的视图模式
      this.currentEpisode.step4ViewMode = viewMode;

      // 创建工作流记录（保存视图模式）
      try {
        const currentPage = this.mapStepToWorkflowPage(4, viewMode);
        await createProcessRecord({
          projectId: Number(this.currentProjectId),
          episodeId: this.currentEpisodeId ? Number(this.currentEpisodeId) : undefined,
          currentPage
        });
      } catch (error) {
        console.error('保存视图模式到工作流记录失败:', error);
      }
    },

    // ==================== 剧本管理 ====================

    // ==================== 角色管理 ====================

    // ==================== 场景管理 ====================

    // ==================== 统计数据 ====================

    /**
     * 加载项目进度 - 已废弃
     * 统计数据应该从 getProjectInfo 接口的 materialStaticsInfo 中获取
     */
    async loadProgress() {
      console.warn('loadProgress 已废弃，统计数据已包含在 getProjectInfo 接口中');
      if (!this.currentProjectId) return;
      // 重新加载项目信息以获取最新统计
      await this.loadProjectInfo(Number(this.currentProjectId));
    },

    /**
     * 加载生产统计 - 已废弃
     * 统计数据应该从 getProjectInfo 接口的 materialStaticsInfo 和 teamUserInfoList 中获取
     */
    async loadStats() {
      console.warn('loadStats 已废弃，统计数据已包含在 getProjectInfo 接口中');
      if (!this.currentProjectId) return;
      // 重新加载项目信息以获取最新统计
      await this.loadProjectInfo(Number(this.currentProjectId));
    },

    // ==================== 辅助方法 ====================

    /**
     * 保存当前剧集状态
     */
    async saveCurrentEpisodeState() {
      if (!this.currentProjectId || !this.currentEpisode) return;

      try {
        // 创建工作流记录，保存当前步骤和视图模式
        const currentPage = this.mapStepToWorkflowPage(this.currentStep);
        await createProcessRecord({
          projectId: Number(this.currentProjectId),
          episodeId: this.currentEpisodeId ? Number(this.currentEpisodeId) : undefined,
          currentPage
        });
      } catch (error) {
        console.error('保存剧集状态失败:', error);
      }
    }
  }
});
