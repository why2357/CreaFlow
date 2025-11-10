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
    <div v-else-if="scenes.length === 0" class="empty-state">
      <div class="empty-content">
        <el-icon :size="100" color="#c0c4cc"><Grid /></el-icon>
        <p class="empty-text">暂无分镜</p>
      </div>
    </div>

    <!-- 故事板网格 -->
    <div v-else class="grid-container">
      <div
        v-for="scene in scenes"
        :key="scene.id"
        class="grid-card"
        :class="getCardClass(scene)"
        @mouseenter="handleCardHover(scene)"
        @mouseleave="handleCardLeave"
      >
        <!-- 画面图片 -->
        <div class="card-image" @click="handleImageClick(scene)">
          <el-image
            v-if="scene.previewOssUrl || scene.originOssUrl"
            :src="scene.previewOssUrl || scene.originOssUrl"
            fit="cover"
            class="shot-image"
            :preview-src-list="[scene.previewOssUrl || scene.originOssUrl]"
            :preview-teleported="true"
          />
          <div v-else class="image-placeholder">
            <img src="../../../../../../assets/images/no-sence.png" alt="暂无图片" class="placeholder-img" />
          </div>
        </div>

        <!-- 悬浮操作按钮 -->
        <transition name="fade">
          <div v-if="hoveredCardId === scene.id" class="hover-actions">
            <el-tooltip content="评论" placement="bottom">
              <el-button circle size="small" @click.stop="handleComment(scene)">
                <svg-icon icon-class="fy-ping-lun" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="插入" placement="bottom">
              <el-button circle size="small" @click.stop="handleInsert(scene)">
                <svg-icon icon-class="fy-cha-ru" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="颜色" placement="bottom">
              <el-button circle size="small" @click.stop="handleColor(scene)">
                <svg-icon icon-class="fy-yan-se" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="bottom">
              <el-button circle size="small" @click.stop="handleDelete(scene)">
                <svg-icon icon-class="fy-shan-chu" />
              </el-button>
            </el-tooltip>
          </div>
        </transition>

        <!-- 镜号标签 -->
        <div class="card-number">
          <svg-icon icon-class="fy-jing-hao" class="icon" />
          <span>{{ String(scene.orderNo || 0).padStart(2, '0') }}</span>
          <!-- 状态下拉菜单 -->
          <el-dropdown trigger="click" @command="(status) => handleStatusChange(scene, status)" @click.stop>
            <el-icon class="status-dropdown">
              <ArrowDown />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="2">
                  <el-icon color="#67C23A">
                    <CircleCheck />
                  </el-icon>
                  通过
                </el-dropdown-item>
                <el-dropdown-item :command="1">
                  <el-icon color="#E6A23C">
                    <Warning />
                  </el-icon>
                  待修改
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 状态标签 -->
        <div v-if="scene.imgStatus && scene.imgStatus !== 0" class="status-badge" :class="`status-${scene.imgStatus}`">
          <el-icon v-if="scene.imgStatus === 2">
            <CircleCheck />
          </el-icon>
          <el-icon v-else-if="scene.imgStatus === 1">
            <Warning />
          </el-icon>
          <el-icon v-else-if="scene.imgStatus === 3">
            <CircleClose />
          </el-icon>
          <span>{{ getStatusText(scene.imgStatus) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { StoryBoardSceneVo } from '@/api/workbench/storyboard/types';
  import { ArrowDown, CircleCheck, CircleClose, Grid, Loading, Warning } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { ref } from 'vue';

  interface Props {
    scenes: StoryBoardSceneVo[];
    loading?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<{
    (e: 'pass', scene: StoryBoardSceneVo): void;
    (e: 'edit', scene: StoryBoardSceneVo): void;
    (e: 'imageClick', scene: StoryBoardSceneVo): void;
    (e: 'comment', scene: StoryBoardSceneVo): void;
    (e: 'insert', scene: StoryBoardSceneVo): void;
    (e: 'color', scene: StoryBoardSceneVo): void;
    (e: 'delete', scene: StoryBoardSceneVo): void;
    (e: 'statusChange', scene: StoryBoardSceneVo, status: number): void;
  }>();

  // 悬浮的卡片ID
  const hoveredCardId = ref<number | null>(null);

  // 卡片悬浮
  const handleCardHover = (scene: StoryBoardSceneVo) => {
    hoveredCardId.value = scene.id || null;
  };

  // 卡片离开
  const handleCardLeave = () => {
    hoveredCardId.value = null;
  };

  // 获取卡片样式类
  const getCardClass = (scene: StoryBoardSceneVo) => {
    const classes: string[] = [];
    if (hoveredCardId.value === scene.id) {
      classes.push('hovered');
    }
    return classes.join(' ');
  };

  // 获取状态文本
  // imgStatus: 0-白色(无状态) 1-橙色(待修改) 2-绿色(通过) 3-红色(拒绝)
  const getStatusText = (status?: number) => {
    switch (status) {
      case 1:
        return '待修改';
      case 2:
        return '通过';
      case 3:
        return '拒绝';
      default:
        return '';
    }
  };

  // 通过
  const handlePass = (scene: StoryBoardSceneVo) => {
    emit('pass', scene);
  };

  // 待修改
  const handleEdit = (scene: StoryBoardSceneVo) => {
    emit('edit', scene);
  };

  // 图片点击
  const handleImageClick = (scene: StoryBoardSceneVo) => {
    emit('imageClick', scene);
  };

  // 评论
  const handleComment = (scene: StoryBoardSceneVo) => {
    emit('comment', scene);
    ElMessage.info(`评论功能待实现 - 镜号 ${scene.orderNo}`);
  };

  // 插入
  const handleInsert = (scene: StoryBoardSceneVo) => {
    emit('insert', scene);
    ElMessage.info(`插入功能待实现 - 在镜号 ${scene.orderNo} 后插入`);
  };

  // 修改颜色
  const handleColor = (scene: StoryBoardSceneVo) => {
    emit('color', scene);
    ElMessage.info(`修改颜色功能待实现 - 镜号 ${scene.orderNo}`);
  };

  // 删除
  const handleDelete = (scene: StoryBoardSceneVo) => {
    emit('delete', scene);
    ElMessage.info(`删除功能待实现 - 镜号 ${scene.orderNo}`);
  };

  // 状态变更
  const handleStatusChange = (scene: StoryBoardSceneVo, status: number) => {
    emit('statusChange', scene, status);
    // 更新本地状态
    scene.imgStatus = status;
    const statusText = getStatusText(status);
    ElMessage.success(`已将镜号 ${scene.orderNo} 标记为${statusText}`);
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
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      width: 100%;
      height: 100%;
      padding: 20px;
      overflow-y: auto;

      // 响应式布局
      @media (max-width: 1920px) {
        grid-template-columns: repeat(5, 1fr);
      }

      @media (max-width: 1600px) {
        grid-template-columns: repeat(4, 1fr);
      }

      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: repeat(1, 1fr);
      }

      .grid-card {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        background: white;
        border: 1px solid #e4e7ed;
        box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);

          .hover-actions {
            opacity: 1;
          }
        }

        &.hovered {
          .hover-actions {
            opacity: 1;
          }
        }

        .card-number {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 13px;
          background: rgba(91, 72, 251, 0.95);
          color: white;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.5;

          .icon {
            width: 12px;
            height: 12px;
          }

          .status-dropdown {
            margin-left: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: transform 0.2s;

            &:hover {
              transform: rotate(180deg);
            }
          }
        }

        .status-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          backdrop-filter: blur(8px);
          line-height: 1.5;

          &.status-1 {
            background: rgba(230, 162, 60, 0.15);
            color: #e6a23c;
            border: 1px solid rgba(230, 162, 60, 0.3);
          }

          &.status-2 {
            background: rgba(103, 194, 58, 0.15);
            color: #67c23a;
            border: 1px solid rgba(103, 194, 58, 0.3);
          }

          &.status-3 {
            background: rgba(245, 108, 108, 0.15);
            color: #f56c6c;
            border: 1px solid rgba(245, 108, 108, 0.3);
          }

          .el-icon {
            font-size: 14px;
          }
        }

        .card-image {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding-bottom: 100%; // 1:1 比例
          background: #f5f7fa;

          .shot-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .image-placeholder {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;

            .placeholder-img {
              width: 60%;
              height: 60%;
              object-fit: contain;
              opacity: 0.5;
            }
          }
        }

        .hover-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s;

          .el-button {
            width: 28px;
            height: 28px;
            padding: 0;
            background: rgba(255, 255, 255, 0.95);
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            &:hover {
              background: white;
              transform: scale(1.05);
            }

            .svg-icon {
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
