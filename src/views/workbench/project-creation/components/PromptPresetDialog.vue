<template>
  <el-dialog v-model="dialogVisible" title="" width="600px" :close-on-click-modal="false" class="prompt-preset-dialog">
    <el-input v-model="promptText" type="textarea" :rows="15" placeholder="请输入提示词内容" class="prompt-textarea" />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { DEFAULT_PROMPT } from './promptPresetConstants';

  interface Props {
    modelValue: boolean;
    defaultPrompt?: string;
    currentPrompt?: string;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', prompt: string): void;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<Emits>();

  // 对话框可见性
  const dialogVisible = ref(false);

  // 提示词文本
  const promptText = ref(props.defaultPrompt || DEFAULT_PROMPT);

  // 监听外部 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
      if (val) {
        // 打开对话框时使用当前预设文案（如果有），否则使用默认文本
        promptText.value = props.currentPrompt || props.defaultPrompt || DEFAULT_PROMPT;
      }
    },
    { immediate: true }
  );

  // 监听内部 dialogVisible 变化
  watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
  });

  // 取消
  const handleCancel = () => {
    dialogVisible.value = false;
  };

  // 确认
  const handleConfirm = () => {
    emit('confirm', promptText.value);
    dialogVisible.value = false;
  };
</script>

<style scoped lang="scss">
  .prompt-preset-dialog {
    :deep(.el-dialog__header) {
      padding: 20px 20px 16px;
      border-bottom: 1px solid #e5e6eb;
    }

    :deep(.el-dialog__title) {
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
    }

    :deep(.el-dialog__body) {
      padding: 20px;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 20px 20px;
      border-top: 1px solid #e5e6eb;
    }

    .prompt-textarea {
      :deep(.el-textarea__inner) {
        font-family: inherit;
        line-height: 1.8;
        font-size: 14px;
        color: #1d2129;
        border-radius: 8px;
        border: 1px solid #e5e6eb;
        background: #f7f8fa;

        &:focus {
          border-color: #5252ff;
          background: #fff;
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      :deep(.el-button) {
        min-width: 80px;
        height: 36px;
        border-radius: 6px;

        &.el-button--primary {
          background: #5252ff;
          border-color: #5252ff;

          &:hover {
            background: #7375ff;
            border-color: #7375ff;
          }
        }
      }
    }
  }
</style>
