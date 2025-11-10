<template>
  <div class="shot-number-actions">
    <!-- 小圆点 -->
    <div class="action-dot">
      <!-- 留言徽标 -->
      <el-badge v-if="commentCount > 0" :value="commentCount" class="comment-badge" @click.stop="handleViewComments">
        <div class="dot-inner"></div>
      </el-badge>
      <div v-else class="dot-inner"></div>
    </div>

    <!-- 功能菜单 -->
    <div class="action-menu">
      <el-tooltip content="留言" placement="top" :popper-options="{ strategy: 'fixed' }" :z-index="99999">
        <div class="action-item" @click="handleComment">
          <svg-icon icon-class="fy-ping-lun" class="action-icon" />
        </div>
      </el-tooltip>
      <el-tooltip content="插入镜头" placement="top" :popper-options="{ strategy: 'fixed' }" :z-index="99999">
        <div class="action-item" @click="handleInsert">
          <svg-icon icon-class="fy-add-jing" class="action-icon" />
        </div>
      </el-tooltip>
      <el-tooltip content="评审" placement="top" :popper-options="{ strategy: 'fixed' }" :z-index="99999">
        <div class="action-item" @click="handleReview">
          <svg-icon icon-class="fy-yan-se" class="action-icon" />
        </div>
      </el-tooltip>
      <el-tooltip content="删除当前镜头" placement="top" :popper-options="{ strategy: 'fixed' }" :z-index="99999">
        <div class="action-item delete" @click="handleDelete">
          <svg-icon icon-class="fy-shan-chu" class="action-icon" />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    shotNumber: number;
    commentCount?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    commentCount: 0
  });

  const emit = defineEmits<{
    (e: 'comment', event: MouseEvent): void;
    (e: 'insert'): void;
    (e: 'review', event: MouseEvent): void;
    (e: 'delete'): void;
    (e: 'viewComments'): void;
  }>();

  const handleComment = (event: MouseEvent) => {
    emit('comment', event);
  };

  const handleInsert = () => {
    emit('insert');
  };

  const handleReview = (event: MouseEvent) => {
    emit('review', event);
  };

  const handleDelete = () => {
    emit('delete');
  };

  const handleViewComments = () => {
    emit('viewComments');
  };
</script>

<style scoped lang="scss">
  .shot-number-actions {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;

    .action-dot {
      position: relative;
      cursor: pointer;
      transition: all 0.3s;
      z-index: 1;

      .comment-badge {
        :deep(.el-badge__content) {
          background-color: #5468ff;
          border: none;
          font-size: 10px;
          height: 16px;
          line-height: 16px;
          padding: 0 5px;
          cursor: pointer;
        }
      }

      .dot-inner {
        width: 10px;
        height: 10px;
        background-color: #c9cdd4;
        border-radius: 50%;
        transition: all 0.3s;
      }
    }

    .action-menu {
      position: absolute;
      left: 60px;
      bottom: calc(100% + 16px);
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
      padding: 8px;
      border-radius: 8px;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      white-space: nowrap;

      .action-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        transition: all 0.3s;

        .action-icon {
          font-size: 14px;
          color: #4e5969;
        }

        &:hover {
          background: #e8f3ff;

          .action-icon {
            color: #5468ff;
          }
        }

        &.delete:hover {
          background: #ffece8;

          .action-icon {
            color: #f53f3f;
          }
        }
      }
    }
  }
</style>
