<template>
  <div class="grid-view-container">
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
        <el-icon :size="100" color="#c0c4cc"><Grid /></el-icon>
        <p class="empty-text">暂无分镜</p>
      </div>
    </div>

    <!-- 故事板网格 -->
    <div v-else class="grid-container">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="grid-card"
        @mouseenter="handleCardHover(shot)"
        @mouseleave="handleCardLeave"
      >
        <!-- 卡片状态指示器 -->
        <div class="card-status">
          <div class="status-dot" :class="getStatusClass(shot)"></div>
        </div>

        <!-- 镜号 -->
        <div class="card-number">{{ shot.shotNumber }}</div>

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

        <!-- 卡片信息 -->
        <div class="card-info">
          <!-- 画面描述 -->
          <div class="info-section">
            <div class="info-label">画面描述</div>
            <div class="info-content description">{{ shot.sceneDescription }}</div>
          </div>

          <!-- 台词 -->
          <div class="info-section">
            <div class="info-label">台词</div>
            <div class="info-content dialogue">{{ shot.dialogue }}</div>
          </div>

          <!-- 人物和场景 -->
          <div class="info-footer">
            <div class="characters">
              <el-tag v-for="(char, idx) in shot.characters" :key="idx" size="small" type="primary" round>
                {{ char }}
              </el-tag>
            </div>
            <div v-if="shot.sceneLocation" class="scene-location">
              <el-icon><Location /></el-icon>
              <span>{{ shot.sceneLocation }}</span>
            </div>
          </div>
        </div>

        <!-- 悬浮操作按钮 -->
        <div class="card-actions" :class="{ show: hoveredCardId === shot.id }">
          <el-button-group>
            <el-button size="small" @click="handleViewShot(shot)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button size="small" @click="handleEditShot(shot)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" @click="handleDownloadShot(shot)">
              <el-icon><Download /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="handleDeleteShot(shot)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Shot } from '@/api/workbench/project/types';
  import { Delete, Download, Edit, Grid, Loading, Location, Picture, View } from '@element-plus/icons-vue';
  import { ref } from 'vue';

  interface Props {
    shots: Shot[];
    loading?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<{
    (e: 'view', shot: Shot): void;
    (e: 'edit', shot: Shot): void;
    (e: 'download', shot: Shot): void;
    (e: 'delete', shot: Shot): void;
  }>();

  // 悬浮的卡片ID
  const hoveredCardId = ref<string | number | null>(null);

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

  // 删除分镜
  const handleDeleteShot = (shot: Shot) => {
    emit('delete', shot);
  };
</script>

<style scoped lang="scss">
  .grid-view-container {
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

    .grid-container {
      display: grid;
      align-content: start;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      width: 100%;
      height: 100%;
      padding: 20px;
      overflow-y: auto;

      .grid-card {
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
        }

        .card-status {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;

          .status-dot {
            width: 12px;
            height: 12px;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgb(0 0 0 / 20%);

            &.completed {
              background: #67c23a;
            }

            &.pending {
              background: #e6a23c;
            }
          }
        }

        .card-number {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          padding: 4px 12px;
          border-radius: 12px;
          background: rgb(0 0 0 / 60%);
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .card-image {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 200px;
          background: #f5f7fa;

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

        .card-info {
          padding: 16px;

          .info-section {
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            .info-label {
              margin-bottom: 4px;
              color: #909399;
              font-size: 12px;
              font-weight: 600;
            }

            .info-content {
              color: #606266;
              font-size: 13px;
              line-height: 1.6;

              &.description {
                display: -webkit-box;
                -webkit-box-orient: vertical;
                line-clamp: 2;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              &.dialogue {
                display: -webkit-box;
                -webkit-box-orient: vertical;
                line-clamp: 2;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                font-style: italic;
              }
            }
          }

          .info-footer {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f0f0f0;

            .characters {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-bottom: 8px;
            }

            .scene-location {
              display: flex;
              align-items: center;
              gap: 4px;
              color: #909399;
              font-size: 12px;

              .el-icon {
                font-size: 14px;
              }
            }
          }
        }

        .card-actions {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          padding: 40px 16px 16px;
          background: linear-gradient(to top, rgb(0 0 0 / 80%), transparent);
          opacity: 0;
          transition: all 0.3s;
          transform: translateY(100%);

          &.show {
            opacity: 1;
            transform: translateY(0);
          }

          .el-button-group {
            display: flex;
            width: 100%;

            .el-button {
              flex: 1;
              border-color: white;
              background: white;

              &:hover {
                background: #f5f7fa;
              }

              &.el-button--danger {
                color: #f56c6c;

                &:hover {
                  border-color: #fbc4c4;
                  background: #fef0f0;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
