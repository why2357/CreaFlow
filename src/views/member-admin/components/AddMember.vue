<template>
  <el-dialog v-model="visible" title="新增用户" width="500px" append-to-body @close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="手机号" prop="phoneNumber">
        <el-input v-model="form.phoneNumber" placeholder="请输入手机号" maxlength="11" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { ElMessage, FormInstance, FormRules } from 'element-plus';
  import { addMember } from '@/api/system/user';
  import { MemberAddBo } from '@/api/system/user/types';

  const emit = defineEmits(['success']);

  const visible = ref(false);
  const loading = ref(false);
  const formRef = ref<FormInstance>();

  const form = reactive<MemberAddBo>({
    phoneNumber: ''
  });

  // 手机号验证规则
  const validatePhone = (rule: any, value: any, callback: any) => {
    if (!value) {
      callback(new Error('请输入手机号'));
    } else if (!/^1[3-9]\d{9}$/.test(value)) {
      callback(new Error('请输入正确的手机号格式'));
    } else {
      callback();
    }
  };

  const rules: FormRules = {
    phoneNumber: [{ required: true, validator: validatePhone, trigger: 'blur' }]
  };

  // 打开弹窗
  const open = () => {
    visible.value = true;
    resetForm();
  };

  // 关闭弹窗
  const handleClose = () => {
    visible.value = false;
    resetForm();
  };

  // 重置表单
  const resetForm = () => {
    form.phoneNumber = '';
    formRef.value?.clearValidate();
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true;
        try {
          await addMember(form);
          ElMessage.success('新增成功');
          visible.value = false;
          emit('success');
        } catch (error) {
          console.error('新增成员失败:', error);
        } finally {
          loading.value = false;
        }
      }
    });
  };

  // 暴露方法给父组件
  defineExpose({
    open
  });
</script>

<style scoped lang="scss">
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
