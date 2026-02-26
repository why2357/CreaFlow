<template>
  <div class="step-script-board">
    <!-- 左侧剧集列表 -->
    <div class="left-sidebar">
      <!-- 剧集列表区域 -->
      <EpisodeListPanel
        :episodes="projectStore.episodes"
        :selected-id="projectStore.currentEpisodeId"
        @select="handleEpisodeChange"
        @add="handleAddEpisode"
        @rename="handleRenameEpisode"
        @delete="handleDeleteEpisode"
      />

      <!-- 资源统计区域 35% -->
      <div class="resource-section">
        <div class="section-header">
          <svg-icon icon-class="fy-ziyuan" style="width: 16px; height: 16px; color: #5252ff" />
          <span class="title">资源统计</span>
        </div>
        <div class="stat-cards">
          <!-- 图片进度 -->
          <div class="stat-card image-box">
            <div class="card-info">
              <div class="card-content">
                <div class="card-icon-text">
                  <svg-icon icon-class="fy-tupian" class="el-icon" />
                  <span class="card-label">图片进度</span>
                </div>
                <div class="card-value">{{ imgFinishCount }}/{{ imgTotalCount }}</div>
              </div>

              <el-progress :percentage="imgProgressPercent" :show-text="false" :stroke-width="6" />
            </div>
          </div>
          <!-- 视频进度 -->
          <div class="stat-card video-box">
            <div class="card-info">
              <div class="card-content">
                <div class="card-icon-text">
                  <svg-icon icon-class="fy-shipin" class="el-icon" />
                  <span class="card-label">视频进度</span>
                </div>
                <div class="card-value">{{ videoFinishCount }}/{{ videoTotalCount }}</div>
              </div>
              <el-progress :percentage="videoProgressPercent" :show-text="false" :stroke-width="6" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间剧本内容 -->
    <div class="center-content">
      <!-- 头部 -->
      <div class="script-header">
        <div class="header-info">
          <svg-icon icon-class="fy-word" class="el-icon" />
          <span class="title">剧集内容</span>
        </div>
      </div>

      <!-- 剧本内容区域 - 支持无限滚动 -->
      <div ref="scriptContainer" class="script-container" @scroll="handleScroll" v-loading="loading">
        <!-- 空状态 - 无剧集 -->
        <div
          v-if="!projectStore.episodeInfoList || projectStore.episodeInfoList.length === 0"
          class="empty-state-large"
        >
          <img
            style="width: 200px; height: 200px"
            src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/8d5b2bac5d1d409f.png"
            alt=""
          />
          <div style="color: #4e5969; font-size: 14px">暂无剧集</div>
        </div>

        <!-- 空状态 - 内容由条单上传（没有 storyText 且没有 modelCode） -->
        <div v-else-if="showUploadEmptyState && !loading" class="empty-state-large">
          <img
            style="width: 200px; height: 200px"
            src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/8d5b2bac5d1d409f.png"
            alt=""
          />
          <div style="color: #4e5969; font-size: 14px">内容由表单上传</div>
        </div>

        <!-- 剧本内容 -->
        <div v-else class="script-content">
          <div v-for="(paragraph, index) in paragraphs" :key="index" class="paragraph">
            {{ paragraph }}
          </div>

          <!-- 加载更多提示 -->
          <div v-if="hasMore && !loading" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载更多内容...</span>
          </div>

          <!-- 加载中提示 -->
          <div v-if="loading && paragraphs.length > 0" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <!-- 无更多内容提示 -->
          <div v-else-if="!hasMore && paragraphs.length > 0" class="no-more">
            <!-- <el-icon><CircleCheck /></el-icon> -->
            <span>全部内容已加载完毕</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="right-panel">
      <!-- 团队成员 -->
      <TeamMemberPanel :project-id="projectStore.currentProjectId || ''" />

      <!-- 成员生产数据 -->
      <ProductionStatsPanel />

      <!-- 项目进度 -->
      <ProgressPanel />
    </div>

    <!-- 新增剧集对话框 -->
    <AddEpisodeDialog
      v-model="addEpisodeDialogVisible"
      :project-id="Number(projectStore.currentProjectId) || 0"
      :next-episode-number="(projectStore.episodeInfoList?.length || 0) + 1"
      @success="handleAddEpisodeSuccess"
    />

    <!-- 工作流选择对话框 -->
    <SelectWorkflowDialog v-model="workflowDialogVisible" @confirm="handleWorkflowSelect" />
  </div>
</template>

<script setup lang="ts" name="StepScript">
  import { deleteEpisodes, renameEpisode } from '@/api/workbench/episode';
  import { setEpisodeWorkflowMode } from '@/utils/episodeWorkflow';
  import type { Episode } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { Loading } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { debounce } from 'lodash-es';
  import { computed, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';

  // 导入共享组件
  import AddEpisodeDialog from '../../components/AddEpisodeDialog.vue';
  import SelectWorkflowDialog from '../../components/SelectWorkflowDialog.vue';
  import EpisodeListPanel from './components/EpisodeListPanel.vue';

  // 导入右侧面板组件
  import ProductionStatsPanel from './components/ProductionStatsPanel.vue';
  import ProgressPanel from './components/ProgressPanel.vue';
  import TeamMemberPanel from './components/TeamMemberPanel.vue';

  const projectStore = useProjectStore();

  // 剧本内容
  const scriptContent = ref('');
  const paragraphs = ref<string[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);

  // 滚动容器
  const scriptContainer = ref<HTMLElement | null>(null);

  // 新增剧集对话框
  const addEpisodeDialogVisible = ref(false);

  // 工作流选择对话框
  const workflowDialogVisible = ref(false);

  // 临时保存即将创建的剧集的工作流模式
  const pendingWorkflowMode = ref<'classic' | 'seedance' | null>(null);

  // 标记是否已经完成首次加载（用于区分 onMounted 和 onActivated）
  const isFirstLoad = ref(true);

  // 分页参数
  const pageSize = 20; // 每次加载段落数（增加到20以提升体验）
  let currentPage = 0;

  // 素材统计计算属性 - 处理 null 的情况
  const imgFinishCount = computed(() => {
    if (!projectStore.materialStaticsInfo) return 0;
    return projectStore.materialStaticsInfo.imgFinishCount || 0;
  });

  const imgTotalCount = computed(() => {
    if (!projectStore.materialStaticsInfo) return 0;
    return projectStore.materialStaticsInfo.imgTotalCount || 0;
  });

  const videoFinishCount = computed(() => {
    if (!projectStore.materialStaticsInfo) return 0;
    return projectStore.materialStaticsInfo.videoFinishCount || 0;
  });

  const videoTotalCount = computed(() => {
    if (!projectStore.materialStaticsInfo) return 0;
    return projectStore.materialStaticsInfo.videoTotalCount || 0;
  });

  const imgProgressPercent = computed(() => {
    const total = imgTotalCount.value;
    if (total === 0) return 0;
    return Math.round((imgFinishCount.value / total) * 100);
  });

  const videoProgressPercent = computed(() => {
    const total = videoTotalCount.value;
    if (total === 0) return 0;
    return Math.round((videoFinishCount.value / total) * 100);
  });

  // 判断是否显示"内容由条单上传"空状态
  const showUploadEmptyState = computed(() => {
    const currentEpisodeInfo = projectStore.episodeInfoList.find(
      (ep) => ep.episodeId === projectStore.currentEpisodeId
    );
    // 当前剧集存在，且没有 storyText 也没有 modelCode 时显示
    return currentEpisodeInfo && !currentEpisodeInfo.storyText && !currentEpisodeInfo.modelCode;
  });

  // 初始化剧本内容
  onMounted(async () => {
    // 标记首次加载完成
    isFirstLoad.value = false;
  });

  // 每次激活时刷新数据（支持 KeepAlive 缓存）
  onActivated(async () => {
    // 如果是首次加载（onMounted 后立即触发的 onActivated），跳过
    if (isFirstLoad.value) {
      return;
    }

    // 刷新项目信息，确保获取最新的资源统计、进度等数据
    if (projectStore.currentProjectId) {
      await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));
    }
    loadScript();
  });

  // 加载剧本
  const loadScript = () => {
    // 优先从 episodeInfoList 获取当前剧集的剧本文本
    const currentEpisodeInfo = projectStore.episodeInfoList.find(
      (ep) => ep.episodeId === projectStore.currentEpisodeId
    );

    if (currentEpisodeInfo?.storyText) {
      scriptContent.value = currentEpisodeInfo.storyText;
      loadMoreParagraphs();
    } else if (projectStore.currentEpisode?.scriptContent) {
      // 降级到旧数据源
      scriptContent.value = projectStore.currentEpisode.scriptContent;
      loadMoreParagraphs();
    } else {
      loadMoreParagraphs();
    }
  };

  // 智能分割段落
  const splitIntoParagraphs = (text: string): string[] => {
    if (!text) return [];

    // 1. 按双换行符分割段落（保留段落结构）
    let paragraphs = text.split(/\n\n+/);

    // 2. 如果没有双换行符，尝试按单换行符分割
    if (paragraphs.length === 1) {
      paragraphs = text.split(/\n+/);
    }

    // 3. 清理和过滤段落
    return paragraphs
      .map((p) => p.trim()) // 去除首尾空白
      .filter((p) => p.length > 0) // 过滤空段落
      .map((p) => p.replace(/\s+/g, ' ')); // 合并多个空格为一个
  };

  // 加载更多段落
  const loadMoreParagraphs = () => {
    if (!hasMore.value || loading.value) return;

    loading.value = true;

    // 模拟异步加载（实际应用中可以从后端分页获取）
    setTimeout(
      () => {
        const allParagraphs = splitIntoParagraphs(scriptContent.value);
        const start = currentPage * pageSize;
        const end = start + pageSize;
        const newParagraphs = allParagraphs.slice(start, end);

        if (newParagraphs.length > 0) {
          paragraphs.value.push(...newParagraphs);
          currentPage++;
        }

        // 检查是否还有更多内容
        hasMore.value = end < allParagraphs.length;

        loading.value = false;

        // 如果首次加载后内容不足以填满容器，继续加载
        if (currentPage === 1 && hasMore.value && scriptContainer.value) {
          const { scrollHeight, clientHeight } = scriptContainer.value;
          if (scrollHeight <= clientHeight) {
            setTimeout(() => loadMoreParagraphs(), 100);
          }
        }
      },
      currentPage === 0 ? 100 : 300
    ); // 首次加载更快
  };

  // 处理滚动事件
  const handleScroll = debounce((e: Event) => {
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const clientHeight = target.clientHeight;
    const scrollHeight = target.scrollHeight;

    // 距离底部200px时加载更多（提前加载，提升体验）
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore.value && !loading.value) {
      loadMoreParagraphs();
    }
  }, 150);

  // 切换剧集
  const handleEpisodeChange = async (episodeId: string | number) => {
    if (episodeId === projectStore.currentEpisodeId) return;

    await projectStore.switchEpisode(episodeId);
  };

  // 显示新增剧集对话框 - 先显示工作流选择
  const handleAddEpisode = () => {
    workflowDialogVisible.value = true;
  };

  // 工作流选择确认回调
  const handleWorkflowSelect = (mode: 'classic' | 'seedance') => {
    console.log('选择的工作流:', mode);
    // 临时保存即将创建的剧集的工作流模式
    pendingWorkflowMode.value = mode;
    // 选择完成后，显示新增剧集对话框
    addEpisodeDialogVisible.value = true;
  };

  // 新增剧集成功回调
  const handleAddEpisodeSuccess = async (newEpisodeId: number) => {
    console.log('[StepScript handleAddEpisodeSuccess] 收到新剧集ID:', newEpisodeId);
    console.log('[StepScript handleAddEpisodeSuccess] 待保存的工作流模式:', pendingWorkflowMode.value);

    // 如果有待保存的工作流模式，保存到新创建的剧集
    if (pendingWorkflowMode.value && newEpisodeId > 0) {
      setEpisodeWorkflowMode(newEpisodeId, pendingWorkflowMode.value);
      console.log(`[StepScript handleAddEpisodeSuccess] 剧集 ${newEpisodeId} 工作流模式设置为: ${pendingWorkflowMode.value}`);
      console.log('[StepScript handleAddEpisodeSuccess] 当前 localStorage:', localStorage.getItem('episode_workflow_mode'));
      // 清空临时保存的工作流模式
      pendingWorkflowMode.value = null;
    } else {
      console.log('[StepScript handleAddEpisodeSuccess] 跳过保存工作流模式 - newEpisodeId:', newEpisodeId, 'pendingWorkflowMode:', pendingWorkflowMode.value);
    }

    // 重新加载项目信息以获取最新的剧集列表
    await projectStore.loadProjectInfo(projectStore.currentProjectId as number);
    ElMessage.success('剧集创建成功');
  };

  // 重命名剧集
  const handleRenameEpisode = async (episode: Episode) => {
    try {
      const { value: newName } = await ElMessageBox.prompt('请输入新的剧集名称', '重命名', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: episode.name,
        inputPattern: /\S+/,
        inputErrorMessage: '剧集名称不能为空'
      });

      if (newName && newName.trim()) {
        // 调用重命名接口
        await renameEpisode(Number(episode.id), newName.trim());

        // 重新加载项目信息以获取最新的剧集列表
        await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));

        ElMessage.success('重命名成功');
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('重命名剧集失败:', error);
        // const errorMsg = error?.response?.data?.msg || error?.message || '重命名失败';
      }
    }
  };

  // 删除剧集
  const handleDeleteEpisode = async (episode: Episode) => {
    try {
      await ElMessageBox.confirm(`确定要删除剧集「${episode.name}」吗？此操作不可恢复。`, '删除剧集', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      // 调用删除接口
      await deleteEpisodes([Number(episode.id)]);

      // 重新加载项目信息以获取最新的剧集列表
      await projectStore.loadProjectInfo(Number(projectStore.currentProjectId));

      // 如果删除的是当前选中的剧集，自动切换到第一个剧集
      if (episode.id === projectStore.currentEpisodeId && projectStore.episodes.length > 0) {
        await projectStore.switchEpisode(projectStore.episodes[0].id);
      }

      ElMessage.success('删除成功');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除剧集失败:', error);
      }
    }
  };

  // 监听剧集切换
  watch(
    () => projectStore.currentEpisodeId,
    () => {
      // 重置状态
      scriptContent.value = ''; // 清空剧本内容缓存
      paragraphs.value = [];
      currentPage = 0;
      hasMore.value = true;

      // 重新加载
      loadScript();
    }
  );

  // 页面卸载前保存滚动位置
  onBeforeUnmount(() => {
    if (scriptContainer.value) {
      // saveScrollPosition(scriptContainer.value.scrollTop);
    }
  });
</script>

<style scoped lang="scss">
  .step-script-board {
    display: flex;
    height: 100%;
    overflow: hidden;
  }

  // 左侧边栏
  .left-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0; // 防止压缩
    gap: 18px;
    width: 16%;
    min-width: 200px;
    max-width: 280px;
    padding-right: 16px;
    overflow-y: auto;

    // 隐藏滚动条但保留滚动功能
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE 10+

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari, Edge
    }

    // 资源统计区域
    .resource-section {
      display: flex;
      flex-direction: column;
      padding: 20px 16px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 2px 8px rgb(0 0 0 / 4%);

      .section-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding-bottom: 12px;

        .title {
          color: #1d2129;
          font-size: 14px;
          font-weight: 600;
        }
      }

      .stat-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .image-box {
          background-image: url('../../../../../assets/images/image-ai.svg');
        }

        .video-box {
          background-image: url('../../../../../assets/images/video-ai.svg');
        }

        .stat-card {
          position: relative;
          width: 100%;
          aspect-ratio: 160 / 96;
          overflow: hidden;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          transition: all 0.3s;

          .card-info {
            position: absolute;
            bottom: 12px;
            left: 7%;
            width: 85%;
            z-index: 1;

            .card-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 10px;
            }

            .card-icon-text {
              display: flex;
              align-items: center;
              gap: 6px;

              .el-icon {
                width: 12px;
                height: 12px;
                color: #5252ff;
              }

              .card-label {
                color: #4e5969;
                font-size: 12px;
                font-weight: 500;
              }
            }

            .card-value {
              color: #1d2129;
              font-size: 14px;
              font-weight: 700;
            }

            .el-progress {
              :deep(.el-progress-bar__outer) {
                background-color: #fff;
              }

              :deep(.el-progress-bar__inner) {
                background-color: #5252ff;
              }
            }
          }
        }
      }
    }
  }

  // 中间内容区
  .center-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    flex-shrink: 1; // 允许压缩,优先压缩
    min-width: 400px; // 设置最小宽度,防止过度压缩
    margin: 0 8px;
    overflow: hidden;
    border-radius: 12px;
    background: white;

    .script-header {
      // border-bottom: 2px solid #f0f2f5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 0;
      // background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);

      .header-info {
        display: flex;
        align-items: center;
        gap: 7px;

        .el-icon {
          color: #6c5ce7;
          font-size: 17px;
        }

        .title {
          color: #1a1a1a;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .el-tag {
          font-weight: 600;
        }
      }

      .header-actions {
        .word-count {
          padding: 6px 16px;
          border: 1px solid #e8e6ff;
          border-radius: 20px;
          background: #f9f8ff;
          color: #6c5ce7;
          font-size: 15px;
          font-weight: 600;
        }
      }
    }

    .script-container {
      flex: 1;
      padding: 12px 20px 20px;
      overflow-y: auto;

      // 隐藏滚动条但保留滚动功能
      scrollbar-width: none; // Firefox
      -ms-overflow-style: none; // IE 10+

      &::-webkit-scrollbar {
        display: none; // Chrome, Safari, Edge
      }

      .empty-state-large {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
        min-height: 400px;
        padding: 60px 40px;
        text-align: center;
        position: relative;
        top: -100px;
        color: #4e5969;

        .el-button {
          margin-top: 8px;
        }
      }

      .script-content {
        max-width: 850px;
        // background: white;
        // padding: 48px 56px;
        // border-radius: 12px;
        // box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1);
        min-height: calc(100vh - 300px);
        margin: 0 auto;
        // position: relative;

        // 增加纸张质感
        &::before {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgb(108 92 231 / 10%), transparent);
          content: '';
        }

        .paragraph {
          margin-bottom: 24px;
          color: #2c3e50;
          font-size: 16px;
          line-height: 2.2;
          letter-spacing: 0.5px;
          text-align: justify;
          text-indent: 2em;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          transition: all 0.2s;

          &:hover {
            color: #1a252f;
          }

          &:last-of-type {
            margin-bottom: 0;
          }
        }

        .loading-more,
        .no-more {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
          padding: 24px;
          color: #909399;
          font-size: 14px;
        }

        .loading-more {
          color: #6c5ce7;

          .el-icon {
            color: #6c5ce7;
            font-size: 18px;
          }
        }

        .no-more {
          padding: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #f9f8ff 0%, #fff 100%);
          color: #909399;
          font-style: italic;

          .el-icon {
            color: #67c23a;
            font-size: 18px;
          }
        }
      }
    }

    .script-footer {
      padding: 18px 32px;
      border-top: 2px solid #f0f2f5;
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);

      .tips {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        background: white;
        color: #909399;
        font-size: 13px;

        .el-icon {
          color: #6c5ce7;
          font-size: 16px;
        }

        span {
          font-weight: 500;
        }
      }
    }
  }

  // 右侧面板
  .right-panel {
    display: flex;
    flex-direction: column;
    flex-shrink: 0; // 防止压缩
    gap: 20px;
    width: 24%;
    min-width: 300px;
    padding-left: 12px;
    overflow-y: auto;

    // 隐藏滚动条但保留滚动功能
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE 10+

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari, Edge
    }

    // 团队成员面板最小高度256px
    :deep(.team-member-panel) {
      min-height: 256px;
      flex-shrink: 0;
    }

    // 成员生产数据面板 - 在大屏幕自适应拉高
    :deep(.production-stats-panel) {
      min-height: 256px;
      flex: 1; // 自动填充剩余空间
    }

    // 项目进度面板最小高度194px
    :deep(.progress-panel) {
      min-height: 194px;
      flex-shrink: 0;
    }

    .panel-card {
      overflow: hidden;
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 12px rgb(0 0 0 / 8%), 0 1px 3px rgb(0 0 0 / 6%);
      transition: all 0.3s;

      &:hover {
        border-color: #e8e6ff;
        box-shadow: 0 4px 20px rgb(0 0 0 / 12%), 0 2px 6px rgb(0 0 0 / 8%);
      }
    }

    .panel-header {
      padding: 18px 20px;
      border-bottom: 2px solid #f5f7fa;
      background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .el-icon {
          color: #6c5ce7;
          font-size: 20px;
        }

        .title {
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
      }
    }

    .panel-content {
      padding: 20px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 0;
        color: #606266;
        font-size: 14px;
        transition: all 0.3s;

        &:hover {
          padding-left: 8px;
        }

        .el-icon {
          flex-shrink: 0;
          font-size: 16px;
        }

        span {
          flex: 1;
          font-weight: 500;
        }

        .stat-value {
          flex: none;
          margin-left: auto;
          color: #6c5ce7;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }

    .resource-panel {
      .stat-item {
        margin: 0 -8px;
        padding: 12px 0;
        padding-right: 8px;
        padding-left: 8px;
        border-radius: 6px;

        &:not(:last-child) {
          border-bottom: 1px solid #f5f7fa;
        }

        &:hover {
          background: #f9f8ff;
        }
      }
    }
  }
</style>
