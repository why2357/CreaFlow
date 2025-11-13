<template>
  <div class="scene-actions">
    <!-- 留言 -->
    <el-tooltip
      :content="commentTooltip"
      :placement="tooltipPlacement"
      :popper-options="popperOptions"
      :z-index="zIndex"
    >
      <el-button :size="buttonSize" @click.stop="handleComment">
        <svg-icon :icon-class="commentIcon" />
      </el-button>
    </el-tooltip>

    <!-- 插入镜头 -->
    <el-tooltip content="插入" :placement="tooltipPlacement" :popper-options="popperOptions" :z-index="zIndex">
      <el-button :size="buttonSize" @click.stop="handleInsert">
        <svg-icon :icon-class="insertIcon" />
      </el-button>
    </el-tooltip>

    <!-- 评审 -->
    <el-tooltip content="评审" :placement="tooltipPlacement" :popper-options="popperOptions" :z-index="zIndex">
      <el-button :size="buttonSize" @click.stop="handleReview">
        <svg-icon :icon-class="reviewIcon" />
      </el-button>
    </el-tooltip>

    <!-- 删除 -->
    <el-tooltip content="删除" :placement="tooltipPlacement" :popper-options="popperOptions" :z-index="zIndex">
      <el-button :size="buttonSize" @click.stop="handleDelete">
        <svg-icon :icon-class="deleteIcon" />
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    /** 按钮大小 */
    buttonSize?: 'small' | 'default' | 'large';
    /** 评论图标 */
    commentIcon?: string;
    /** 插入图标 */
    insertIcon?: string;
    /** 评审图标 */
    reviewIcon?: string;
    /** 删除图标 */
    deleteIcon?: string;
    /** 评论提示文本 */
    commentTooltip?: string;
    /** Tooltip 位置 */
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
    /** Popper 配置 */
    popperOptions?: any;
    /** z-index */
    zIndex?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    buttonSize: 'small',
    commentIcon: 'fy-ping-lun',
    insertIcon: 'fy-add-jing',
    reviewIcon: 'fy-yan-se',
    deleteIcon: 'fy-shan-chu',
    commentTooltip: '留言',
    tooltipPlacement: 'bottom',
    popperOptions: () => ({ strategy: 'fixed' }),
    zIndex: 2000
  });

  const emit = defineEmits<{
    (e: 'comment', event: MouseEvent): void;
    (e: 'insert'): void;
    (e: 'review', event: MouseEvent): void;
    (e: 'delete'): void;
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
</script>

<style scoped lang="scss">
  .scene-actions {
    display: flex;
    gap: 4px;

    .el-button {
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
</style>
