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
      <div
        v-infinite-scroll="activeTab === 'image' ? loadMoreImages : loadMoreVideos"
        :infinite-scroll-disabled="activeTab === 'image' ? imageScrollDisabled : videoScrollDisabled"
        :infinite-scroll-distance="200"
        class="asset-grid"
        v-loading="activeTab === 'image' ? imageLoading : videoLoading"
      >
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
            <div v-else class="video-wrapper">
              <video :src="item.previewOssUrl || item.originOssUrl" class="thumbnail-video" />
              <div class="video-overlay">
                <el-icon class="play-icon"><video-play /></el-icon>
              </div>
            </div>
            <div class="download-icon" @click.stop="handleDownload(item)">
              <svg-icon icon-class="fy-download" />
            </div>
          </div>
        </div>

        <div
          v-if="
            activeTab === 'image' ? !imageLoading && imageList.length === 0 : !videoLoading && videoList.length === 0
          "
          class="empty-state"
        >
          <el-empty :description="`暂无${activeTab === 'image' ? '图片' : '视频'}资源`" />
        </div>
      </div>

      <div
        v-if="activeTab === 'image' ? imageHasMore && !imageLoading : videoHasMore && !videoLoading"
        class="load-more-tip"
      >
        加载中...
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" :title="previewTitle" width="80%" center>
      <div class="preview-content">
        <el-image
          v-if="previewType === 'image'"
          :src="previewUrl"
          fit="contain"
          style="width: 100%; max-height: 70vh"
        />
        <video v-else-if="previewType === 'video'" :src="previewUrl" controls style="width: 100%; max-height: 70vh" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PropertyAdmin">
  import { listEpisodes } from '@/api/workbench/episode';
  import type { HivisionProjectEpisodeVo } from '@/api/workbench/episode/types';
  import { getAssetList } from '@/api/workbench/history';
  import type { ProjectHistoryDetailVo } from '@/api/workbench/history/types';
  import { listProject } from '@/api/workbench/project';
  import type { ProjectPageInfoResponseDto } from '@/api/workbench/project/types';
  import { Picture as IconPicture, VideoPlay } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, onMounted, ref } from 'vue';

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
  const imageTotal = ref(0);
  const imageHasMore = computed(() => imageList.value.length < imageTotal.value);
  const imageScrollDisabled = computed(() => imageLoading.value || !imageHasMore.value);

  // 视频列表
  const videoList = ref<ProjectHistoryDetailVo[]>([]);
  const videoLoading = ref(false);
  const videoPageNum = ref(1);
  const videoTotal = ref(0);
  const videoHasMore = computed(() => videoList.value.length < videoTotal.value);
  const videoScrollDisabled = computed(() => videoLoading.value || !videoHasMore.value);

  // 预览
  const previewVisible = ref(false);
  const previewUrl = ref('');
  const previewTitle = ref('');
  const previewType = ref<'image' | 'video'>('image');

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

    // 只有当有剧集信息时才加载资源
    if (episodeList.value.length > 0) {
      await loadAssets();
    }
  };

  // 加载资源列表
  const loadAssets = async () => {
    // 如果没有选中项目或没有剧集信息，直接返回
    if (!selectedProjectId.value || episodeList.value.length === 0) {
      return;
    }

    try {
      if (activeTab.value === 'image') {
        imageLoading.value = true;
      } else {
        videoLoading.value = true;
      }

      // 使用新的资产列表接口
      const requestData = {
        projectId: selectedProjectId.value,
        episodeId: selectedEpisodeId.value ?? undefined,
        sceneType: activeTab.value === 'image' ? 1 : 2 // 1-图片 2-视频
      };

      const res = await getAssetList(requestData);

      if (res.data && Array.isArray(res.data)) {
        if (activeTab.value === 'image') {
          imageList.value = res.data;
          imageTotal.value = res.data.length;
        } else {
          videoList.value = res.data;
          videoTotal.value = res.data.length;
        }
      }
    } catch (error) {
      console.error('加载资源失败:', error);
      ElMessage.error('加载资源失败');
    } finally {
      imageLoading.value = false;
      videoLoading.value = false;
    }
  };

  // 加载更多图片
  const loadMoreImages = async () => {
    if (imageScrollDisabled.value) return;
    imagePageNum.value++;
    await loadAssets();
  };

  // 加载更多视频
  const loadMoreVideos = async () => {
    if (videoScrollDisabled.value) return;
    videoPageNum.value++;
    await loadAssets();
  };

  // 预览资源（预留功能，用于点击卡片查看详情）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePreview = (item: ProjectHistoryDetailVo, type: 'image' | 'video') => {
    previewUrl.value = item.originOssUrl || item.previewOssUrl || '';
    previewTitle.value = `资产 ID: ${item.id}`;
    previewType.value = type;
    previewVisible.value = true;
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

  onMounted(() => {
    getProjectList();
  });
</script>

<style scoped lang="scss">
  .property-admin-container {
    padding: 0;
    background: #f3f5fb;
    min-height: 100vh;
  }

  .header-section {
    padding: 16px 24px;
    background: #fff;
    border-bottom: 1px solid #e8eaed;

    .project-list {
      display: flex;
      gap: 12px;
      overflow-x: auto;

      &::-webkit-scrollbar {
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-track {
        background: #f5f7fa;
        border-radius: 3px;
      }

      .project-item {
        flex-shrink: 0;
        padding: 10px 24px;
        background: #f5f7fa;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid transparent;
        white-space: nowrap;

        &:hover {
          background: #e8eaed;
          color: #303133;
        }

        &.active {
          background: #f3f3ff;
          color: #5252ff;
          border-color: #5252ff;
          box-shadow: none;
        }
      }
    }
  }

  .content-section {
    padding: 0;
    background: transparent;

    .tabs-header {
      background: #fff;
      padding: 0 24px;
      border-bottom: 1px solid #e8eaed;

      .tabs-nav {
        display: flex;
        gap: 32px;

        .tab-item {
          padding: 16px 0;
          font-size: 16px;
          color: #606266;
          cursor: pointer;
          position: relative;
          transition: color 0.3s;

          &:hover {
            color: #409eff;
          }

          &.active {
            color: #333333;
            font-weight: 500;

            &::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 45%;
              height: 4px;
              background: #5252ff;
              border-radius: 19px;
            }
          }
        }
      }
    }

    .episode-filter {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      background: #fff;
      overflow-x: auto;
      border-bottom: 1px solid #e8eaed;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 2px;
      }

      .episode-tag {
        flex-shrink: 0;
        padding: 6px 16px;
        background: #f5f7fa;
        border-radius: 16px;
        font-size: 14px;
        color: #606266;
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid transparent;

        &:hover {
          background: #e8eaed;
        }

        &.active {
          background: #5252ff;
          color: #fff;
          border-color: #5252ff;
        }
      }
    }

    .asset-grid {
      display: grid;
      grid-template-columns: repeat(4, 240px);
      gap: 20px;
      padding: 24px;
      min-height: 400px;
      justify-content: start;

      @media (max-width: 1280px) {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }

      .asset-card {
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
          width: 240px;
          height: 226px;
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

      .empty-state {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
      }
    }

    .load-more-tip {
      text-align: center;
      padding: 16px;
      color: #909399;
      font-size: 14px;
      background: transparent;
    }
  }

  .preview-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
</style>
