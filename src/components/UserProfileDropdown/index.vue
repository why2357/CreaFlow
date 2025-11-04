<template>
  <el-popover
    placement="bottom-end"
    :width="300"
    trigger="click"
    popper-class="user-profile-popover"
    :show-arrow="false"
  >
    <template #reference>
      <slot name="trigger">
        <div class="avatar-wrapper">
          <img :src="userStore.avatar" class="user-avatar" />
        </div>
      </slot>
    </template>

    <template #default>
      <div class="user-profile-content">
        <!-- 查看模式 -->
        <div v-if="!isEditing" class="view-mode">
          <div class="profile-item">
            <svg-icon icon-class="fy-user" class="item-icon" />
            <span class="item-label">用户名</span>
          </div>
          <div class="profile-value">{{ userProfile.nickName || '未设置' }}</div>

          <div class="profile-item">
            <svg-icon icon-class="fy-dept" class="item-icon" />
            <span class="item-label">部门</span>
          </div>
          <div class="profile-value">{{ userProfile.deptDesc || '未设置' }}</div>

          <el-button type="primary" class="edit-btn" @click="handleEdit">
            <svg-icon icon-class="fy-edit" style="margin-right: 16px; font-size: 16px" />
            编辑信息
          </el-button>
          <div style="border-top: 1px solid #eee">
            <el-button text class="logout-btn" @click="handleLogout">
              <svg-icon icon-class="fy-logout" style="margin-right: 12px; font-size: 18px" />
              退出登录
            </el-button>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="edit-mode">
          <div class="profile-item">
            <svg-icon icon-class="fy-user" class="item-icon" />
            <span class="item-label">用户名</span>
          </div>
          <el-form :model="editForm" :rules="rules" ref="formRef">
            <el-form-item prop="nickName">
              <el-input v-model="editForm.nickName" placeholder="请输入用户名" maxlength="30" />
            </el-form-item>

            <div class="profile-item">
              <svg-icon icon-class="fy-dept" class="item-icon" />
              <span class="item-label">部门</span>
            </div>
            <el-form-item prop="deptDesc">
              <el-input v-model="editForm.deptDesc" placeholder="请输入部门" maxlength="30" />
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleConfirm" :loading="loading">确认</el-button>
          </div>
          <div style="border-top: 1px solid #eee">
            <el-button text class="logout-btn" @click="handleLogout">
              <svg-icon icon-class="fy-logout" style="margin-right: 12px; font-size: 18px" />
              退出登录
            </el-button>
          </div>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
  import { getUserCenterProfile, updateUserCenterProfile } from '@/api/system/userCenter';
  import { UserProfileUpdateForm, UserProfileVO } from '@/api/system/userCenter/types';
  import useUserStore from '@/store/modules/user';
  import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
  import { onMounted, reactive, ref } from 'vue';

  const userStore = useUserStore();
  const formRef = ref<FormInstance>();
  const isEditing = ref(false);
  const loading = ref(false);

  const userProfile = reactive<UserProfileVO>({
    nickName: '',
    deptDesc: ''
  });

  const editForm = reactive<UserProfileUpdateForm>({
    nickName: '',
    deptDesc: ''
  });

  const rules = reactive<FormRules>({
    nickName: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 30, message: '用户昵称长度必须在2到30个字符之间', trigger: 'blur' }
    ],
    deptDesc: [{ max: 30, message: '部门描述长度不能超过30个字符', trigger: 'blur' }]
  });

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const res = await getUserCenterProfile();
      if (res.data) {
        Object.assign(userProfile, res.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 进入编辑模式
  const handleEdit = () => {
    editForm.nickName = userProfile.nickName;
    editForm.deptDesc = userProfile.deptDesc;
    isEditing.value = true;
  };

  // 取消编辑
  const handleCancel = () => {
    isEditing.value = false;
    formRef.value?.resetFields();
  };

  // 确认修改
  const handleConfirm = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
      if (valid) {
        // 检查是否至少修改了一个字段
        const hasChanges = editForm.nickName !== userProfile.nickName || editForm.deptDesc !== userProfile.deptDesc;

        if (!hasChanges) {
          // 无修改时直接退出编辑模式，不提示
          isEditing.value = false;
          return;
        }

        try {
          loading.value = true;

          // 构建请求数据,只发送修改过的字段
          const updateData: UserProfileUpdateForm = {};
          if (editForm.nickName !== userProfile.nickName) {
            updateData.nickName = editForm.nickName;
          }
          if (editForm.deptDesc !== userProfile.deptDesc) {
            updateData.deptDesc = editForm.deptDesc;
          }

          const res = await updateUserCenterProfile(updateData);

          if (res.code === 200) {
            ElMessage.success('修改成功');
            // 更新本地数据
            Object.assign(userProfile, editForm);
            isEditing.value = false;
          } else {
            ElMessage.error(res.msg || '修改失败');
          }
        } catch (error: any) {
          console.error('修改用户信息失败:', error);

          // 处理错误信息
          if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const errorMsg = error.response.data.errors.join('\n');
            ElMessage.error(errorMsg);
          } else if (error.response?.data?.msg) {
            ElMessage.error(error.response.data.msg);
          } else {
            ElMessage.error('修改失败,请稍后重试');
          }
        } finally {
          loading.value = false;
        }
      }
    });
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await userStore.logout();
      location.href = import.meta.env.VITE_APP_CONTEXT_PATH + 'index';
    } catch (error) {
      // 用户取消操作
    }
  };

  onMounted(() => {
    fetchUserProfile();
  });

  // 暴露方法供外部调用
  defineExpose({
    refresh: fetchUserProfile
  });
</script>

<style lang="scss" scoped>
  .avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgb(82 82 255 / 8%);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .user-profile-content {
    .view-mode,
    .edit-mode {
      .profile-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        .item-icon {
          font-size: 16px;
          color: #909399;
          margin-right: 8px;
        }

        .item-label {
          color: #909399;
          font-size: 14px;
        }
      }

      .profile-value {
        color: #1d2129;
        font-size: 14px;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .edit-btn {
        width: 100%;
        margin-bottom: 12px;
        border-radius: 8px;
      }

      .logout-btn {
        width: 100%;
        color: #f56c6c;
        border-radius: 8px;
        margin-top: 12px;

        &:hover {
          color: #f56c6c;
          background-color: #fef0f0;
        }
      }
    }

    .edit-mode {
      :deep(.el-form) {
        margin-bottom: 0;
      }

      :deep(.el-form-item) {
        margin-bottom: 16px;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;

        .el-button {
          flex: 1;
          border-radius: 8px;
        }
      }
    }
  }
</style>

<style lang="scss">
  .user-profile-popover {
    padding: 16px !important;
    border-radius: 12px !important;
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%) !important;
  }
</style>
