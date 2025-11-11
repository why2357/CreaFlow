<template>
  <el-dialog
    style="background-color: #f7f8fa"
    v-model="visible"
    title="图片历史"
    width="70%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="history-dialog-container">
      <!-- 左侧：当前选中图片 -->
      <div class="left-section">
        <div class="current-image-title">当前选中图片</div>

        <!-- Loading 状态 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading" :size="40">
            <Loading />
          </el-icon>
          <p class="loading-text">加载中...</p>
        </div>

        <div v-else-if="!selectedHistoryDetail" class="empty-state">
          <img src="../../../../../../assets/images/no-sence.png" alt="暂无图片" class="empty-image" />
          <p class="empty-text">点击右侧图片进行查看</p>
        </div>
        <div v-else class="current-image-container">
          <div class="current-image-wrapper">
            <el-image :src="selectedHistoryDetail.previewOssUrl || selectedHistoryDetail.originOssUrl" fit="contain" />
          </div>
          <div class="lb-box">
            <div class="current-image-info">
              <div class="memo-sty">提示词描述</div>
              <p class="info-item">
                <span class="label">·</span>
                <span class="value">{{ selectedHistoryDetail.description || '-' }}</span>
              </p>
              <p class="info-item">
                <span class="label">·</span>
                <span class="value">{{ selectedHistoryDetail.prompt || '-' }}</span>
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
                  <div v-if="history.sceneDesc" class="prompt-line">
                    <span class="label">·</span>
                    <span class="text">{{ history.sceneDesc }}</span>
                  </div>
                  <div v-if="history.sceneHint" class="prompt-line">
                    <span class="label">·</span>
                    <span class="text">{{ history.sceneHint }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片网格 -->
            <div class="image-grid">
              <div
                v-for="detail in history.details"
                :key="detail.historyDetailId"
                class="image-item"
                :class="{ selected: selectedHistoryDetail?.historyDetailId === detail.historyDetailId }"
                @click="handleSelectImage(detail)"
              >
                <div class="image-wrapper">
                  <el-image :src="detail.previewOssUrl || detail.originOssUrl" fit="cover" :preview-src-list="[]" />

                  <!-- 左上角：放大按钮 -->
                  <div class="action-top-left">
                    <el-tooltip content="放大" placement="top">
                      <div class="action-icon" @click.stop="handlePreviewImage(detail)">
                        <svg-icon icon-class="fy-zoomin" />
                      </div>
                    </el-tooltip>
                  </div>

                  <!-- 右上角：收藏按钮 -->
                  <div class="action-top-right" :class="{ 'is-collected': detail.isCollected }">
                    <el-tooltip :content="detail.isCollected ? '取消收藏' : '收藏'" placement="top">
                      <div class="action-icon" @click.stop="handleToggleCollect(detail)">
                        <svg-icon v-if="detail.isCollected" icon-class="fy-starfilled" />
                        <svg-icon v-else icon-class="fy-star" />
                      </div>
                    </el-tooltip>
                  </div>

                  <!-- 右下角左侧：评论按钮 -->
                  <div class="action-bottom-left" @click.stop>
                    <el-tooltip content="查看评论" placement="top">
                      <div
                        ref="commentTriggerRef"
                        class="action-icon comment-btn"
                        @click.stop="handleShowComments(detail, $event)"
                      >
                        <svg-icon icon-class="fy-comment" />
                      </div>
                    </el-tooltip>
                  </div>

                  <!-- 右下角：更多操作 -->
                  <div class="action-bottom-right" @click.stop>
                    <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, detail)">
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
                <span v-if="history.modelCode" class="info-text">{{ history.modelCode }}</span>
                <span class="info-text">{{ history.ratio }}</span>
                <span class="info-text">{{ history.createTime }}</span>
              </div>
              <div class="footer-actions">
                <el-dropdown trigger="click" @command="() => handleDeleteHistory(history.historyId)">
                  <div class="more-btn-footer">
                    <svg-icon icon-class="fy-more" style="width: 12px; height: 12px" />
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="delete" style="color: #f56c6c">
                        <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 12px" />
                        删除该批次结果
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- 图片预览 -->
  <el-image-viewer
    v-if="showImageViewer"
    :url-list="[previewImageUrl]"
    :initial-index="0"
    :z-index="9999"
    @close="showImageViewer = false"
  />

  <!-- 评论列表弹窗 -->
  <CommentListDialog
    v-model="showCommentList"
    :basic-id="commentBasicId"
    :scene-type="1"
    :trigger-ref="commentTriggerElement"
    @change="handleCommentChange"
  />
</template>

<script setup lang="ts">
  import {
    cancelCollectHistoryDetail,
    chooseHistoryDetail,
    collectHistoryDetail,
    deleteHistory,
    deleteHistoryDetail,
    getSceneHistoryList,
    type SceneItemHistoryInfo
  } from '@/api/workbench/episode';
  import { formatDate } from '@/utils';
  import { Delete, Download, Loading, MoreFilled } from '@element-plus/icons-vue';
  import { ElImageViewer, ElMessage, ElMessageBox } from 'element-plus';
  import { ref, watch } from 'vue';
  import CommentListDialog from './CommentListDialog.vue';

  interface HistoryDetail extends SceneItemHistoryInfo {
    originOssUrl?: string;
    previewOssUrl?: string;
    prompt?: string;
    description?: string;
    creator?: string;
    ratio?: string;
    createTime?: string;
    isCollected?: boolean;
  }

  interface HistoryGroup {
    historyId: number;
    sceneDesc: string;
    sceneHint: string;
    modelCode: string;
    ratio: string;
    createTime?: string;
    details: HistoryDetail[];
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
  const selectedHistoryDetail = ref<HistoryDetail | null>(null);
  const historyList = ref<HistoryGroup[]>([]);
  const showImageViewer = ref(false);
  const previewImageUrl = ref('');

  // 评论相关状态
  const showCommentList = ref(false);
  const commentBasicId = ref(0);
  const commentTriggerElement = ref<HTMLElement>();

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        loadHistory();
      } else {
        selectedHistoryDetail.value = null;
      }
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 比例映射
  const getRatioText = (pictureRatio?: number): string => {
    const ratioMap: Record<number, string> = {
      1: '16:9',
      2: '4:3',
      3: '1:1',
      4: '3:4',
      5: '9:16'
    };
    return ratioMap[pictureRatio || 3] || '1:1';
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
        sceneType: 1 // 1-图片 2-视频
      });

      if (!data) {
        historyList.value = [];
        return;
      }

      // 如果有选中的历史，自动设置为当前选中
      if (data.selectHistory && data.selectHistory.sceneItemHistoryInfoList) {
        const selectedItem = data.selectHistory.sceneItemHistoryInfoList.find((item) => item.selectStatus === 1);
        if (selectedItem) {
          selectedHistoryDetail.value = {
            ...selectedItem,
            originOssUrl: selectedItem.materialVo?.originOssUrl,
            previewOssUrl: selectedItem.materialVo?.previewOssUrl,
            prompt: data.selectHistory.sceneHint,
            description: data.selectHistory.sceneDesc,
            ratio: getRatioText(data.selectHistory.pictureRatio),
            createTime: data.selectHistory.createTime ? formatDate(String(data.selectHistory.createTime)) : '',
            isCollected: selectedItem.isCollect
          };
        }
      }

      // 直接使用API返回的数据结构
      historyList.value = (data.historyInfoList || []).map((history) => ({
        historyId: history.historyId || 0,
        sceneDesc: history.sceneDesc || '',
        sceneHint: history.sceneHint || '',
        modelCode: history.modelCode || '',
        ratio: getRatioText(history.pictureRatio),
        createTime: history.createTime ? formatDate(String(history.createTime)) : '',
        details: (history.sceneItemHistoryInfoList || []).map((item) => ({
          ...item,
          historyDetailId: item.historyDetailId || 0,
          originOssUrl: item.materialVo?.originOssUrl,
          previewOssUrl: item.materialVo?.previewOssUrl,
          prompt: history.sceneHint,
          description: history.sceneDesc,
          ratio: getRatioText(history.pictureRatio),
          createTime: history.createTime ? formatDate(String(history.createTime)) : '',
          isCollected: item.isCollect || false
        }))
      }));
    } catch (error) {
      console.error('加载历史记录失败:', error);
      ElMessage.error('加载历史记录失败');
    } finally {
      loading.value = false;
    }
  };

  // 选择图片
  const handleSelectImage = (detail: HistoryDetail) => {
    selectedHistoryDetail.value = detail;
  };

  // 预览图片
  const handlePreviewImage = (detail: HistoryDetail) => {
    const imageUrl = detail.previewOssUrl || detail.originOssUrl;
    if (!imageUrl) {
      ElMessage.warning('图片地址不存在');
      return;
    }

    // 设置预览图片URL并显示查看器
    previewImageUrl.value = imageUrl;
    showImageViewer.value = true;
  };

  // 切换收藏状态
  const handleToggleCollect = async (detail: HistoryDetail) => {
    const historyDetailId = detail.historyDetailId;
    if (!historyDetailId) {
      ElMessage.error('历史明细ID不存在');
      return;
    }

    const isCurrentlyCollected = detail.isCollected;

    try {
      if (isCurrentlyCollected) {
        // 取消收藏
        await cancelCollectHistoryDetail({ historyDetailId });
        detail.isCollected = false;
        ElMessage.success('取消收藏成功');
      } else {
        // 收藏
        await collectHistoryDetail({ historyDetailId });
        detail.isCollected = true;
        ElMessage.success('收藏成功');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      ElMessage.error('操作失败');
    }
  };

  // 删除历史批次
  const handleDeleteHistory = async (historyId: number) => {
    try {
      await ElMessageBox.confirm('确定要删除该批次的所有结果吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await deleteHistory([historyId]);
      historyList.value = historyList.value.filter((h) => h.historyId !== historyId);

      // 如果删除的批次包含当前选中的图片，清空选中状态
      if (
        selectedHistoryDetail.value &&
        historyList.value.every(
          (h) => !h.details.some((d) => d.historyDetailId === selectedHistoryDetail.value!.historyDetailId)
        )
      ) {
        selectedHistoryDetail.value = null;
      }

      ElMessage.success('删除成功');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error);
        ElMessage.error('删除失败');
      }
    }
  };

  // 下载图片
  const downloadImage = async (detail: HistoryDetail) => {
    const imageUrl = detail.originOssUrl || detail.previewOssUrl;
    if (!imageUrl) {
      ElMessage.warning('图片地址不存在');
      return;
    }

    try {
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a');
      link.style.display = 'none';

      // 使用 fetch 获取图片数据
      const response = await fetch(imageUrl, {
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 从 URL 中提取文件名，或使用默认名称
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1] || `scene-image-${detail.historyDetailId}.jpg`;

      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      ElMessage.success('下载成功');
    } catch (error) {
      console.error('下载图片失败:', error);
      // 如果 fetch 失败（可能是跨域问题），尝试直接打开链接
      try {
        window.open(imageUrl, '_blank');
        ElMessage.info('已在新标签页打开图片，请手动保存');
      } catch {
        ElMessage.error('下载失败，请稍后重试');
      }
    }
  };

  // 下拉菜单命令处理
  const handleCommand = async (command: string, detail: HistoryDetail) => {
    if (!detail.historyDetailId) {
      ElMessage.error('历史明细ID不存在');
      return;
    }
    if (command === 'download') {
      await downloadImage(detail);
    } else if (command === 'delete') {
      try {
        await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        await deleteHistoryDetail([detail.historyDetailId]);

        // 从列表中移除该图片
        historyList.value.forEach((history) => {
          history.details = history.details.filter((d) => d.historyDetailId !== detail.historyDetailId);
        });

        // 移除空的历史组
        historyList.value = historyList.value.filter((h) => h.details.length > 0);

        // 如果删除的是当前选中的图片，清空选中状态
        if (selectedHistoryDetail.value?.historyDetailId === detail.historyDetailId) {
          selectedHistoryDetail.value = null;
        }

        ElMessage.success('删除成功');
      } catch (error: any) {
        if (error !== 'cancel') {
          console.error('删除失败:', error);
          ElMessage.error('删除失败');
        }
      }
    }
  };

  // 确认选择
  const handleConfirm = async () => {
    if (!selectedHistoryDetail.value || !selectedHistoryDetail.value.historyDetailId) {
      ElMessage.error('请选择图片');
      return;
    }

    try {
      await chooseHistoryDetail({ historyDetailId: selectedHistoryDetail.value.historyDetailId });
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
  const handleShowComments = (detail: HistoryDetail, event: MouseEvent) => {
    commentBasicId.value = detail.historyDetailId || 0;
    commentTriggerElement.value = event.currentTarget as HTMLElement;
    showCommentList.value = true;
  };

  // 评论变化回调
  const handleCommentChange = () => {
    // 评论变化后可以刷新数据或做其他处理
    console.log('评论已更新');
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
      position: relative;

      height: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 12px -1px rgba(0, 0, 0, 0.06);
      .current-image-title {
        color: #1d2129;
        font-size: 13px;
        line-height: 13px;
      }

      .empty-state {
        display: flex;
        flex: 1;
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

        .empty-text {
          margin-top: 16px;
          color: #86909c;
          font-size: 13px;
        }
      }

      .current-image-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 16px;
        position: relative;

        // 图片容器 - 固定高度180px
        .current-image-wrapper {
          height: 180px;
          border-radius: 8px;
          background: #f5f7fa;
          overflow: hidden;

          .el-image {
            width: 100%;
            height: 100%;
          }
        }
        .lb-box {
          border-radius: 8px;
          border: 1px solid #eee;
          background-color: #fff;
          flex: 1;
          height: 100%;
        }
        // 提示词描述区域 - 可滚动，自适应高度
        .current-image-info {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          min-height: 100px;
          height: calc(100% - 52px);
          .memo-sty {
            color: #4e5969;
            font-size: 13px;
            line-height: 13px; /* 100% */
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

        // 左侧底部按钮
        .left-footer {
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 12px;
          border-top: 1px solid #eee;
          background: rgba(255, 255, 255, 0);
        }
      }
    }

    // 右侧区域
    .right-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      border-radius: 8px;
      padding: 20px;
      gap: 20px;
      background: var(--text-color-text-6, #fff);

      /* 中层投影 */
      box-shadow: 0 4px 12px -1px rgba(0, 0, 0, 0.06);

      .history-title {
        color: #1d2129;
        font-weight: 500;
        font-size: 13px;
        line-height: 13px;
        height: 13px;
      }

      .loading-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;

        .is-loading {
          color: #6157ff;
        }

        .loading-text {
          color: #86909c;
          font-size: 14px;
          margin: 0;
        }
      }

      .empty-history {
        display: flex;
        flex: 1;
        justify-content: center;
        align-items: center;
      }

      .history-list {
        flex: 1;
        overflow-y: auto;

        .history-group {
          margin-bottom: 24px;
          border-radius: 8px;
          background: #f7f8fa;
          padding: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .history-group-header {
            margin-bottom: 12px;
            padding-bottom: 8px;

            .header-content {
              .prompt-section {
                .prompt-line {
                  margin-bottom: 8px;
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

                  .text {
                    color: #1d2129;
                    font-size: 13px;
                  }
                }
              }
            }
          }

          .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;

            .image-item {
              position: relative;
              overflow: hidden;
              border: 2px solid transparent;
              border-radius: 8px;
              background: #fff;
              cursor: pointer;
              transition: all 0.3s;

              &:hover {
                border-color: #6157ff;
                box-shadow: 0 4px 12px rgb(97 87 255 / 20%);

                .image-wrapper {
                  .action-top-left,
                  .action-top-right,
                  .action-bottom-left,
                  .action-bottom-right {
                    opacity: 1;
                  }
                }
              }

              &.selected {
                border-color: #6157ff;
                box-shadow: 0 4px 12px rgb(97 87 255 / 30%);
              }

              .image-wrapper {
                position: relative;
                width: 100%;
                padding-bottom: 100%; // 1:1 ratio
                background: #f5f7fa;

                .el-image {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                }

                // 左上角：放大按钮
                .action-top-left {
                  position: absolute;
                  top: 8px;
                  left: 8px;
                  opacity: 0;
                  transition: opacity 0.3s;

                  .action-icon {
                    display: flex;
                    width: 24px;
                    height: 24px;
                    justify-content: center;
                    align-items: center;
                    flex-shrink: 0;
                    border-radius: 4px;
                    background: var(--text-color-text-5, #f7f8fa);
                    z-index: 99;

                    &:hover {
                      background: white;
                      transform: scale(1.1);
                    }

                    .el-icon {
                      font-size: 14px;
                    }
                  }
                }

                // 右上角：收藏按钮
                .action-top-right {
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  opacity: 0;
                  transition: opacity 0.3s;

                  // 已收藏状态时始终显示
                  &.is-collected {
                    opacity: 1;
                  }

                  .action-icon {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #f7f8fa;
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

                // 左下角：评论按钮
                .action-bottom-left {
                  position: absolute;
                  bottom: 8px;
                  left: 8px;
                  opacity: 0;
                  transition: opacity 0.3s;

                  .action-icon {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: rgb(255 255 255 / 90%);
                    cursor: pointer;
                    transition: all 0.3s;

                    &:hover {
                      background: white;
                      transform: scale(1.1);
                    }

                    .svg-icon {
                      font-size: 14px;
                      width: 14px;
                      height: 14px;
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
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: rgb(255 255 255 / 90%);
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

          // 历史组底部信息
          .history-group-footer {
            display: flex;
            justify-content: end;
            align-items: center;
            padding-top: 12px;

            .footer-info {
              display: flex;
              gap: 17px;
              align-items: center;
              margin-right: 17px;

              .info-text {
                color: #86909c;
                font-size: 12px;
              }
            }

            .footer-actions {
              .more-btn-footer {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 24px;
                height: 24px;
                border-radius: 5.143px;
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                  background: #fff;
                  transform: scale(1.1);
                }

                .el-icon {
                  font-size: 14px;
                  color: #4e5969;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
