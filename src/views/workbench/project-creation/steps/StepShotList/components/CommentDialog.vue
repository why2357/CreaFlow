<template>
  <el-popover
    v-model:visible="popoverVisible"
    :virtual-ref="triggerRef"
    trigger="manual"
    virtual-triggering
    placement="bottom-start"
    :width="300"
    popper-class="comment-popover"
    :offset="8"
  >
    <div class="comment-content">
      <div class="comment-header">
        <span class="comment-title">留言</span>
        <el-icon class="close-icon" @click="handleClose"><Close /></el-icon>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入内容..."
            maxlength="300"
            show-word-limit
            autofocus
            resize="none"
          />
        </el-form-item>
      </el-form>
      <div class="comment-footer">
        <el-button size="small" :loading="loading" type="primary" @click="handleSubmit">提交</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
  import { addSceneComment } from '@/api/workbench/storyboard';
  import { Close } from '@element-plus/icons-vue';
  import type { FormInstance, FormRules } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { computed, reactive, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    basicId: number;
    sceneType: number;
    triggerRef?: HTMLElement;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }>();

  const popoverVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  const triggerRef = computed(() => props.triggerRef);

  const formRef = ref<FormInstance>();
  const loading = ref(false);

  const form = reactive({
    comment: ''
  });

  const rules: FormRules = {
    comment: [{ required: true, message: '请输入留言内容', trigger: 'blur' }]
  };

  // 监听popover打开，重置表单
  watch(popoverVisible, (newVal) => {
    if (newVal) {
      form.comment = '';
      formRef.value?.clearValidate();
    }
  });

  const handleClose = () => {
    popoverVisible.value = false;
  };

  const handleSubmit = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
      if (!valid) return;

      try {
        loading.value = true;
        await addSceneComment({
          basicId: props.basicId,
          comment: form.comment,
          sceneType: props.sceneType
        });

        ElMessage.success('留言成功');
        emit('success');
        handleClose();
      } catch (error) {
        console.error('留言失败:', error);
      } finally {
        loading.value = false;
      }
    });
  };
</script>

<style scoped lang="scss">
  .comment-content {
    padding: 20px;

    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .comment-title {
        font-size: 14px;
        font-weight: 500;
        color: #1d2129;
      }

      .close-icon {
        cursor: pointer;
        color: #86909c;
        font-size: 14px;
        transition: color 0.2s;

        &:hover {
          color: #1d2129;
        }
      }
    }

    :deep(.el-form) {
      padding-bottom: 0;
      margin-top: 12px;
    }

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-textarea__inner) {
      font-size: 14px;
      line-height: 1.6;
      border-radius: 6px;
      border-color: none !important;
      border-radius: 8px;
      background: var(--text-color-text-5, #f3f3f5);

      &:focus {
        border-color: #5468ff;
      }

      &::placeholder {
        color: #c9cdd4;
      }
    }

    :deep(.el-input__count) {
      background: transparent;
      color: #86909c;
      font-size: 12px;
    }

    .comment-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;

      .el-button {
        padding: 6px 16px;
        font-size: 13px;
        border-radius: 8px;
        width: 80px;
        height: 32px;

        &.el-button--primary {
          background-color: #5468ff;
          border-color: #5468ff;

          &:hover {
            background-color: #3d52ff;
            border-color: #3d52ff;
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  .comment-popover {
    padding: 0 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
  }
</style>
