<template>
  <div class="shot-number-actions">
    <!-- 小圆点 -->
    <div class="action-dot" :class="{ disabled: !canApproveScene }" @click.stop="handleDotClick">
      <div class="dot-inner" :class="getDotColorClass()"></div>
    </div>

    <!-- 功能菜单 - 使用统一的 SceneActions 组件 -->
    <div class="action-menu">
      <SceneActions
        button-size="default"
        tooltip-placement="top"
        :popper-options="{ strategy: 'fixed' }"
        :z-index="99999"
        @comment="handleComment"
        @insert="handleInsert"
        @review="handleReview"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import SceneActions from '../../components/SceneActions.vue';
  import { computed } from 'vue';
  import { hasProjectPermission } from '@/utils/projectPermission';

  interface Props {
    shotNumber: number;
    sceneStatus?: number; // 图片状态 0-未判定(灰色) 1-橙色 2-绿色 3-红色
  }

  const props = withDefaults(defineProps<Props>(), {
    sceneStatus: 0
  });

  const emit = defineEmits<{
    (e: 'comment', event: MouseEvent): void;
    (e: 'insert'): void;
    (e: 'review', event: MouseEvent): void;
    (e: 'delete'): void;
    (e: 'viewComments'): void;
  }>();

  // 权限检查
  const canApproveScene = computed(() => hasProjectPermission(['scene-approval']));

  // 根据状态获取小圆点颜色类名
  const getDotColorClass = () => {
    switch (props.sceneStatus) {
      case 1:
        return 'status-orange'; // 橙色
      case 2:
        return 'status-green'; // 绿色
      case 3:
        return 'status-red'; // 红色
      case 0:
      default:
        return 'status-gray'; // 未判定(灰色)
    }
  };

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

  // 点击小圆点触发评审
  const handleDotClick = (event: MouseEvent) => {
    // 检查权限，没有权限则不触发事件
    if (!canApproveScene.value) {
      return;
    }
    emit('review', event);
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
      padding: 2px;

      &:hover:not(.disabled) {
        .dot-inner {
          transform: scale(1.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      }

      &:active:not(.disabled) {
        .dot-inner {
          transform: scale(1.1);
        }
      }

      &.disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .dot-inner {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        transition: all 0.3s;

        // 状态颜色
        &.status-gray {
          background-color: #c9cdd4; // 未判定
        }

        &.status-orange {
          background-color: #ff7d00; // 橙色
        }

        &.status-green {
          background-color: #23c343; // 绿色
        }

        &.status-red {
          background-color: #f53f3f; // 红色
        }
      }
    }

    .action-menu {
      position: absolute;
      left: 60px;
      bottom: calc(100% + 16px);
      transform: translateX(-50%);
      padding: 8px;
      border-radius: 8px;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      white-space: nowrap;

      // 使用 SceneActions 组件后，样式已在组件内部定义
      // 这里只需要定位和显示控制
      :deep(.scene-actions) {
        gap: 4px;

        .el-button {
          width: 32px;
          height: 32px;
          padding: 0;
          border-radius: 6px;
          background: #fff;
          border: none;
          box-shadow: none;

          &:hover {
            background: #e8f3ff;

            .svg-icon {
              color: #5468ff;
            }
          }

          .svg-icon {
            font-size: 14px;
            color: #4e5969;
          }
        }
      }
    }
  }
</style>
