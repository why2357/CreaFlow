<template>
  <el-dialog v-model="visible" title="限制积分" width="480px" :close-on-click-modal="false" @close="handleClose">
    <el-form ref="formRef" :model="formData" label-width="60px" label-position="left">
      <el-form-item label="数额">
        <el-input
          v-model.number="formData.limitPoints"
          placeholder="请输入限制后的积分数"
          clearable
          type="number"
          :min="0"
          @keyup.enter="handleConfirm"
        >
          <template #suffix>
            <span style="color: #909399; font-size: 12px">积分</span>
          </template>
        </el-input>
        <div v-if="currentProject" style="margin-top: 8px; font-size: 12px; color: #909399">
          提示：输入空值将取消积分限制，设为0时项目内所有人员无法使用模型
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="footer-btn" @click="handleClose">取 消</el-button>
      <el-button class="footer-btn" type="primary" @click="handleConfirm">确 认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="LimitPointsDialog">
  import type { Project } from '@/api/workbench/project/types';
  import { reactive, ref } from 'vue';

  const emit = defineEmits(['confirm']);

  // 状态
  const visible = ref(false);
  const currentProject = ref<Project | null>(null);
  const formRef = ref();
  const formData = reactive({
    limitPoints: undefined as number | undefined
  });

  // 打开对话框
  const open = (project: Project) => {
    currentProject.value = project;
    // 如果项目已有限制积分，显示当前值
    formData.limitPoints = project.limitPoints || undefined;
    visible.value = true;
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
    formData.limitPoints = undefined;
    currentProject.value = null;
  };

  // 确认限制积分
  const handleConfirm = () => {
    if (!currentProject.value) {
      return;
    }

    // 如果输入为空，则传null取消限制；如果为0，表示禁止使用模型；否则传实际值
    const limitPoints =
      formData.limitPoints !== undefined && formData.limitPoints !== null ? formData.limitPoints : null;

    emit('confirm', currentProject.value.projectId, limitPoints);
    handleClose();
  };

  // 暴露方法给父组件
  defineExpose({
    open
  });
</script>

<style scoped lang="scss">
  .footer-btn {
    min-width: 80px;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
</style>
