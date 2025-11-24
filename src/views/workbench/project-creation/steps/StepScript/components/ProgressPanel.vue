<template>
  <div class="progress-panel panel-card">
    <div class="panel-header">
      <div class="header-left">
        <svg-icon icon-class="fy-jindu" class="header-icon" />
        <span class="title">项目进度</span>
      </div>
      <el-tag class="tag-sty" type="info">{{ progress }}%</el-tag>
    </div>

    <div class="panel-content">
      <!-- 空状态 -->
      <div v-if="!hasEpisodes" class="empty-state">
        <span class="empty-title">暂无进度</span>
      </div>

      <!-- 进度列表 -->
      <div v-else class="progress-list">
        <!-- 编剧剧本 -->
        <div class="progress-item">
          <div class="item-header">
            <div class="item-title">
              <span class="dot" :class="{ completed: scriptCompleted }"></span>
              <span class="text">编剧剧本</span>
            </div>
            <div v-if="scriptCompleted" class="status-badge completed">已完成</div>
          </div>
          <el-progress :percentage="scriptCompleted ? 100 : 0" :show-text="false" :stroke-width="8" color="#05DF72" />
        </div>

        <!-- 图片进度 -->
        <div class="progress-item">
          <div class="item-header">
            <div class="item-title">
              <span class="dot"></span>
              <span class="text">图片进度</span>
            </div>
            <div class="progress-value">{{ imageApproved }}/{{ imageTotal }}</div>
          </div>
          <el-progress
            :percentage="imagePercent"
            :show-text="false"
            :stroke-width="8"
            color="#5B5FEF"
            define-back-color="#E8E6FF"
          />
        </div>

        <!-- 视频进度 -->
        <div class="progress-item">
          <div class="item-header">
            <div class="item-title">
              <span class="dot"></span>
              <span class="text">视频进度</span>
            </div>
            <div class="progress-value">{{ videoApproved }}/{{ videoTotal }}</div>
          </div>
          <el-progress
            :percentage="videoPercent"
            :show-text="false"
            :stroke-width="8"
            color="#5B5FEF"
            define-back-color="#E8E6FF"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ProgressPanel">
  import { useProjectStore } from '@/store/modules/project';
  import { computed } from 'vue';

  const projectStore = useProjectStore();

  // 是否有剧集
  const hasEpisodes = computed(() => {
    return projectStore.episodeInfoList && projectStore.episodeInfoList.length > 0;
  });

  // 获取当前剧集的项目进度信息
  const currentEpisodeInfo = computed(() => {
    if (!projectStore.episodeInfoList || projectStore.episodeInfoList.length === 0) {
      return null;
    }
    return projectStore.episodeInfoList.find((ep) => ep.episodeId === projectStore.currentEpisodeId);
  });

  // 总体进度 - 使用剧集进度百分比或总项目进度
  const progress = computed(() => {
    // 优先使用当前剧集的进度
    if (currentEpisodeInfo.value?.episodePercent) {
      const episodePercent = currentEpisodeInfo.value.episodePercent;
      // 确保是字符串类型再调用 replace
      const percent = typeof episodePercent === 'string' ? episodePercent.replace('%', '') : String(episodePercent);
      return parseInt(percent) || 0;
    }
    // 否则使用全局进度
    if (projectStore.allEpisodePercent) {
      const allPercent = projectStore.allEpisodePercent;
      const percent = typeof allPercent === 'string' ? allPercent.replace('%', '') : String(allPercent);
      return parseInt(percent) || 0;
    }
    return 0;
  });

  // 剧本是否完成
  const scriptCompleted = computed(() => {
    return currentEpisodeInfo.value?.projectProcessInfo?.hasScript || false;
  });

  // 图片进度
  const imageApproved = computed(() => {
    return currentEpisodeInfo.value?.projectProcessInfo?.approvalImgCount || 0;
  });

  const imageTotal = computed(() => {
    return currentEpisodeInfo.value?.projectProcessInfo?.totalImgCount || 0;
  });

  const imagePercent = computed(() => {
    const total = imageTotal.value;
    if (total === 0) return 0;
    return Math.round((imageApproved.value / total) * 100);
  });

  // 视频进度
  const videoApproved = computed(() => {
    return currentEpisodeInfo.value?.projectProcessInfo?.approvalVideoCount || 0;
  });

  const videoTotal = computed(() => {
    return currentEpisodeInfo.value?.projectProcessInfo?.totalVideoCount || 0;
  });

  const videoPercent = computed(() => {
    const total = videoTotal.value;
    if (total === 0) return 0;
    return Math.round((videoApproved.value / total) * 100);
  });

  // 进度条颜色
  const progressColor = computed(() => {
    const p = progress.value;
    if (p < 30) return '#f56c6c';
    if (p < 60) return '#e6a23c';
    if (p < 90) return '#409eff';
    return '#67c23a';
  });
</script>

<style scoped lang="scss">
  .progress-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 16px;
    background: white;
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
  }

  .panel-header {
    display: flex;
    flex-shrink: 0;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 6px;

      .header-icon {
        color: #5b5fef;
        font-size: 16px;
      }

      .title {
        color: #1d2129;
        font-size: 16px;
        font-weight: 600;
      }
    }
    .tag-sty {
      display: flex;
      width: 32px;
      height: 18px;
      padding: 2px 5px;
      justify-content: center;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      border-radius: 4px;
      border: 0.625px solid #d6d7ff;
      background: #f3f3ff;
      color: #5252ff;
      font-size: 10px;
    }
  }

  .panel-content {
    flex: 1;
    padding: 0 20px 20px;
    overflow-x: hidden;
    overflow-y: auto;

    // 隐藏滚动条但保留滚动功能
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 150px;
      padding: 30px 20px;
      text-align: center;

      .empty-title {
        color: #4e5969;
        font-size: 14px;
        font-weight: 500;
      }

      .empty-hint {
        color: #c0c4cc;
        font-size: 12px;
      }
    }

    .progress-list {
      display: flex;
      flex-direction: column;
      gap: 24px;

      .progress-item {
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .item-title {
            display: flex;
            align-items: center;
            gap: 8px;

            .dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #5b5fef;

              &.completed {
                background: #00c950;
              }
            }

            .text {
              color: #1d2129;
              font-size: 14px;
              font-weight: 500;
            }
          }

          .status-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            border: 0.716px solid #7bf1a8;

            background: #f0fdf4;

            &.completed {
              // background: #d4f5eb;
              color: #008236;
            }
          }

          .progress-value {
            color: #5b5fef;
            font-size: 14px;
            font-weight: 600;
          }
        }

        :deep(.el-progress) {
          .el-progress-bar__outer {
            border-radius: 100px;
            background-color: #e8e9ff;
          }

          .el-progress-bar__inner {
            border-radius: 100px;
          }
        }
      }
    }
  }
</style>
