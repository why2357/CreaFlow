<template>
  <el-dialog v-model="visible" title="开通新租户" width="400px" @close="handleClose">
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <el-form-item label="公司名称" prop="tenantName">
        <el-input v-model="formData.tenantName" placeholder="请输入公司名称" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="管理员手机号" prop="phoneNumber">
        <el-input v-model="formData.phoneNumber" placeholder="请输入11位手机号" maxlength="11" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { addTenant } from '@/api/system/tenant-admin/index';
  import type { TenantAddBo } from '@/api/system/tenant-admin/types';
  import { ElMessage, FormInstance, FormRules } from 'element-plus';
  import { reactive, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
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

  const formData = reactive<TenantAddBo>({
    tenantName: '',
    phoneNumber: ''
  });

  // 表单验证规则
  const rules: FormRules = {
    tenantName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
    phoneNumber: [
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
        formData.tenantName = '';
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

  // 确认创建
  const handleConfirm = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
      if (!valid) return;

      try {
        loading.value = true;
        await addTenant(formData);
        ElMessage.success('租户创建成功');
        visible.value = false;
        emit('success');
      } catch (error) {
        console.error('创建租户失败:', error);
      } finally {
        loading.value = false;
      }
    });
  };
</script>
