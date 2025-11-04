<template>
  <div class="waterfall-view-container">
    <!-- 加载中 -->
    <div v-if="loading" v-loading="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" :size="60"><Loading /></el-icon>
        <p class="loading-text">分镜生成中，请稍等...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="shots.length === 0" class="empty-state">
      <div class="empty-content">
        <el-icon :size="100" color="#c0c4cc"><Picture /></el-icon>
        <p class="empty-text">暂无分镜</p>
      </div>
    </div>

    <!-- 瀑布流容器 -->
    <div v-else class="waterfall-container">
      <div v-for="columnIndex in 3" :key="columnIndex" class="waterfall-column">
        <div
          v-for="shot in getColumnShots(columnIndex - 1)"
          :key="shot.id"
          class="waterfall-card"
          @mouseenter="handleCardHover(shot)"
          @mouseleave="handleCardLeave"
        >
          <!-- 卡片状态 -->
          <div class="card-header">
            <div class="status-dot" :class="getStatusClass(shot)"></div>
            <div class="shot-number">镜{{ shot.shotNumber }}</div>
          </div>

          <!-- 画面图片 -->
          <div class="card-image">
            <el-image
              v-if="shot.sceneImage"
              :src="shot.sceneImage"
              fit="cover"
              class="shot-image"
              :preview-src-list="[shot.sceneImage]"
            />
            <div v-else class="image-placeholder">
              <el-icon :size="48"><Picture /></el-icon>
            </div>
          </div>

          <!-- 卡片详情 -->
          <div class="card-details">
            <!-- 画面描述 -->
            <div class="detail-item">
              <div class="detail-label">
                <el-icon><Document /></el-icon>
                <span>画面描述</span>
              </div>
              <div class="detail-content">{{ shot.sceneDescription }}</div>
            </div>

            <!-- 台词 -->
            <div class="detail-item">
              <div class="detail-label">
                <el-icon><ChatDotRound /></el-icon>
                <span>台词</span>
              </div>
              <div class="detail-content dialogue">{{ shot.dialogue }}</div>
            </div>

            <!-- 人物 -->
            <div class="detail-item">
              <div class="detail-label">
                <el-icon><User /></el-icon>
                <span>人物</span>
              </div>
              <div class="detail-tags">
                <el-tag v-for="(char, idx) in shot.characters" :key="idx" size="small" type="primary" round>
                  {{ char }}
                </el-tag>
              </div>
            </div>

            <!-- 场景 -->
            <div v-if="shot.sceneLocation" class="detail-item">
              <div class="detail-label">
                <el-icon><Location /></el-icon>
                <span>场景</span>
              </div>
              <div class="detail-content">{{ shot.sceneLocation }}</div>
            </div>
          </div>

          <!-- 悬浮操作 -->
          <div class="card-overlay" :class="{ show: hoveredCardId === shot.id }">
            <el-button-group>
              <el-button type="primary" @click="handleViewShot(shot)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button @click="handleEditShot(shot)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button @click="handleDownloadShot(shot)">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </el-button-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Shot } from '@/api/workbench/project/types';
  import {
    ChatDotRound,
    Document,
    Download,
    Edit,
    Loading,
    Location,
    Picture,
    User,
    View
  } from '@element-plus/icons-vue';
  import { ref } from 'vue';

  interface Props {
    shots: Shot[];
    loading?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits(['view', 'edit', 'download']);

  // 悬浮的卡片ID
  const hoveredCardId = ref<string | number | null>(null);

  // 获取瀑布流列的分镜数据
  const getColumnShots = (columnIndex: number) => {
    const columnCount = 3;
    return props.shots.filter((_, index) => index % columnCount === columnIndex);
  };

  // 卡片悬浮
  const handleCardHover = (shot: Shot) => {
    hoveredCardId.value = shot.id;
  };

  // 卡片离开
  const handleCardLeave = () => {
    hoveredCardId.value = null;
  };

  // 获取状态类
  const getStatusClass = (shot: Shot) => {
    if (shot.sceneImage) {
      return 'completed';
    }
    return 'pending';
  };

  // 查看分镜
  const handleViewShot = (shot: Shot) => {
    emit('view', shot);
  };

  // 编辑分镜
  const handleEditShot = (shot: Shot) => {
    emit('edit', shot);
  };

  // 下载分镜
  const handleDownloadShot = (shot: Shot) => {
    emit('download', shot);
  };
</script>

<style scoped lang="scss">
  .waterfall-view-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: rgb(255 255 255 / 90%);

      .loading-content {
        text-align: center;

        .loading-text {
          margin-top: 20px;
          color: #606266;
          font-size: 16px;
        }
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      .empty-content {
        text-align: center;

        .empty-text {
          margin-top: 20px;
          color: #909399;
          font-size: 16px;
        }
      }
    }

    .waterfall-container {
      display: flex;
      gap: 20px;
      width: 100%;
      height: 100%;
      padding: 20px;
      overflow-y: auto;

      .waterfall-column {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 20px;

        .waterfall-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
            transform: translateY(-4px);

            .card-overlay {
              opacity: 1;
            }
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8eaed 100%);

            .status-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;

              &.completed {
                background: #67c23a;
              }

              &.pending {
                background: #e6a23c;
              }
            }

            .shot-number {
              color: #303133;
              font-size: 14px;
              font-weight: 600;
            }
          }

          .card-image {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            background: #f5f7fa;
            aspect-ratio: 16/9;

            .shot-image {
              width: 100%;
              height: 100%;
            }

            .image-placeholder {
              display: flex;
              justify-content: center;
              align-items: center;
              color: #c0c4cc;
            }
          }

          .card-details {
            padding: 16px;

            .detail-item {
              margin-bottom: 16px;

              &:last-child {
                margin-bottom: 0;
              }

              .detail-label {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;
                color: #909399;
                font-size: 13px;
                font-weight: 600;

                .el-icon {
                  font-size: 16px;
                }
              }

              .detail-content {
                color: #606266;
                font-size: 13px;
                line-height: 1.6;

                &.dialogue {
                  color: #409eff;
                  font-style: italic;
                }
              }

              .detail-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
              }
            }
          }

          .card-overlay {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgb(0 0 0 / 70%);
            opacity: 0;
            transition: all 0.3s;

            .el-button-group {
              display: flex;
              flex-direction: column;
              gap: 8px;

              .el-button {
                width: 120px;
              }
            }
          }
        }
      }
    }
  }
</style>
