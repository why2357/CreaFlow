<template>
  <div class="property-admin-container">
    <!-- 顶部项目列表 -->
    <div class="header-section">
      <div class="project-list">
        <div
          v-for="project in projectList"
          :key="project.projectId"
          class="project-item"
          :class="{ active: selectedProjectId === Number(project.projectId) }"
          @click="handleProjectSelect(Number(project.projectId))"
        >
          {{ project.projectName }}
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-section">
      <!-- 图片和视频切换 -->
      <div class="tabs-header">
        <div class="tabs-nav">
          <div class="tab-item" :class="{ active: activeTab === 'image' }" @click="handleTabChange('image')">图片</div>
          <div class="tab-item" :class="{ active: activeTab === 'video' }" @click="handleTabChange('video')">视频</div>
        </div>
      </div>

      <!-- 剧集筛选标签 -->
      <div class="episode-filter">
        <div
          v-for="episode in episodeList"
          :key="episode.id"
          class="episode-tag"
          :class="{ active: selectedEpisodeId === episode.id }"
          @click="handleEpisodeSelect(episode.id ?? null)"
        >
          {{ episode.episodeName }}
        </div>
      </div>

      <!-- 资产网格 -->
      <div class="asset-grid">
        <div
          v-for="(item, index) in activeTab === 'image' ? imageList : videoList"
          :key="`${item.id}-${index}`"
          class="asset-card"
        >
          <div class="asset-thumbnail">
            <el-image
              v-if="activeTab === 'image'"
              :src="item.previewOssUrl || item.originOssUrl"
              fit="cover"
              class="thumbnail-image"
              :preview-src-list="[item.originOssUrl || item.previewOssUrl]"
              :initial-index="0"
              preview-teleported
            >
              <template #error>
                <div class="image-error">
                  <el-icon><icon-picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="video-wrapper" @click="handleVideoPreview(item)">
              <img v-if="item.previewOssUrl" :src="item.previewOssUrl" class="thumbnail-image" alt="视频封面" />
              <video v-else :src="item.originOssUrl" class="thumbnail-video" />
              <div class="video-overlay">
                <el-icon class="play-icon"><video-play /></el-icon>
              </div>
            </div>
            <div class="download-icon" @click.stop="handleDownload(item)">
              <svg-icon icon-class="fy-download" />
            </div>
          </div>
        </div>

        <!-- 加载更多提示 -->
        <div
          v-if="activeTab === 'image' ? imageLoading && imageList.length > 0 : videoLoading && videoList.length > 0"
          class="loading-more"
        >
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 没有更多数据提示 -->
        <div
          v-if="
            activeTab === 'image'
              ? !imageLoading && !imageHasMore && imageList.length > 0
              : !videoLoading && !videoHasMore && videoList.length > 0
          "
          class="no-more"
        >
          已加载全部数据
        </div>

        <!-- 空状态 -->
        <div
          v-if="
            activeTab === 'image' ? !imageLoading && imageList.length === 0 : !videoLoading && videoList.length === 0
          "
          class="empty-state"
        >
          <el-empty :description="`暂无${activeTab === 'image' ? '图片' : '视频'}资源`" />
        </div>
      </div>
    </div>

    <!-- 视频预览对话框 -->
    <VideoPreviewDialog v-model="videoPreviewVisible" :video-url="currentVideoUrl" />
  </div>
</template>

<script setup lang="ts" name="PropertyAdmin">
  import { listEpisodes } from '@/api/workbench/episode';
  import type { HivisionProjectEpisodeVo } from '@/api/workbench/episode/types';
  import { getAssetList } from '@/api/workbench/history';
  import type { ProjectHistoryDetailVo } from '@/api/workbench/history/types';
  import { listProject } from '@/api/workbench/project';
  import type { ProjectPageInfoResponseDto } from '@/api/workbench/project/types';
  import VideoPreviewDialog from '@/views/workbench/project-creation/steps/StepVideo/components/VideoPreviewDialog.vue';
  import { Picture as IconPicture, Loading, VideoPlay } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { onMounted, onUnmounted, ref } from 'vue';

  // 项目列表
  const projectList = ref<ProjectPageInfoResponseDto[]>([]);
  const selectedProjectId = ref<number | null>(null);
  const currentProjectName = ref<string>('');

  // 剧集列表
  const episodeList = ref<HivisionProjectEpisodeVo[]>([]);
  const selectedEpisodeId = ref<number | null>(null);

  // 当前激活的tab
  const activeTab = ref<'image' | 'video'>('image');

  // 图片列表
  const imageList = ref<ProjectHistoryDetailVo[]>([]);
  const imageLoading = ref(false);
  const imagePageNum = ref(1);
  const imagePageSize = ref(40);
  const imageTotal = ref(0);
  const imageHasMore = ref(true);

  // 视频列表
  const videoList = ref<ProjectHistoryDetailVo[]>([]);
  const videoLoading = ref(false);
  const videoPageNum = ref(1);
  const videoPageSize = ref(40);
  const videoTotal = ref(0);
  const videoHasMore = ref(true);

  // 视频预览
  const videoPreviewVisible = ref(false);
  const currentVideoUrl = ref('');

  // 获取项目列表
  const getProjectList = async () => {
    try {
      const res = await listProject({
        pageNum: 1,
        pageSize: 100
      });
      if (res.rows && Array.isArray(res.rows)) {
        projectList.value = res.rows;
        console.log('projectList.value', projectList.value);

        // 默认选择第一个项目
        if (projectList.value.length > 0 && projectList.value[0].projectId) {
          const firstProject = projectList.value[0];
          selectedProjectId.value = Number(firstProject.projectId);
          currentProjectName.value = firstProject.projectName || '';

          // 获取项目的剧集信息
          await getProjectEpisodes(selectedProjectId.value);
        }
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      ElMessage.error('获取项目列表失败');
    }
  };

  // 获取项目的剧集列表
  const getProjectEpisodes = async (projectId: number) => {
    try {
      const res = await listEpisodes(projectId);
      if (res.data && Array.isArray(res.data)) {
        episodeList.value = res.data;
        console.log('episodeList.value', episodeList.value);

        // 只有当剧集列表不为空时才加载资产
        if (episodeList.value.length > 0) {
          selectedEpisodeId.value = episodeList.value[0].id || null;
          await loadAssets();
        } else {
          // 没有剧集时，清空资产列表
          imageList.value = [];
          videoList.value = [];
          selectedEpisodeId.value = null;
        }
      }
    } catch (error) {
      console.error('获取剧集列表失败:', error);
      episodeList.value = [];
      imageList.value = [];
      videoList.value = [];
      selectedEpisodeId.value = null;
    }
  };

  // 处理项目选择
  const handleProjectSelect = async (projectId: number) => {
    selectedProjectId.value = projectId;
    selectedEpisodeId.value = null;
    const project = projectList.value.find((proj) => Number(proj.projectId) === projectId);
    if (project) {
      currentProjectName.value = project.projectName || '';
      await getProjectEpisodes(projectId);
    }
  };

  // 处理剧集选择
  const handleEpisodeSelect = async (episodeId: number | null) => {
    selectedEpisodeId.value = episodeId;
    await resetAndLoadAssets();
  };

  // 处理tab切换
  const handleTabChange = async (tabName: string | number) => {
    activeTab.value = tabName as 'image' | 'video';
    // Tab切换时重置并加载对应类型的资产数据
    await resetAndLoadAssets();
  };

  // 重置并加载资源
  const resetAndLoadAssets = async () => {
    imageList.value = [];
    videoList.value = [];
    imagePageNum.value = 1;
    videoPageNum.value = 1;
    imageTotal.value = 0;
    videoTotal.value = 0;
    imageHasMore.value = true;
    videoHasMore.value = true;

    // 只有当有剧集信息时才加载资源
    if (episodeList.value.length > 0) {
      await loadAssets();
    }
  };

  // 加载资源列表
  const loadAssets = async (isLoadMore = false) => {
    // 如果没有选中项目或没有选中剧集，直接返回
    if (!selectedProjectId.value || !selectedEpisodeId.value) {
      return;
    }

    const isImage = activeTab.value === 'image';
    const hasMore = isImage ? imageHasMore.value : videoHasMore.value;

    // 如果是加载更多且已经没有更多数据，直接返回
    if (isLoadMore && !hasMore) {
      return;
    }

    // 如果正在加载中，避免重复请求
    if (isImage ? imageLoading.value : videoLoading.value) {
      return;
    }

    try {
      if (isImage) {
        imageLoading.value = true;
      } else {
        videoLoading.value = true;
      }

      const currentPageNum = isImage ? imagePageNum.value : videoPageNum.value;
      const currentPageSize = isImage ? imagePageSize.value : videoPageSize.value;

      // 使用新的资产列表接口
      const requestData = {
        projectId: selectedProjectId.value,
        episodeId: selectedEpisodeId.value, // episodeId 必填
        sceneType: isImage ? 1 : 2, // 1-图片 2-视频
        pageNum: currentPageNum,
        pageSize: currentPageSize
      };

      const res = await getAssetList(requestData);
      console.log('res', res);

      // 处理返回数据，rows 可能为 null、undefined 或空数组
      const rows = res.rows || [];
      const total = res.total || 0;

      if (isImage) {
        if (isLoadMore) {
          // 加载更多：追加数据
          imageList.value = [...imageList.value, ...rows];
        } else {
          // 首次加载：替换数据（即使是空数组也要更新）
          imageList.value = rows;
        }
        imageTotal.value = total;
        // 判断是否还有更多数据
        imageHasMore.value = imageList.value.length < total;
      } else {
        if (isLoadMore) {
          videoList.value = [...videoList.value, ...rows];
        } else {
          // 首次加载：替换数据（即使是空数组也要更新）
          videoList.value = rows;
        }
        videoTotal.value = total;
        videoHasMore.value = videoList.value.length < total;
      }
    } catch (error) {
      console.error('加载资源失败:', error);
      ElMessage.error('加载资源失败');
    } finally {
      imageLoading.value = false;
      videoLoading.value = false;
    }
  };

  // 加载更多
  const loadMore = async () => {
    const isImage = activeTab.value === 'image';
    if (isImage) {
      imagePageNum.value++;
    } else {
      videoPageNum.value++;
    }
    await loadAssets(true);
  };

  // 预览视频
  const handleVideoPreview = (item: ProjectHistoryDetailVo) => {
    currentVideoUrl.value = item.originOssUrl || '';
    if (!currentVideoUrl.value) {
      ElMessage.warning('视频地址无效');
      return;
    }
    videoPreviewVisible.value = true;
  };

  // 下载资源
  const handleDownload = async (item: ProjectHistoryDetailVo) => {
    const url = item.originOssUrl || item.previewOssUrl;
    if (!url) {
      ElMessage.warning('暂无资源可下载');
      return;
    }

    try {
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a');
      link.style.display = 'none';

      // 使用 fetch 获取图片数据
      const response = await fetch(url, {
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 从 URL 中提取文件名，或使用默认名称
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1] || `asset-${item.id}${getFileExtension(url)}`;

      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      ElMessage.success('下载成功');
    } catch (error) {
      console.error('下载资源失败:', error);
      // 如果 fetch 失败（可能是跨域问题），尝试直接打开链接
      try {
        window.open(url, '_blank');
        ElMessage.info('已在新标签页打开资源，请手动保存');
      } catch {
        ElMessage.error('下载失败，请稍后重试');
      }
    }
  };

  // 获取文件扩展名
  const getFileExtension = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDotIndex = pathname.lastIndexOf('.');
      if (lastDotIndex === -1) return '';
      return pathname.substring(lastDotIndex);
    } catch {
      return '';
    }
  };

  // 滚动容器引用
  const assetGridRef = ref<HTMLElement | null>(null);

  // 处理滚动事件
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    // 当滚动到距离底部 100px 时触发加载
    const threshold = 100;

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      const isImage = activeTab.value === 'image';
      const hasMore = isImage ? imageHasMore.value : videoHasMore.value;
      const loading = isImage ? imageLoading.value : videoLoading.value;

      // 如果还有更多数据且当前没有在加载中，则加载更多
      if (hasMore && !loading) {
        loadMore();
      }
    }
  };

  onMounted(() => {
    getProjectList();

    // 获取滚动容器并添加滚动监听
    const assetGrid = document.querySelector('.asset-grid');
    if (assetGrid) {
      assetGridRef.value = assetGrid as HTMLElement;
      assetGrid.addEventListener('scroll', handleScroll);
    }
  });

  onUnmounted(() => {
    // 移除滚动监听
    if (assetGridRef.value) {
      assetGridRef.value.removeEventListener('scroll', handleScroll);
    }
  });
</script>

<style scoped lang="scss">
  .property-admin-container {
    display: flex;
    flex-direction: column;
    padding: 0;
    background: #f3f5fb;
    height: calc(100vh - 60px); // 减去顶部导航栏高度
    overflow: hidden;
  }

  .header-section {
    flex-shrink: 0; // 防止头部被压缩
    padding: 20px 24px;
    background: #fff;
    border-bottom: 0.5px solid #e8eaed;

    .project-list {
      display: flex;
      gap: 16px;
      overflow-x: auto;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 2px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 2px;
      }

      .project-item {
        flex-shrink: 0;
        padding: 8px 20px;
        background: #fff;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #4e5969;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid #e8eaed;
        white-space: nowrap;

        &:hover {
          background: #f7f8fa;
          border-color: #c9cdd4;
        }

        &.active {
          background: #5252ff;
          color: #fff;
          border-color: #5252ff;
          box-shadow: 0 2px 8px 0 rgba(82, 82, 255, 0.2);
        }
      }
    }
  }

  .content-section {
    display: flex;
    flex-direction: column;
    flex: 1; // 占据剩余空间
    padding: 0;
    background: transparent;
    overflow: hidden; // 防止整体滚动

    .tabs-header {
      flex-shrink: 0; // 防止标签页被压缩
      background: #fff;
      padding: 0 24px;
      border-bottom: 0.5px solid #e8eaed;

      .tabs-nav {
        display: flex;
        gap: 40px;

        .tab-item {
          padding: 14px 0;
          font-size: 15px;
          color: #86909c;
          cursor: pointer;
          position: relative;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 400;

          &:hover {
            color: #4e5969;
          }

          &.active {
            color: #1d2129;
            font-weight: 600;

            &::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: #5252ff;
              border-radius: 1px;
            }
          }
        }
      }
    }

    .episode-filter {
      flex-shrink: 0; // 防止剧集筛选器被压缩
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      background: #fff;
      overflow-x: auto;
      border-bottom: 0.5px solid #e8eaed;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 2px;
      }

      .episode-tag {
        flex-shrink: 0;
        padding: 5px 14px;
        background: #f7f8fa;
        border-radius: 6px;
        font-size: 13px;
        color: #4e5969;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid transparent;
        font-weight: 500;

        &:hover {
          background: #e5e6eb;
          color: #1d2129;
        }

        &.active {
          background: #5252ff;
          color: #fff;
          border-color: #5252ff;
          box-shadow: 0 2px 6px 0 rgba(82, 82, 255, 0.15);
        }
      }
    }

    .asset-grid {
      flex: 1; // 占据剩余空间
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      padding: 24px;
      align-content: start;
      overflow-y: auto; // 只在这里滚动
      overflow-x: hidden;

      // 自定义滚动条样式
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: rgba(144, 147, 153, 0.3);
        transition: background-color 0.3s;

        &:hover {
          background-color: rgba(144, 147, 153, 0.5);
        }
      }

      .asset-card {
        display: flex;
        flex-direction: column;
        min-height: 226px;
        cursor: pointer;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0px 4px 6px 0px rgba(224, 231, 255, 0.25), 0px 10px 15px 0px rgba(224, 231, 255, 0.5);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0px 6px 10px 0px rgba(224, 231, 255, 0.35), 0px 12px 20px 0px rgba(224, 231, 255, 0.6);
        }

        .asset-thumbnail {
          position: relative;
          width: 100%;
          height: 226px;
          flex-shrink: 0;
          overflow: hidden;
          background: #f3f5fb;

          &:hover {
            .download-icon {
              opacity: 1;
            }
          }

          .thumbnail-image,
          .video-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .thumbnail-image {
            :deep(.el-image__inner) {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .video-wrapper {
            background: #000;
            cursor: pointer;

            .thumbnail-image,
            .thumbnail-video {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .video-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: rgba(0, 0, 0, 0.3);
              transition: all 0.3s;

              .play-icon {
                font-size: 48px;
                color: #fff;
              }
            }

            &:hover .video-overlay {
              background: rgba(0, 0, 0, 0.5);
            }
          }

          .image-error {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f5f7fa;
            color: #909399;
            font-size: 32px;
          }

          .download-icon {
            position: absolute;
            bottom: 12px;
            right: 12px;
            width: 24px;
            height: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(5.3px);
            -webkit-backdrop-filter: blur(5.3px);
            border-radius: 6px;
            opacity: 0;
            transition: all 0.3s ease;
            cursor: pointer;
            z-index: 2;

            &:hover {
              background: rgba(255, 255, 255, 0.95);
              transform: scale(1.1);
            }

            :deep(.svg-icon) {
              width: 12px;
              height: 12px;
              color: #333;
            }
          }
        }
      }

      .loading-more,
      .no-more {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 0;
        color: #86909c;
        font-size: 14px;
        gap: 8px;
      }

      .loading-more {
        .el-icon {
          font-size: 16px;
        }
      }

      .no-more {
        color: #c9cdd4;
        font-size: 13px;
      }

      .empty-state {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
      }
    }
  }

  .preview-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
</style>
