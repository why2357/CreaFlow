<template>
  <el-dialog v-model="visible" title="视频多选完成" width="340px" :close-on-click-modal="false" @close="handleClose">
    <div class="points-confirm-content">
      <p class="confirm-text">
        目前共计{{ videoCount }}个镜头，点击"确认"帮您生成全部视频，预计消耗
        <span class="highlight">{{ totalPoints }}</span> 积分。
      </p>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    videoCount: number; // 视频数量
    totalPoints: number; // 总消耗积分
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm'): void;
  }>();

  const visible = ref(false);

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };

  // 确认
  const handleConfirm = () => {
    emit('confirm');
    visible.value = false;
  };
</script>

<style scoped lang="scss">
  .points-confirm-content {
    .confirm-text {
      color: #4e5969;
      font-size: 13px;
      line-height: 18px;

      .highlight {
        color: #ff7d00;
        font-weight: 600;
        font-size: 13px;
      }
    }
  }
</style>
