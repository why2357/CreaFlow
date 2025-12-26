<template>
  <div class="video-list-cell" :data-aspect-ratio="aspectRatio">
    <!-- 暂无视频 -->
    <div v-if="videoList.length === 0" class="empty-state">
      <svg-icon icon-class="no-sence" style="width: 120px; height: 120px" />
    </div>

    <!-- 视频列表 -->
    <div v-else class="video-list-wrapper">
      <div class="video-list">
        <!-- 横向显示所有视频 -->
        <div
          v-for="(videoItem, index) in displayVideos"
          :key="videoItem.id || index"
          class="video-item"
          :style="videoItemStyle"
        >
          <!-- 生成中状态 taskStatus: 1 -->
          <div v-if="videoItem.status === 1" class="video-card generating">
            <div class="loading-animation-wrapper">
              <Vue3Lottie :animation-data="generatingAnimation" :height="80" :width="80" class="loading-icon" />
            </div>
            <div class="loading-text">生成中，请稍等...</div>
          </div>

          <!-- 排队中状态 taskStatus: 0 -->
          <div v-else-if="videoItem.status === 0" class="video-card queued">
            <div class="status-icon">
              <svg-icon icon-class="queued" class="icon-queued" />
            </div>
            <div class="status-text">排队中...</div>
          </div>

          <!-- 失败状态 taskStatus: 3 -->
          <div
            v-else-if="videoItem.status === 3"
            class="video-card failed"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
          >
            <div class="failure-container">
              <div class="failure-icon">
                <svg-icon class="error-icon" icon-class="fy-gen-failed" />
              </div>
              <p class="failure-text">生成失败</p>
            </div>

            <!-- Hover时显示的操作层 -->
            <div
              v-if="isHovered || isDropdownOpen"
              class="hover-actions"
              @mouseenter="handleActionsMouseEnter"
              @mouseleave="handleActionsMouseLeave"
            >
              <!-- 右下角更多按钮 -->
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 2] } }] }"
                @command="handleCommand($event, videoItem)"
                @visible-change="handleDropdownVisibleChange"
              >
                <el-button class="more-btn" text circle @click.stop>
                  <svg-icon icon-class="fy-more" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="delete" :disabled="isOperating" style="color: #f53f3f">
                      <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 8px" />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 完成状态 taskStatus: 2 -->
          <div
            v-else
            class="video-card completed"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
            @click="handlePlayVideo(videoItem)"
          >
            <!-- 封面图 -->
            <div class="video-preview">
              <img v-if="videoItem.imgUrl" :src="videoItem.imgUrl" class="video-cover" alt="视频封面" />

              <!-- 播放按钮覆盖层 -->
              <div class="play-overlay">
                <div class="play-button">
                  <svg-icon icon-class="fy-play" style="width: 18px; height: 18px; color: #1d2129" />
                </div>
              </div>
            </div>

            <!-- Hover时显示的操作层 -->
            <div
              v-if="isHovered || isDropdownOpen"
              class="hover-actions"
              @mouseenter="handleActionsMouseEnter"
              @mouseleave="handleActionsMouseLeave"
            >
              <!-- 右下角更多按钮 -->
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 2] } }] }"
                @command="handleCommand($event, videoItem)"
                @visible-change="handleDropdownVisibleChange"
              >
                <el-button class="more-btn" text circle @click.stop>
                  <svg-icon icon-class="fy-more" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="replace" :disabled="isOperating">
                      <el-icon><RefreshRight /></el-icon>
                      选中
                    </el-dropdown-item>
                    <el-dropdown-item command="download" :disabled="isOperating">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" :disabled="isOperating" style="color: #f53f3f">
                      <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 8px" />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧更多按钮（查看历史） - 移到列表外层，始终显示 -->
      <el-tooltip content="查看更多" placement="top">
        <div v-if="videoList.length > 1" class="history-btn" @click.stop="handleViewHistory">
          <svg-icon icon-class="fy-more" />
        </div>
      </el-tooltip>
    </div>

    <!-- 视频历史弹窗 -->
    <VideoHistoryDialog v-model="videoHistoryDialogVisible" :basic-id="video.basicId" @refresh="handleRefresh" />

    <!-- 视频预览弹窗 -->
    <VideoPreviewDialog v-model="videoPreviewVisible" :video-url="currentVideoUrl" :video-info="currentVideoInfo" />
  </div>
</template>

<script setup lang="ts">
  import { chooseHistoryDetail, deleteHistory } from '@/api/workbench/episode';
  import type { VideoSceneItemInfo } from '@/api/workbench/episode/types';
  import generatingAnimation from '@/assets/lottie/video-generating.json';
  import { Download, RefreshRight } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref } from 'vue';
  import { Vue3Lottie } from 'vue3-lottie';
  import VideoHistoryDialog from './VideoHistoryDialog.vue';
  import VideoPreviewDialog from './VideoPreviewDialog.vue';

  interface Props {
    video: VideoSceneItemInfo;
    aspectRatio?: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  }

  const props = withDefaults(defineProps<Props>(), {
    aspectRatio: '16:9'
  });

  const emit = defineEmits<{
    (e: 'refresh'): void;
  }>();

  // 视频历史弹窗
  const videoHistoryDialogVisible = ref(false);

  // 视频预览弹窗
  const videoPreviewVisible = ref(false);
  const currentVideoUrl = ref('');
  const currentVideoInfo = ref<any>(null);

  // hover 状态
  const isHovered = ref(false);

  // 下拉菜单打开状态
  const isDropdownOpen = ref(false);

  // hover 延迟定时器
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  // 操作中状态（防止重复点击）
  const isOperating = ref(false);

  // 视频列表（从historyVos转换而来）
  const videoList = computed(() => {
    const videos: any[] = [];

    // 从historyVos获取视频列表
    if (props.video.historyVos && props.video.historyVos.length > 0) {
      props.video.historyVos.forEach((history) => {
        // taskStatus: 0-待处理, 1-处理中, 2-成功, 3-失败
        videos.push({
          id: history.id,
          url: history.videoUrl || '',
          imgUrl: history.imgUrl || '', // 封面图
          status: history.taskStatus,
          // 使用接口返回的 historyDetailId 字段，如果不存在则使用 id
          historyDetailId: history.historyDetailId,
          materialId: history.materialId,
          taskStatus: history.taskStatus
        });
      });
    }

    return videos;
  });

  // 显示的视频（显示所有视频）
  const displayVideos = computed(() => {
    return videoList.value;
  });

  // 计算每个视频项的宽度 - 根据宽高比动态计算
  const getVideoItemWidth = () => {
    // 竖版比例固定宽度为 260px
    const verticalWidth = 260;
    // 横版比例固定高度为 190px (表格行高)
    const videoHeight = 190;

    // 根据宽高比计算宽度
    const ratioMap: Record<string, { ratio: number; fixedWidth?: number }> = {
      '1:1': { ratio: 1 },
      '16:9': { ratio: 16 / 9 },
      '9:16': { ratio: 9 / 16, fixedWidth: verticalWidth }, // 竖版，固定宽度
      '4:3': { ratio: 4 / 3 },
      '3:4': { ratio: 3 / 4, fixedWidth: verticalWidth } // 竖版，固定宽度
    };

    const config = ratioMap[props.aspectRatio] || { ratio: 16 / 9 };

    // 如果是竖版比例，使用固定宽度
    if (config.fixedWidth) {
      return config.fixedWidth;
    }

    // 横版比例根据高度计算宽度
    const videoWidth = videoHeight * config.ratio;
    return Math.ceil(videoWidth);
  };

  // 视频项的样式
  const videoItemStyle = computed(() => ({
    minWidth: `${getVideoItemWidth()}px`,
    width: `${getVideoItemWidth()}px`
  }));

  // 鼠标进入视频卡片
  const handleMouseEnter = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    isHovered.value = true;
  };

  // 鼠标离开视频卡片
  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    // 延迟隐藏，给用户时间移动到按钮上
    hoverTimer = setTimeout(() => {
      if (!isDropdownOpen.value) {
        isHovered.value = false;
      }
    }, 100);
  };

  // 鼠标进入操作按钮区域
  const handleActionsMouseEnter = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    isHovered.value = true;
  };

  // 鼠标离开操作按钮区域
  const handleActionsMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    hoverTimer = setTimeout(() => {
      if (!isDropdownOpen.value) {
        isHovered.value = false;
      }
    }, 100);
  };

  // 下拉菜单显示状态变化
  const handleDropdownVisibleChange = (visible: boolean) => {
    isDropdownOpen.value = visible;
    if (visible) {
      // 菜单打开时，清除定时器，保持按钮显示
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      isHovered.value = true;
    } else {
      // 菜单关闭时，延迟隐藏按钮
      hoverTimer = setTimeout(() => {
        isHovered.value = false;
      }, 100);
    }
  };

  // 播放视频
  const handlePlayVideo = (videoItem: any) => {
    if (!videoItem.url) {
      ElMessage.warning('视频地址不存在');
      return;
    }

    // 从 historyVos 中查找完整的视频信息
    const historyItem = props.video.historyVos?.find((h: any) => h.id === videoItem.id);

    // 打开视频预览弹窗
    currentVideoUrl.value = videoItem.url;
    currentVideoInfo.value = historyItem
      ? {
          modelName: historyItem.modelName,
          ratio: historyItem.ratio,
          duration: historyItem.duration,
          createTime: historyItem.createTime
        }
      : null;
    videoPreviewVisible.value = true;
  };

  // 命令处理
  const handleCommand = async (command: string, videoItem: any) => {
    // 防止操作进行中时重复点击
    if (isOperating.value) {
      ElMessage.warning('操作进行中，请稍候');
      return;
    }

    switch (command) {
      case 'history':
        handleViewHistory();
        break;
      case 'replace':
        await handleReplace(videoItem);
        break;
      case 'download':
        await handleDownload(videoItem);
        break;
      case 'delete':
        await handleDelete(videoItem);
        break;
    }
  };

  // 查看历史
  const handleViewHistory = () => {
    videoHistoryDialogVisible.value = true;
  };

  // 替换视频
  const handleReplace = async (videoItem: any) => {
    if (!videoItem.historyDetailId) {
      ElMessage.warning('缺少历史记录ID');
      return;
    }

    // 设置操作中状态
    isOperating.value = true;

    try {
      // 调用选择历史明细接口
      await chooseHistoryDetail({
        historyDetailId: videoItem.historyDetailId
      });

      ElMessage.success('替换成功');
      emit('refresh');
    } catch (error: any) {
      console.error('替换视频失败:', error);
      ElMessage.error(error.message || '替换失败，请重试');
    } finally {
      isOperating.value = false;
    }
  };

  // 下载视频
  const handleDownload = async (videoItem: any) => {
    if (!videoItem.url) {
      ElMessage.warning('视频地址不存在');
      return;
    }

    // 设置操作中状态
    isOperating.value = true;

    try {
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = videoItem.url;
      // 生成更友好的文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
      link.download = `video_${videoItem.id}_${timestamp}.mp4`;

      // 尝试使用 fetch 来检测文件是否可访问
      const response = await fetch(videoItem.url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('视频文件不可访问');
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('下载视频失败:', error);
    } finally {
      isOperating.value = false;
    }
  };

  // 删除视频
  const handleDelete = async (videoItem: any) => {
    if (!videoItem.id) {
      ElMessage.warning('缺少历史记录ID');
      return;
    }

    // 设置操作中状态
    isOperating.value = true;

    try {
      // 直接调用删除历史主数据接口，不需要弹窗确认
      await deleteHistory([videoItem.id]);

      ElMessage.success('删除成功');
      emit('refresh');
    } catch (error: any) {
      console.error('删除视频失败:', error);
      ElMessage.error(error.message || '删除失败，请重试');
    } finally {
      isOperating.value = false;
    }
  };

  // 刷新
  const handleRefresh = () => {
    emit('refresh');
  };
</script>

<style scoped lang="scss">
  .video-list-cell {
    position: relative;
    width: 100%;
    height: 100%; // 填满父容器
    padding: 0; // 不留白

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      .empty-text {
        color: #86909c;
        font-size: 12px;
        font-style: italic;
      }
    }

    .video-list-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .video-list {
      display: flex;
      flex-wrap: nowrap; // 不换行，横向排列
      gap: 0; // 不留白
      flex: 1;
      height: 100%;
      overflow-x: auto; // 横向滚动
      overflow-y: hidden; // 隐藏纵向滚动

      // 美化滚动条
      &::-webkit-scrollbar {
        height: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #f0f0f0;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c0c0c0;
        border-radius: 3px;

        &:hover {
          background: #a0a0a0;
        }
      }

      .video-item {
        flex-shrink: 0; // 不压缩
        height: 100%;
        margin-right: 12px;

        // 根据宽高比设置每个视频项的最小宽度
        // 竖版比例固定宽度为260px，高度自适应
        .video-list-cell[data-aspect-ratio='16:9'] & {
          min-width: 338px; // 190 * (16/9) ≈ 338
          width: 338px;
        }
        .video-list-cell[data-aspect-ratio='9:16'] & {
          min-width: 260px; // 竖版固定宽度
          width: 260px;
          min-height: 462px; // 260 * (16/9) ≈ 462px，保持最小高度
        }
        .video-list-cell[data-aspect-ratio='1:1'] & {
          min-width: 190px; // 190 * 1 = 190
          width: 190px;
        }
        .video-list-cell[data-aspect-ratio='4:3'] & {
          min-width: 253px; // 190 * (4/3) ≈ 253
          width: 253px;
        }
        .video-list-cell[data-aspect-ratio='3:4'] & {
          min-width: 260px; // 竖版固定宽度
          width: 260px;
          min-height: 347px; // 260 * (4/3) ≈ 347px，保持最小高度
        }

        .video-card {
          position: relative;
          width: 100%; // 填满容器
          height: 100%; // 填满父容器
          border-radius: 0; // 不需要圆角
          overflow: hidden;
          // background: #f7f8fa;
          border: none; // 不需要边框
          transition: all 0.3s ease-in-out;

          .loading-animation-wrapper {
            animation: fadeInScale 0.4s ease-out;
          }

          .loading-icon {
            width: 80px;
            height: 80px;
          }

          .loading-text {
            margin-top: 12px;
            color: #4e5969;
            font-size: 13px;
            font-weight: 400;
            animation: fadeIn 0.5s ease-out 0.2s both;
          }

          // 生成中状态
          &.generating {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            animation: fadeIn 0.3s ease-out;

            .status-icon {
              .icon-generating {
                width: 40px;
                height: 40px;
                animation: spin 1.5s linear infinite;
              }
            }

            .status-text {
              font-size: 13px;
              color: #5252ff;
              font-weight: 500;
            }
          }

          // 排队中状态
          &.queued {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: #fff7e6;
            animation: fadeIn 0.3s ease-out;

            .status-icon {
              animation: fadeInScale 0.4s ease-out;
              .icon-queued {
                width: 40px;
                height: 40px;
              }
            }

            .status-text {
              font-size: 13px;
              color: #ff8800;
              font-weight: 500;
              animation: fadeIn 0.5s ease-out 0.2s both;
            }
          }

          // 失败状态
          &.failed {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fff;
            animation: fadeIn 0.3s ease-out;

            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%);
              opacity: 0;
              transition: opacity 0.3s ease;
              pointer-events: none;
            }

            &:hover::before {
              opacity: 1;
            }

            .failure-container {
              position: relative;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 12px;

              .failure-icon {
                animation: fadeInScale 0.4s ease-out;
                .error-icon {
                  width: 40px;
                  height: 40px;
                  color: #f53f3f;
                }
              }

              .failure-text {
                font-size: 13px;
                color: #f53f3f;
                font-weight: 500;
                margin: 0;
                animation: fadeIn 0.5s ease-out 0.2s both;
              }
            }

            // Hover时显示的操作层
            .hover-actions {
              position: absolute;
              bottom: 8px;
              right: 8px;
              z-index: 10;

              .more-btn {
                width: 24px;
                height: 24px;
                background: #fff;
                border-radius: 5px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                  background: #fff;
                }

                :deep(.svg-icon) {
                  width: 16px;
                  height: 16px;
                  color: #4e5969;
                }
              }
            }
          }

          // 完成状态
          &.completed {
            animation: fadeIn 0.3s ease-out;
            cursor: pointer;
            position: relative;

            .video-preview {
              width: 100%;
              height: 100%;
              position: relative;
              background: #000;

              .video-cover {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
              }

              .video-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #1a1a1a;

                .el-icon {
                  font-size: 32px;
                  color: #fff;
                  opacity: 0.5;
                }
              }

              // 播放按钮覆盖层
              .play-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.3);
                opacity: 1;
                transition: opacity 0.3s;

                .play-button {
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  background: rgba(255, 255, 255, 0.9);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.3s;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

                  &:hover {
                    transform: scale(1.1);
                    background: #fff;
                  }
                }
              }
            }

            // Hover时显示的操作层
            .hover-actions {
              position: absolute;
              bottom: 8px;
              right: 8px;
              z-index: 10;

              .more-btn {
                width: 24px;
                height: 24px;
                background: #fff;
                border-radius: 5px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                  background: #fff;
                }

                :deep(.svg-icon) {
                  width: 16px;
                  height: 16px;
                  color: #4e5969;
                }
              }
            }
          }
        }
      }
    }

    // 右侧更多按钮（查看历史） - 移到 video-list-wrapper 层级
    .history-btn {
      position: absolute;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border-radius: 5px;
      border: 0.857px solid #eee;
      background: #fff;

      /* 中层投影 */
      box-shadow: 0 4px 12px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 20;

      &:hover {
        background: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      :deep(.svg-icon) {
        width: 18px;
        height: 18px;
        color: #4e5969;
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>

<style lang="scss">
  // 全局样式：优化下拉菜单
  .el-dropdown-menu {
    padding: 4px 0 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;

    .el-dropdown-menu__item {
      padding: 8px 16px !important;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      line-height: 22px;
      transition: all 0.2s;

      .el-icon {
        font-size: 16px;
        color: #4e5969;
      }

      &:hover:not(.is-disabled) {
        background-color: #f3f3ff !important;

        .el-icon {
          color: #5252ff;
        }
      }

      &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
</style>
