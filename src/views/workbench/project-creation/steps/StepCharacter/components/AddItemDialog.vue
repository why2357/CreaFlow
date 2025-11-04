<template>
  <el-dialog v-model="dialogVisible" :title="title" width="400px" :close-on-click-modal="false" @closed="handleClosed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" @submit.prevent="handleSubmit">
      <el-form-item :label="label" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="placeholder"
          maxlength="15"
          show-word-limit
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus';
  import { computed, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    loading?: boolean;
    title?: string;
    label?: string;
    placeholder?: string;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', name: string): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    title: '新增',
    label: '名称',
    placeholder: '请输入名称'
  });

  const emit = defineEmits<Emits>();

  const formRef = ref<FormInstance>();
  const dialogVisible = ref(false);
  const form = ref({
    name: ''
  });

  // 表单验证规则
  const rules = computed<FormRules>(() => ({
    name: [
      { required: true, message: `请输入${props.label}`, trigger: 'blur' },
      { min: 1, max: 15, message: `${props.label}长度在 1 到 15 个字符`, trigger: 'blur' }
    ]
  }));

  // 监听外部 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
    },
    { immediate: true }
  );

  // 监听内部 dialogVisible 变化
  watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
  });

  // 处理提交
  const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();
      emit('confirm', form.value.name.trim());
    } catch (error) {
      console.log('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    dialogVisible.value = false;
  };

  // 对话框关闭后重置表单
  const handleClosed = () => {
    form.value.name = '';
    formRef.value?.resetFields();
  };
</script>

<style scoped lang="scss">
  // 如果需要自定义样式可以在这里添加
</style>
