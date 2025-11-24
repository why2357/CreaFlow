<template>
  <el-popover
    v-model:visible="popoverVisible"
    :virtual-ref="triggerRef"
    trigger="manual"
    virtual-triggering
    placement="bottom-start"
    :width="96"
    popper-class="review-popover"
    :offset="8"
  >
    <div class="review-content">
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
    (e: 'success', reviewType: number): void;
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
      emit('success', reviewType);
      handleClose();
    } catch (error) {
      console.error('评审失败:', error);
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .review-content {
    padding: 0;
    width: 100%;

    .review-options {
      padding: 6px;
      display: flex;
      flex-direction: column;
      width: 100%;

      .review-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        background: #fff;

        &:hover {
          background: #f7f8fa;
        }

        .option-icon {
          width: 12px;
          height: 12px;
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
          color: #1d2129;
          font-weight: 400;
          white-space: nowrap;
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
    min-width: 96px !important;
    width: 96px !important;
  }
</style>
