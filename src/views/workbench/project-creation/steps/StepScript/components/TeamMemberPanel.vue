<template>
  <div class="team-member-panel panel-card">
    <div class="panel-header">
      <div class="header-left">
        <div>
          <svg-icon icon-class="fy-tuandui" class="el-icon" />
          <span class="title">团队成员</span>
        </div>

        <el-tag class="tag-sty" type="info">{{ members.length }}人</el-tag>
      </div>
    </div>

    <div class="panel-content">
      <!-- 成员列表区域 - 固定高度，可滚动 -->
      <div class="members-scroll-area">
        <div v-if="members.length === 0" class="empty-state">
          <span class="empty-title">暂无团队成员</span>
        </div>

        <div v-else class="member-grid">
          <div
            v-for="member in members"
            :key="member.memberId"
            class="member-avatar-wrapper"
            @mouseenter="hoveredMemberId = member.memberId || null"
            @mouseleave="hoveredMemberId = null"
          >
            <div
              class="member-avatar"
              :style="{
                background: member.bgColor,
                color: member.textColor
              }"
            >
              <span class="avatar-text">{{ member.icon }}</span>
              <!-- 删除按钮 -->
              <div
                v-show="hoveredMemberId === member.memberId"
                class="delete-btn"
                @click.stop="confirmRemoveMember(member)"
              >
                <el-icon><Close /></el-icon>
              </div>
            </div>
            <div class="member-name">{{ getMemberShortName(member.nickName || '') }}</div>
          </div>
        </div>
      </div>

      <!-- 添加协作者按钮 - 使用 el-popover -->
      <el-popover
        v-model:visible="inviteVisible"
        placement="bottom"
        :width="400"
        trigger="manual"
        popper-class="invite-member-popover"
      >
        <template #reference>
          <div class="add-member-btn" @click="inviteVisible = !inviteVisible">
            <el-icon class="add-icon"><Plus /></el-icon>
            <span>添加协作者</span>
          </div>
        </template>

        <!-- Popover 内容 -->
        <InviteMember
          :selected-members="members"
          :project-id="props.projectId ? Number(props.projectId) : undefined"
          @select="handleSelectMember"
          @remove="handleRemoveMember"
          @close="inviteVisible = false"
        />
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts" name="TeamMemberPanel">
  import { deleteProjectUser } from '@/api/workbench/member';
  import type { ProjectMember } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { getRoleBgColor, getRoleName, getRoleShortName, getRoleTextColor } from '@/utils/roleUtils';
  import InviteMember from '@/views/workbench/project-admin/components/invite-member.vue';
  import { Close, Plus } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { onMounted, ref, watch } from 'vue';

  interface Props {
    projectId?: number | string;
  }

  // 扩展的成员显示类型
  interface MemberDisplay extends ProjectMember {
    memberId?: number;
    icon?: string;
    color?: string;
    bgColor?: string;
    textColor?: string;
    role?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    projectId: undefined
  });

  const projectStore = useProjectStore();
  const members = ref<MemberDisplay[]>([]);
  const inviteVisible = ref(false);
  const hoveredMemberId = ref<string | number | null>(null);

  // 获取成员简称
  const getMemberShortName = (name: string): string => {
    // 如果名字过长，只显示前面几个字
    return name.length > 6 ? name.substring(0, 6) + '...' : name;
  };

  // 从 store 加载团队成员
  const loadMembers = () => {
    // 处理 null 或空数组的情况
    if (projectStore.teamUserInfoList && projectStore.teamUserInfoList.length > 0) {
      members.value = projectStore.teamUserInfoList
        .filter((user) => user.memberId) // 过滤掉没有 memberId 的成员
        .map((user) => ({
          memberId: user.memberId as number,
          nickName: user.nickName || '未命名',
          role: getRoleName(user.roleKey),
          roleKey: user.roleKey,
          userId: user.userId,
          roleId: user.roleId,
          // 用于头像显示 - 使用 roleKey
          icon: getRoleShortName(user.roleKey),
          color: '#5252FF', // 不再使用这个字段，保留兼容
          bgColor: getRoleBgColor(user.roleKey),
          textColor: getRoleTextColor(user.roleKey)
        }));
    } else {
      // 新项目无成员时显示空状态
      members.value = [];
    }
  };

  // 初始化
  onMounted(() => {
    loadMembers();
  });

  // 监听项目变化
  watch(
    () => projectStore.teamUserInfoList,
    () => {
      loadMembers();
    },
    { deep: true }
  );

  // 选择成员
  const handleSelectMember = (member: ProjectMember) => {
    const existingIndex = members.value.findIndex((m) => m.userId === member.userId);
    if (existingIndex !== -1) {
      // 更新角色时，重新计算头像相关属性 - 使用 roleKey
      members.value[existingIndex] = {
        ...members.value[existingIndex],
        ...member,
        role: getRoleName(member.roleKey),
        icon: getRoleShortName(member.roleKey),
        color: '#5252FF', // 不再使用这个字段，保留兼容
        bgColor: getRoleBgColor(member.roleKey),
        textColor: getRoleTextColor(member.roleKey)
      };
    } else {
      // 添加新成员时，也要设置头像相关属性 - 使用 roleKey
      members.value.push({
        ...member,
        role: getRoleName(member.roleKey),
        icon: getRoleShortName(member.roleKey),
        color: '#5252FF', // 不再使用这个字段，保留兼容
        bgColor: getRoleBgColor(member.roleKey),
        textColor: getRoleTextColor(member.roleKey)
      });
    }
  };

  // 确认移除成员
  const confirmRemoveMember = async (member: MemberDisplay) => {
    console.log('member', member);

    try {
      await ElMessageBox.confirm(`确定要移除成员 "${member.nickName}" 吗？`, '移除成员', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await handleRemoveMember(member);
    } catch (error) {
      // 用户取消或删除失败
      if (error !== 'cancel') {
        console.error('删除成员失败:', error);
      }
    }
  };

  // 移除成员
  const handleRemoveMember = async (member: MemberDisplay | string | number) => {
    const memberId = typeof member === 'object' ? member.memberId : member;

    if (!memberId) {
      ElMessage.error('成员ID不存在');
      return;
    }

    // 调用删除 API
    try {
      await deleteProjectUser([Number(memberId)]);
      ElMessage.success('成员已移除');

      // 刷新项目信息以获取最新的团队成员列表
      if (props.projectId) {
        await projectStore.loadProjectInfo(Number(props.projectId));
      }
    } catch (error) {
      console.error('删除协作者失败:', error);
      throw error;
    }
  };
</script>

<style scoped lang="scss">
  .team-member-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 16px;
    background: white;
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
  }

  .panel-header {
    display: flex;
    flex-shrink: 0;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 0px;
    // border-bottom: 1px solid #f0f0f0;

    .header-left {
      display: flex;
      align-items: center;
      width: 100%;
      justify-content: space-between;

      .el-icon {
        color: #5252ff;
        font-size: 16px;
        margin-right: 7px;
      }

      .title {
        color: #303133;
        font-size: 15px;
        font-weight: 600;
      }

      .tag-sty {
        display: flex;
        width: 32px;
        height: 18px;
        padding: 2px 5px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        border-radius: 4px;
        border: 0.625px solid #d6d7ff;
        background: #f3f3ff;
        color: #5252ff;
        font-size: 9px;
      }
    }
  }

  .panel-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0 16px 16px;
    padding-bottom: 12px;
    overflow: hidden;
  }

  .members-scroll-area {
    flex: 1;
    margin-bottom: 12px;
    padding-top: 10px;
    padding-right: 4px;
    overflow-x: hidden;
    overflow-y: auto;

    // 隐藏滚动条但保留滚动功能
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE 10+

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari, Edge
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 60px 20px;
      text-align: center;

      .empty-title {
        color: #909399;
        font-size: 14px;
        font-weight: 500;
      }

      .empty-hint {
        color: #c0c4cc;
        font-size: 12px;
      }
    }

    .member-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .member-avatar-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-3px);

          .member-avatar {
            box-shadow: 0 6px 12px rgb(108 92 231 / 30%);
          }
        }

        .member-avatar {
          position: relative;
          display: flex;
          flex-shrink: 0;
          justify-content: center;
          align-items: center;
          width: 48px;
          height: 48px;
          border: 1px solid var(--Borderl-border-2, #eee);
          border-radius: 50%;
          box-shadow: 0 3px 8px rgb(108 92 231 / 20%);
          font-size: 16px;
          font-weight: 700;
          transition: all 0.3s;

          .avatar-text {
            position: relative;
            z-index: 1;
          }

          .delete-btn {
            position: absolute;
            top: -4px;
            right: -4px;
            z-index: 2;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #f56c6c;
            box-shadow: 0 2px 6px rgb(245 108 108 / 40%);
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              background: #f78989;
              box-shadow: 0 4px 12px rgb(245 108 108 / 50%);
              transform: scale(1.1);
            }

            .el-icon {
              color: white;
              font-size: 12px;
            }
          }
        }

        .member-name {
          max-width: 100%;
          overflow: hidden;
          color: #606266;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .add-member-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 28px;
    padding: 2px 12px;
    border: 1.5px solid var(--Borderl-border-1, #d6d7ff);
    border-radius: 8px;
    background: var(--text-color-text-6, #ffffff);
    color: #6c5ce7;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #6c5ce7;
      background: #f9f8ff;
      box-shadow: 0 2px 8px rgb(108 92 231 / 15%);
    }

    .add-icon {
      font-size: 16px;
    }
  }
</style>
