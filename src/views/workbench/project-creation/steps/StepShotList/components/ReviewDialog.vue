<template>
  <el-popover
    v-model:visible="popoverVisible"
    :virtual-ref="triggerRef"
    trigger="manual"
    virtual-triggering
    placement="bottom-start"
    :width="200"
    popper-class="review-popover"
    :offset="8"
  >
    <div class="review-content">
      <div class="review-header">
        <span class="review-title">评审</span>
      </div>
      <div class="review-options">
        <div class="review-option pass" @click="handleSelect(1)">
          <div class="option-icon green"></div>
          <div class="option-text">通过</div>
        </div>
        <div class="review-option reject" @click="handleSelect(2)">
          <div class="option-icon red"></div>
          <div class="option-text">待修改</div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
  import { reviewScene } from '@/api/workbench/storyboard';
  import { ElMessage } from 'element-plus';
  import { computed, ref } from 'vue';

  interface Props {
    modelValue: boolean;
    basicId: number;
    sceneType: number;
    currentStatus?: number; // 当前镜头状态 0-白色 1-橙色 2-绿色 3-红色
    triggerRef?: HTMLElement;
  }

  const props = withDefaults(defineProps<Props>(), {
    currentStatus: 0
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }>();

  const popoverVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  const triggerRef = computed(() => props.triggerRef);

  const loading = ref(false);

  const handleClose = () => {
    popoverVisible.value = false;
  };

  const handleSelect = async (reviewType: number) => {
    try {
      loading.value = true;
      await reviewScene({
        id: props.basicId,
        reviewType: reviewType,
        sceneType: props.sceneType
      });

      ElMessage.success(reviewType === 1 ? '通过成功' : '驳回成功');
      emit('success');
      handleClose();
    } catch (error) {
      console.error('评审失败:', error);
      ElMessage.error('评审失败，请重试');
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .review-content {
    padding: 0;

    .review-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e6eb;

      .review-title {
        font-size: 14px;
        font-weight: 500;
        color: #1d2129;
      }
    }

    .review-options {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .review-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        background: #fff;

        &:hover {
          background: #f7f8fa;
        }

        .option-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;

          &.orange {
            background: #ff9800;
          }

          &.green {
            background: #00b42a;
          }

          &.red {
            background: #f53f3f;
          }
        }

        .option-text {
          font-size: 14px;
          color: #4e5969;
          font-weight: 400;
        }
      }
    }
  }
</style>

<style lang="scss">
  .review-popover {
    padding: 0 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
  }
</style>
