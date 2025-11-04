<template>
  <el-dialog v-model="visible" title="重命名项目" width="340px" :close-on-click-modal="false" @close="handleClose">
    <el-input
      v-model="projectName"
      placeholder="请输入项目名称"
      maxlength="30"
      show-word-limit
      clearable
      autofocus
      @keyup.enter="handleConfirm"
    />
    <template #footer>
      <el-button class="footer-btn" @click="handleClose">取消</el-button>
      <el-button class="footer-btn" type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="RenameProject">
  import type { Project } from '@/api/workbench/project/types';
  import { ElMessage } from 'element-plus';
  import { ref } from 'vue';

  const emit = defineEmits(['confirm']);
  // 状态
  const visible = ref(false);
  const projectName = ref('');
  const currentProjectId = ref<string | number>('');

  // 打开对话框
  const open = (project: Project) => {
    currentProjectId.value = project.projectId;
    projectName.value = project.projectName || '';
    visible.value = true;
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
    projectName.value = '';
    currentProjectId.value = '';
  };

  // 确认重命名
  const handleConfirm = () => {
    if (!projectName.value.trim()) {
      ElMessage.warning('项目名称不能为空');
      return;
    }

    emit('confirm', currentProjectId.value, projectName.value);
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
</style>
