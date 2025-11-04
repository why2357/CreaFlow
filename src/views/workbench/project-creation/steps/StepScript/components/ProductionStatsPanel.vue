<template>
  <div class="production-stats-panel panel-card">
    <div class="panel-header">
      <div class="header-left">
        <svg-icon icon-class="fy-shuju" class="el-icon" />
        <span class="title">成员生产数据</span>
      </div>
    </div>

    <div class="panel-content">
      <!-- 空状态 -->
      <div v-if="memberData.length === 0" class="empty-state">
        <span class="empty-title">暂无生产数据</span>
      </div>

      <!-- 数据表格 -->
      <div v-else class="stats-table">
        <div class="table-header">
          <div class="col col-member">成员</div>
          <div class="col col-shot">分镜图/图片</div>
          <div class="col col-video">视频次数</div>
          <div class="col col-score">积分</div>
        </div>
        <div class="table-body">
          <div v-for="member in memberData" :key="member.name" class="table-row">
            <div class="col col-member">
              <div class="member-avatar" :style="{ backgroundColor: member.color }">
                {{ member.icon }}
              </div>
              <span class="member-name">{{ member.name }}</span>
            </div>
            <div class="col col-shot">
              <span class="value">{{ member.validImgCount }}</span>
              <span class="total">/ {{ member.imgTaskCount }}</span>
            </div>
            <div class="col col-video">
              <span class="value">{{ member.validVideoCount }}</span>
              <span class="total">/ {{ member.videoTaskCount }}</span>
            </div>
            <div class="col col-score" :class="`score-${member.scoreColor}`">
              {{ member.score }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ProductionStatsPanel">
  import type { UserProcessInfo } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { getRoleColor, getRoleShortName } from '@/utils/roleUtils';
  import { computed, onMounted, watch } from 'vue';

  const projectStore = useProjectStore();

  // 积分颜色
  const getScoreColor = (score: number): string => {
    if (score >= 500) return 'red';
    if (score >= 200) return 'orange';
    return 'blue';
  };

  // 从当前剧集加载成员生产数据
  const memberData = computed(() => {
    // 如果没有剧集信息或剧集列表为空，返回空数组
    if (!projectStore.episodeInfoList || projectStore.episodeInfoList.length === 0) {
      return [];
    }

    const currentEpisodeInfo = projectStore.episodeInfoList.find(
      (ep) => ep.episodeId === projectStore.currentEpisodeId
    );

    // 如果当前剧集存在且有用户进度信息
    if (currentEpisodeInfo?.userProcessInfoList && currentEpisodeInfo.userProcessInfoList.length > 0) {
      return currentEpisodeInfo.userProcessInfoList.map((user: UserProcessInfo) => {
        const icon = getRoleShortName(user.memberRoleKey);
        const color = getRoleColor(user.memberRoleKey);

        return {
          name: user.memberName || '未命名',
          icon,
          color,
          validImgCount: user.validImgCount || 0,
          imgTaskCount: user.imgTaskCount || 0,
          validVideoCount: user.validVideoCount || 0,
          videoTaskCount: user.videoTaskCount || 0,
          score: user.pointsCount || 0,
          scoreColor: getScoreColor(user.pointsCount || 0)
        };
      });
    }

    // 新项目或无数据时返回空数组
    return [];
  });

  // 空状态提示文案
  const emptyHint = computed(() => {
    if (!projectStore.episodeInfoList || projectStore.episodeInfoList.length === 0) {
      return '请先创建剧集';
    }
    if (!projectStore.currentEpisodeId) {
      return '请选择一个剧集';
    }
    return '当前剧集暂无成员生产数据';
  });

  // 初始化
  onMounted(() => {
    loadStats();
  });

  // 监听项目变化
  watch(
    () => [projectStore.currentProjectId, projectStore.currentEpisodeId],
    () => {
      loadStats();
    }
  );

  // 加载统计数据
  const loadStats = () => {
    // 数据来自 computed 属性
  };
</script>

<style scoped lang="scss">
  .production-stats-panel {
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
    padding: 20px 20px 12px;

    .header-left {
      display: flex;
      align-items: center;

      .el-icon {
        color: #5252ff;
        font-size: 16px;
        margin-right: 7px;
      }

      .title {
        color: #303133;
        font-size: 15px;
        font-weight: 600;
      }
    }
  }

  .panel-content {
    flex: 1;
    padding: 0;
    overflow-x: hidden;
    overflow-y: auto;

    // 隐藏滚动条但保留滚动功能
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE 10+

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari, Edge
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      height: 100%;
      min-height: 200px;
      padding: 40px 20px;
      text-align: center;

      .empty-title {
        color: #909399;
        font-size: 14px;
        font-weight: 500;
      }

      .empty-hint {
        color: #c0c4cc;
        font-size: 12px;
      }
    }

    .stats-table {
      width: 100%;

      .table-header {
        display: flex;
        align-items: center;
        padding: 14px 20px;
        border-bottom: 2px solid #f0f2f5;
        background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
        color: #909399;
        font-size: 12px;
        font-weight: 600;

        .col {
          text-align: center;

          &.col-member {
            flex: 0 0 80px;
            text-align: left;
          }

          &.col-shot {
            flex: 1;
          }

          &.col-video {
            flex: 1;
          }

          &.col-score {
            flex: 0 0 60px;
          }
        }
      }

      .table-body {
        .table-row {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f5f7fa;
          transition: all 0.3s;

          &:hover {
            background: #f9f8ff;
          }

          &:last-child {
            border-bottom: none;
          }

          .col {
            text-align: center;

            &.col-member {
              display: flex;
              flex: 0 0 80px;
              align-items: center;
              gap: 10px;
              text-align: left;

              .member-avatar {
                display: flex;
                flex-shrink: 0;
                justify-content: center;
                align-items: center;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgb(108 92 231 / 20%);
                color: white;
                font-size: 14px;
                font-weight: 700;
              }

              .member-name {
                overflow: hidden;
                color: #303133;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
            }

            &.col-shot,
            &.col-video {
              flex: 1;
              font-size: 14px;

              .value {
                color: #303133;
                font-weight: 700;
              }

              .total {
                color: #909399;
                font-size: 12px;
              }
            }

            &.col-score {
              flex: 0 0 60px;
              font-size: 16px;
              font-weight: 700;

              &.score-orange {
                color: #e6a23c;
              }

              &.score-red {
                color: #f56c6c;
              }
            }
          }
        }
      }
    }
  }
</style>
