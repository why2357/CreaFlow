<template>
  <el-dialog v-model="visible" title="添加管理员" width="360px" @close="handleClose">
    <el-form ref="formRef" :model="formData" :rules="rules">
      <el-form-item prop="phoneNumber">
        <el-input v-model="formData.phoneNumber" placeholder="请输入11位手机号" maxlength="11" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">添加</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { addPM } from '@/api/system/tenant-admin/index';
  import type { TenantAddPMBo } from '@/api/system/tenant-admin/types';
  import { ElMessage, FormInstance, FormRules } from 'element-plus';
  import { reactive, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    tenantId?: number;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const visible = ref(false);

  const formData = reactive({
    phoneNumber: ''
  });

  // 表单验证规则
  const rules: FormRules = {
    phoneNumber: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号',
        trigger: 'blur'
      }
    ]
  };

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        // 重置表单
        formData.phoneNumber = '';
        formRef.value?.clearValidate();
      }
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

  // 确认添加
  const handleConfirm = async () => {
    if (!formRef.value) return;
    if (!props.tenantId) {
      ElMessage.error('未选择租户');
      return;
    }

    await formRef.value.validate(async (valid) => {
      if (!valid) return;

      try {
        loading.value = true;
        const params: TenantAddPMBo = {
          id: props.tenantId || 0,
          phoneNumber: formData.phoneNumber
        };
        await addPM(params);
        ElMessage.success('管理员添加成功');
        visible.value = false;
        emit('success');
      } catch (error) {
        console.error('添加管理员失败:', error);
      } finally {
        loading.value = false;
      }
    });
  };
</script>
