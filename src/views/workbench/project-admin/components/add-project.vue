<template>
  <el-dialog
    title="新建项目"
    :model-value="dialogVisible"
    width="760px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="top">
      <el-form-item label="项目名称" prop="projectName">
        <el-input v-model="form.projectName" maxlength="30" placeholder="请输入项目名称" clearable show-word-limit />
      </el-form-item>

      <el-form-item label="成员管理">
        <div class="members-section">
          <!-- 成员标签和按钮统一区域 -->
          <div class="members-container">
            <!-- 添加协作者按钮 -->
            <el-popover
              v-model:visible="showDropdown"
              placement="bottom-start"
              :width="400"
              trigger="manual"
              popper-class="invite-member-popover"
            >
              <template #reference>
                <div class="add-member-btn" @click="showDropdown = !showDropdown">
                  <!-- <el-icon><UserFilled /></el-icon> -->
                  <svg-icon icon-class="add-member" />
                  <span>添加协作者</span>
                </div>
              </template>

              <!-- Popover 内容 -->
              <InviteMember
                :selected-members="form.members"
                @select="handleAddMember"
                @remove="handleRemoveMember"
                @close="showDropdown = false"
              />
            </el-popover>

            <!-- 已选成员标签列表 -->
            <div v-for="m in form.members" :key="m.userId" class="member-tag">
              <div class="member-avatar" :style="{ backgroundColor: getRoleColor(m.roleKey) }">
                {{ m.nickName?.charAt(0) || 'U' }}
              </div>
              <span class="member-name">{{ m.nickName }}</span>
              <span
                class="member-role"
                :style="{
                  borderColor: getRoleColor(m.roleKey) + '40',
                  backgroundColor: getRoleColor(m.roleKey) + '15',
                  color: getRoleColor(m.roleKey)
                }"
              >
                {{ getRoleName(m.roleKey) }}
              </span>
              <span class="member-close" @click="handleRemoveMember(m.userId)">
                <el-icon><Close /></el-icon>
              </span>
            </div>
          </div>

          <!-- 提示文案 -->
          <p class="members-tip" v-if="form.members.length == 0">如需多人协作，请添加成员并分配角色</p>
        </div>
      </el-form-item>

      <el-form-item label="画布尺寸" prop="pictureRatio">
        <div class="size-options">
          <div
            v-for="item in sizeOptions"
            :key="item.value"
            class="size-item"
            :class="{ active: form.pictureRatio === item.value }"
            @click="form.pictureRatio = item.value"
          >
            <div class="ratio-item">
              <div
                class="ratio-box"
                :style="{
                  width: item.boxWidth + 'px',
                  height: item.boxHeight + 'px'
                }"
              ></div>
            </div>
            <span class="label">{{ item.label }}</span>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="footer-btn" @click="handleClose">取消</el-button>
        <el-button class="footer-btn" type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="AddProject">
  import type { ProjectCreateRequest, ProjectMember, TeamUserInfo } from '@/api/workbench/project/types';
  import { sizeToRatio } from '@/utils/projectUtils';
  import { getRoleColor, getRoleName } from '@/utils/roleUtils';
  import { Close } from '@element-plus/icons-vue';
  import { type FormInstance, type FormRules } from 'element-plus';
  import { reactive, ref } from 'vue';
  import InviteMember from './invite-member.vue';

  // ------- emits --------
  const emits = defineEmits(['confirm']);

  // ------- refs --------
  const dialogVisible = ref(false);
  const showDropdown = ref(false);
  const formRef = ref<FormInstance>();

  // 可选尺寸配置（比例与展示宽高）
  const sizeOptions = [
    { label: '16:9', value: '16:9', boxWidth: 37, boxHeight: 22 },
    { label: '4:3', value: '4:3', boxWidth: 26, boxHeight: 20 },
    { label: '1:1', value: '1:1', boxWidth: 18, boxHeight: 18 },
    { label: '3:4', value: '3:4', boxWidth: 18, boxHeight: 24 },
    { label: '9:16', value: '9:16', boxWidth: 22, boxHeight: 32 }
  ];

  // ------- 表单数据 --------
  const form = reactive({
    projectName: '',
    pictureRatio: '16:9',
    members: [] as ProjectMember[]
  });

  // ------- 校验规则 --------
  const rules = reactive<FormRules>({
    projectName: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { max: 30, message: '项目名称不能超过30个字符', trigger: 'blur' }
    ],
    pictureRatio: [{ required: true, message: '请选择画布尺寸', trigger: 'change' }]
  });

  // ------- 成员添加 --------
  const handleAddMember = (member: ProjectMember) => {
    const existing = form.members.find((m) => m.userId === member.userId);
    if (existing) {
      existing.roleId = member.roleId;
      existing.roleKey = member.roleKey;
    } else {
      form.members.push(member);
    }
  };

  // ------- 成员移除 --------
  const handleRemoveMember = (memberId?: string | number) => {
    if (!memberId) return;
    const index = form.members.findIndex((m) => m.userId === memberId);
    if (index > -1) {
      form.members.splice(index, 1);
    }
  };

  // ------- 表单提交 --------
  const handleConfirm = () => {
    formRef.value?.validate((valid) => {
      if (!valid) return;

      // 转换为后端接口格式
      const projectData: ProjectCreateRequest = {
        projectName: form.projectName,
        pictureRatio: sizeToRatio(form.pictureRatio),
        teamUserInfoList: form.members
          .filter((member) => member.userId && member.roleId)
          .map(
            (member): TeamUserInfo => ({
              userId: Number(member.userId),
              roleId: Number(member.roleId)
            })
          )
      };

      emits('confirm', projectData);
      handleClose();
    });
  };

  // ------- 弹窗控制 --------
  const open = () => {
    dialogVisible.value = true;
  };

  const handleClose = () => {
    dialogVisible.value = false;
    showDropdown.value = false;
    formRef.value?.resetFields();
    form.members = [];
  };

  defineExpose({ open });
</script>

<style scoped lang="scss">
  // 成员管理区域
  .members-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    height: 120px;
    padding: 18px 20px;
    border: 1px solid #eeeeee;
    border-radius: 8px;
    background: #ffffff;
    // 成员容器：按钮和标签在同一行，支持换行和滚动
    .members-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      max-height: 200px;
      padding: 4px 0;
      overflow-y: auto;

      // 隐藏滚动条但保留滚动功能
      scrollbar-width: none; // Firefox
      -ms-overflow-style: none; // IE 10+

      &::-webkit-scrollbar {
        display: none; // Chrome, Safari, Edge
      }

      // 添加成员按钮
      .add-member-btn {
        display: flex;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
        gap: 6px;
        width: 180px;
        height: 36px;
        padding: 6px 12px;
        border: 1.5px solid #d6d7ff;
        border-radius: 8px;
        background: white;
        background: #ffffff;
        color: #5252ff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;

        .el-icon {
          font-size: 16px;
        }

        &:hover {
          border-color: #5252ff;
          background: #f5f5ff;
          box-shadow: 0 2px 8px rgb(82 82 255 / 15%);
        }
      }

      .member-tag {
        display: flex;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: 180px;
        height: 36px;
        padding: 0 0 0 12px;
        border: 1px solid #eeeeee;
        border-radius: 8px;
        background: #ffffff;
        font-size: 13px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 8px rgb(0 0 0 / 8%);

          .member-close {
            opacity: 1;
          }
        }

        .member-avatar {
          display: flex;
          flex-shrink: 0;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .member-name {
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 500;
          width: 50px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 1;
        }

        .member-role {
          height: 20px;
          padding: 0 8px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          line-height: 20px;
        }

        .member-close {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 16px;
          height: 16px;
          margin-left: 4px;
          border-radius: 50%;
          background: #f5f5f5;
          color: #909399;
          opacity: 0;
          cursor: pointer;
          transition: all 0.3s;

          .el-icon {
            font-size: 12px;
          }

          &:hover {
            background: #ff4d4f;
            color: white;
          }
        }
      }
    }

    // 提示文案
    .members-tip {
      margin: 0;
      padding-left: 4px;
      color: #909399;
      font-size: 12px;
    }
  }

  // 画面尺寸选项
  .size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .size-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    background: #fafafa;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #6c5ce7;
      background: #f9f8ff;
      box-shadow: 0 4px 12px rgb(108 92 231 / 15%);
      transform: translateY(-2px);
    }

    &.active {
      border-color: #5252ff;
      background: #f3f3ff;

      .ratio-box {
        border: 1px solid #5252ff;
        border-radius: 2px;
        background: #e8e9ff;
      }

      .label {
        color: #5252ff;
        font-weight: 600;
      }
    }
  }

  .ratio-item {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 60px;
  }

  .ratio-box {
    border-radius: 2px;
    background-color: #d1d5db;
    // margin-bottom: 8px;
    transition: all 0.3s;
  }

  .label {
    color: #606266;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s;
  }

  // 对话框底部
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
