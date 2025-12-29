<template>
  <el-dialog
    style="background-color: #f7f8fa"
    v-model="visible"
    title="视频历史"
    width="70%"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
    :z-index="3000"
    @close="handleClose"
  >
    <div class="history-dialog-container">
      <!-- 左侧：当前选中视频 -->
      <div class="left-section">
        <div class="current-video-title">当前选中视频</div>

        <!-- Loading 状态 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading" :size="40">
            <Loading />
          </el-icon>
          <p class="loading-text">加载中...</p>
        </div>

        <div v-else-if="!selectedVideoDetail" class="empty-state">
          <img
            src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/11fb7c9d514e42b0.png"
            alt="暂无视频"
            class="empty-image"
          />
          <p class="empty-text">点击右侧视频进行查看</p>
        </div>

        <div v-else class="current-video-container">
          <div class="current-video-wrapper">
            <video
              v-if="selectedVideoDetail.previewOssUrl || selectedVideoDetail.originOssUrl"
              :src="selectedVideoDetail.originOssUrl || selectedVideoDetail.previewOssUrl"
              controls
              preload="metadata"
              class="main-video"
            >
              您的浏览器不支持视频播放
            </video>
          </div>

          <div class="lb-box">
            <div class="current-video-info">
              <div class="memo-sty">视频提示词</div>
              <p class="info-item">
                <span class="label">·</span>
                <span class="value">{{ selectedVideoDetail.prompt || '-' }}</span>
              </p>
            </div>

            <div class="left-footer">
              <el-button type="primary" @click="handleConfirm">确认</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：历史记录列表 -->
      <div class="right-section">
        <div class="history-title">历史记录</div>

        <!-- Loading 状态 -->
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" :size="40">
            <Loading />
          </el-icon>
          <p class="loading-text">加载中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="historyList.length === 0" class="empty-history">
          <el-empty description="暂无历史记录" />
        </div>

        <!-- 历史记录列表 -->
        <div v-else class="history-list">
          <div v-for="history in historyList" :key="history.historyId" class="history-group">
            <!-- 历史组标题 -->
            <div class="history-group-header">
              <div class="header-content">
                <div class="prompt-section">
                  <div v-if="history.videoPrompt" class="prompt-line">
                    <span class="label">·</span>
                    <span class="text">{{ history.videoPrompt }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 视频网格 -->
            <div class="video-grid">
              <div
                v-for="detail in history.details"
                :key="detail.historyDetailId"
                class="video-item"
                :class="{ selected: selectedVideoDetail?.historyDetailId === detail.historyDetailId }"
                @click="handleSelectVideo(detail)"
              >
                <div class="video-wrapper" :style="{ width: videoCardWidth }">
                  <!-- 预览图 -->
                  <img v-if="detail.previewOssUrl" :src="detail.previewOssUrl" class="video-thumbnail" alt="视频预览" />
                  <div v-else class="video-placeholder">
                    <el-icon><VideoPlay /></el-icon>
                  </div>

                  <!-- 左下角：评论按钮 - 只在有留言时显示 -->
                  <div
                    v-if="detail.commentVoList && detail.commentVoList?.length > 0"
                    class="action-bottom-left has-comments"
                    @click.stop
                  >
                    <div
                      ref="commentTriggerRef"
                      class="action-icon comment-btn"
                      @mouseenter="handleShowComments(detail, $event)"
                    >
                      <svg-icon icon-class="fy-comment" class="comment-icon" />
                      <span class="count-text">{{ detail.commentVoList?.length || 0 }}</span>
                    </div>
                  </div>

                  <!-- 右下角：更多操作 -->
                  <div class="action-bottom-right" @click.stop>
                    <el-dropdown
                      trigger="click"
                      @command="(cmd: string) => handleCommand(cmd, detail)"
                      popper-class="video-history-dropdown"
                    >
                      <div class="more-btn">
                        <el-icon><MoreFilled /></el-icon>
                      </div>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="download">
                            <el-icon><Download /></el-icon>
                            下载
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" style="color: #f56c6c">
                            <el-icon><Delete /></el-icon>
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>

            <!-- 历史组底部信息 -->
            <div class="history-group-footer">
              <div class="footer-info">
                <span v-if="history.modelCode" class="info-text">{{ getModelNameByCode(history.modelCode) }}</span>
                <span v-if="history.resolution" class="info-text">{{ history.resolution }}</span>
                <span v-if="history.duration" class="info-text">{{ history.duration }}s</span>
                <span class="info-text">{{ history.createTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- 视频预览弹窗 -->
  <VideoPreviewDialog v-model="showVideoPreview" :video-url="previewVideoUrl" />

  <!-- 评论列表弹窗 -->
  <CommentListDialog
    v-model="showCommentList"
    :basic-id="commentBasicId"
    :scene-type="1"
    :trigger-ref="commentTriggerElement"
    trigger-type="hover"
    :comment-list="currentCommentList"
    @change="handleCommentChange"
  />
</template>

<script setup lang="ts">
  import {
    chooseHistoryDetail,
    deleteHistory,
    getSceneHistoryList,
    type SceneItemHistoryInfo
  } from '@/api/workbench/episode';
  import { useProjectStore } from '@/store/modules/project';
  import { formatDate } from '@/utils';
  import { Delete, Download, Loading, MoreFilled, VideoPlay } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';
  import CommentListDialog from '../../StepShotList/components/CommentListDialog.vue';
  import VideoPreviewDialog from './VideoPreviewDialog.vue';

  const projectStore = useProjectStore();

  // 根据项目比例计算视频卡片的固定宽度（高度固定为150px）
  // pictureRatio: 1-16:9; 2-4:3; 3-1:1; 4-3:4; 5-9:16
  const videoCardWidth = computed(() => {
    const ratio = projectStore.pictureRatio;

    switch (ratio) {
      case 1: // 16:9
        return '267px'; // 150 * (16/9)
      case 2: // 4:3
        return '200px'; // 150 * (4/3)
      case 3: // 1:1
        return '150px'; // 150 * 1
      case 4: // 3:4
        return '112px'; // 150 * (3/4)
      case 5: // 9:16
        return '84px'; // 150 * (9/16)
      default:
        // 默认使用 16:9
        return '267px';
    }
  });

  interface VideoDetail extends SceneItemHistoryInfo {
    historyDetailId?: number;
    originOssUrl?: string;
    previewOssUrl?: string;
    videoPrompt?: string;
    prompt?: string;
  }

  interface HistoryGroup {
    historyId: number;
    videoPrompt: string;
    modelCode: string;
    resolution: string;
    duration: number;
    createTime?: string;
    details: VideoDetail[];
  }

  interface Props {
    modelValue: boolean;
    basicId?: number;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'refresh'): void;
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const selectedVideoDetail = ref<VideoDetail | null>(null);
  const initialSelectedVideoDetailId = ref<number | null>(null); // 初始选中的视频ID
  const historyList = ref<HistoryGroup[]>([]);
  const showVideoPreview = ref(false);
  const previewVideoUrl = ref('');

  // 评论相关状态
  const showCommentList = ref(false);
  const commentBasicId = ref(0);
  const commentTriggerElement = ref<HTMLElement>();
  const currentCommentList = ref<any[]>([]);

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        loadHistory();
      } else {
        selectedVideoDetail.value = null;
        initialSelectedVideoDetailId.value = null;
      }
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 根据modelCode获取modelName
  const getModelNameByCode = (modelCode?: string): string => {
    if (!modelCode) return '';
    const model = projectStore.i2vModelInfoList?.find((m) => m.modelCode === modelCode);
    return model?.modelName || modelCode;
  };

  // 加载历史记录
  const loadHistory = async () => {
    if (!props.basicId) {
      return;
    }

    loading.value = true;
    try {
      const { data } = await getSceneHistoryList({
        basicId: props.basicId,
        sceneType: 2 // 2-视频
      });

      if (!data) {
        historyList.value = [];
        return;
      }

      // 如果有选中的历史，自动设置为当前选中
      if (data.selectHistory && data.selectHistory.sceneItemHistoryInfoList) {
        const selectedItem = data.selectHistory.sceneItemHistoryInfoList.find((item) => item.selectStatus === 1);
        if (selectedItem) {
          selectedVideoDetail.value = {
            ...selectedItem,
            historyDetailId: selectedItem.historyDetailId,
            originOssUrl: selectedItem.materialVo?.originOssUrl,
            previewOssUrl: selectedItem.materialVo?.previewOssUrl,
            prompt: data.selectHistory.prompt || ''
          };
          // 保存初始选中的视频ID
          initialSelectedVideoDetailId.value = selectedItem.historyDetailId || null;
        }
      }

      // 转换历史数据
      historyList.value = (data.historyInfoList || []).map((history) => ({
        historyId: history.historyId || 0,
        videoPrompt: history.prompt || '',
        modelCode: history.modelCode || '',
        resolution: history.resolution || '',
        duration: history.duration || 0,
        createTime: history.createTime ? formatDate(String(history.createTime)) : '',
        details: (history.sceneItemHistoryInfoList || []).map((item) => ({
          ...item,
          historyDetailId: item.historyDetailId || 0,
          originOssUrl: item.materialVo?.originOssUrl,
          previewOssUrl: item.materialVo?.previewOssUrl,
          prompt: history.prompt || ''
        }))
      }));
    } catch (error) {
      console.error('加载历史记录失败:', error);
      ElMessage.error('加载历史记录失败');
    } finally {
      loading.value = false;
    }
  };

  // 选择视频（支持二次点击预览）
  const handleSelectVideo = (detail: VideoDetail) => {
    // 如果点击的是已选中的视频，则预览
    if (selectedVideoDetail.value?.historyDetailId === detail.historyDetailId) {
      handlePreviewVideo(detail);
    } else {
      // 否则选中该视频
      selectedVideoDetail.value = detail;
    }
  };

  // 预览视频
  const handlePreviewVideo = (detail: VideoDetail) => {
    const videoUrl = detail.originOssUrl || detail.previewOssUrl;
    if (!videoUrl) {
      ElMessage.warning('视频地址不存在');
      return;
    }

    previewVideoUrl.value = videoUrl;
    showVideoPreview.value = true;
  };

  // 下拉菜单命令处理
  const handleCommand = async (command: string, detail: VideoDetail) => {
    if (command === 'download') {
      await downloadVideo(detail);
    } else if (command === 'delete') {
      await deleteVideoDetail(detail);
    }
  };

  // 下载视频
  const downloadVideo = async (detail: VideoDetail) => {
    const videoUrl = detail.originOssUrl || detail.previewOssUrl;
    if (!videoUrl) {
      ElMessage.warning('视频地址不存在');
      return;
    }

    try {
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = videoUrl;
      link.download = `video_${detail.historyDetailId}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载视频失败:', error);
    }
  };

  // 删除视频历史批次
  const deleteVideoDetail = async (detail: VideoDetail) => {
    try {
      if (!detail.historyId) return;

      await deleteHistory([detail.historyId]);

      // 从列表中移除该历史批次
      historyList.value = historyList.value.filter((h) => h.historyId !== detail.historyId);

      // 如果删除的历史批次包含当前选中的视频，清空选中状态
      if (selectedVideoDetail.value?.historyId === detail.historyId) {
        selectedVideoDetail.value = null;
      }

      ElMessage.success('删除成功');
    } catch (error: any) {
      console.error('删除失败:', error);
    }
  };

  // 确认选择
  const handleConfirm = async () => {
    if (!selectedVideoDetail.value || !selectedVideoDetail.value.historyDetailId) {
      ElMessage.error('请选择视频');
      return;
    }

    // 如果选中的视频没有变化，直接关闭弹窗，不调用接口
    if (selectedVideoDetail.value.historyDetailId === initialSelectedVideoDetailId.value) {
      handleClose();
      return;
    }

    try {
      await chooseHistoryDetail({ historyDetailId: selectedVideoDetail.value.historyDetailId });
      ElMessage.success('选择成功');
      emit('refresh');
      handleClose();
    } catch (error) {
      console.error('选择失败:', error);
      ElMessage.error('选择失败');
    }
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };

  // 显示评论列表
  const handleShowComments = (detail: VideoDetail, event: MouseEvent) => {
    commentBasicId.value = detail.historyDetailId || 0;
    commentTriggerElement.value = event.currentTarget as HTMLElement;
    // 直接使用 detail.commentVoList 中的数据，避免调用接口
    currentCommentList.value = detail.commentVoList || [];
    showCommentList.value = true;
  };

  // 评论变化回调
  const handleCommentChange = async () => {
    await loadHistory();
  };
</script>

<style scoped lang="scss">
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  .history-dialog-container {
    display: flex;
    gap: 16px;
    height: calc(100vh - 240px);
    min-height: 600px;
    max-height: 800px;

    // 左侧区域
    .left-section {
      flex: 0 0 450px;
      display: flex;
      flex-direction: column;
      padding: 20px;
      height: 100%;
      gap: 20px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 12px -1px rgba(0, 0, 0, 0.06);

      .current-video-title {
        color: #1d2129;
        font-size: 13px;
        line-height: 13px;
      }

      .loading-state,
      .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        border: 1px solid #eee;
        background: #f7f8fa;

        .empty-image {
          width: auto;
          height: 200px;
          object-fit: contain;
          opacity: 0.5;
        }

        .empty-text,
        .loading-text {
          color: #86909c;
          font-size: 13px;
          margin-top: 16px;
        }
      }

      .current-video-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;

        .current-video-wrapper {
          height: 240px;
          border-radius: 8px;
          background: #000;
          overflow: hidden;

          .main-video {
            width: 100%;
            height: 100%;
          }
        }

        .lb-box {
          flex: 1;
          border-radius: 8px;
          border: 1px solid #eee;
          background: #fff;
          display: flex;
          flex-direction: column;

          .current-video-info {
            flex: 1;
            padding: 12px;
            overflow-y: auto;

            .memo-sty {
              color: #4e5969;
              font-size: 13px;
              line-height: 13px;
              margin-bottom: 16px;
            }

            .info-item {
              margin: 0 0 14px;
              line-height: 20px;

              &:last-child {
                margin-bottom: 0;
              }

              .label {
                color: #1d2129;
                font-size: 16px;
                font-weight: 600;
                margin-right: 4px;
              }

              .value {
                color: #1d2129;
                font-size: 13px;
                word-break: break-word;
              }
            }
          }

          .left-footer {
            display: flex;
            justify-content: flex-end;
            padding: 12px;
            border-top: 1px solid #eee;
          }
        }
      }
    }

    // 右侧区域
    .right-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 12px -1px rgba(0, 0, 0, 0.06);

      .history-title {
        color: #1d2129;
        font-size: 13px;
        margin-bottom: 20px;
      }

      .loading-container,
      .empty-history {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .history-list {
        flex: 1;
        overflow-y: auto;

        .history-group {
          margin-bottom: 24px;
          padding: 12px;
          background: #f7f8fa;
          border-radius: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .history-group-header {
            margin-bottom: 12px;

            .prompt-line {
              line-height: 20px;

              .label {
                color: #1d2129;
                font-size: 16px;
                font-weight: 600;
                margin-right: 4px;
              }

              .text {
                color: #1d2129;
                font-size: 13px;
              }
            }
          }

          .video-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;

            .video-item {
              position: relative;
              border: 2px solid transparent;
              border-radius: 8px;
              background: #fff;
              cursor: pointer;
              transition: all 0.3s;
              overflow: hidden;

              &:hover {
                border-color: #6157ff;
                box-shadow: 0 4px 12px rgba(97, 87, 255, 0.2);

                .video-wrapper {
                  .action-bottom-left,
                  .action-bottom-right {
                    opacity: 1;
                    z-index: 99;
                  }
                }
              }

              &.selected {
                border-color: #6157ff;
                box-shadow: 0 4px 12px rgba(97, 87, 255, 0.3);
              }

              .video-wrapper {
                position: relative;
                height: 150px;
                background: #000;

                .video-thumbnail {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }

                .video-placeholder {
                  position: absolute;
                  top: 0;
                  left: 0;
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

                // 左下角：评论按钮
                .action-bottom-left {
                  position: absolute;
                  bottom: 8px;
                  left: 8px;
                  opacity: 0;
                  transition: opacity 0.3s;

                  &.has-comments {
                    opacity: 1;
                  }

                  .action-icon {
                    display: flex;
                    width: 24px;
                    height: 24px;
                    justify-content: center;
                    align-items: center;
                    border-radius: 4px;
                    background: #f7f8fa;
                    cursor: pointer;

                    &:hover {
                      background: white;
                      transform: scale(1.1);
                    }

                    .comment-icon {
                      font-size: 12px;
                      width: 12px;
                      height: 12px;
                      color: #5252ff;
                    }

                    .count-text {
                      position: absolute;
                      left: 12px;
                      top: -12px;
                      display: flex;
                      width: 20px;
                      height: 20px;
                      justify-content: center;
                      align-items: center;
                      border-radius: 50%;
                      background: #5252ff;
                      color: #fff;
                      font-size: 12px;
                      line-height: 20px;
                    }
                  }
                }

                // 右下角：更多操作
                .action-bottom-right {
                  position: absolute;
                  bottom: 8px;
                  right: 8px;
                  opacity: 0;
                  transition: opacity 0.3s;

                  .more-btn {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 5px;
                    background: #fff;
                    cursor: pointer;
                    transition: all 0.3s;

                    &:hover {
                      background: white;
                      transform: scale(1.1);
                    }

                    .el-icon {
                      font-size: 14px;
                    }
                  }
                }
              }
            }
          }

          .history-group-footer {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding-top: 12px;
            font-size: 12px;

            .footer-info {
              display: flex;
              gap: 17px;

              .info-text {
                color: #86909c;
                font-size: 12px !important;
                line-height: 12px;
                height: 12px;
              }
            }
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  // 视频历史下拉菜单的全局样式
  .video-history-dropdown {
    z-index: 9999 !important;
  }
</style>
