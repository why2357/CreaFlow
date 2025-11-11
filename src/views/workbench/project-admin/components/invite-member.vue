<template>
  <div class="invite-member-content">
    <div class="content-header">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索成员名称或部门"
        clearable
        prefix-icon="Search"
        size="default"
        class="search-input"
        @input="handleSearchDebounced"
      />
    </div>

    <div v-loading="loading" class="user-list" @scroll="handleScroll">
      <div v-for="u in userList" :key="u.userId" class="user-item">
        <div class="user-info">
          <div
            class="user-avatar"
            :style="{
              background: getUserAvatarBg(u),
              color: getUserAvatarColor(u)
            }"
          >
            {{ getUserAvatarText(u) }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ u.nickName }}</span>
            <span class="user-id">{{ u.deptName || '未分配部门' }} ({{ String(u.userId).padStart(5, '0') }})</span>
          </div>
        </div>
        <div class="roles">
          <el-button
            v-for="roleInfo in roles.filter((r) => r.isShow !== false)"
            :key="roleInfo.roleId"
            size="small"
            :class="getUserRoleId(u) === roleInfo.roleId ? getRoleClass(roleInfo.roleKey) : ''"
            :plain="getUserRoleId(u) !== roleInfo.roleId"
            @click="handleRoleSelect(u, roleInfo)"
          >
            {{ roleInfo.roleName }}
          </el-button>
        </div>
      </div>

      <div v-if="userList.length === 0 && !loading" class="empty">
        <el-icon :size="40" color="#c0c4cc"><UserIcon /></el-icon>
        <span class="empty-text">未找到匹配的成员</span>
      </div>

      <div v-if="loadingMore" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-if="noMore && userList.length > 0" class="no-more">没有更多数据了</div>
    </div>
  </div>
</template>

<script setup lang="ts" name="InviteMember">
  import { addProjectUser, deleteProjectUser, editProjectUser, getProjectUserRoles } from '@/api/workbench/member';
  import type { ProjectUserRole } from '@/api/workbench/member/types';
  import { listProjectUsers } from '@/api/workbench/project';
  import type { ProjectMember, ProjectUserPageInfo } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { getRoleBgColor, getRoleShortName, getRoleTextColor } from '@/utils/roleUtils';
  import { Loading, User as UserIcon } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { onMounted, ref } from 'vue';

  interface Props {
    selectedMembers?: ProjectMember[];
    projectId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedMembers: () => [],
    projectId: undefined
  });

  const emit = defineEmits(['close', 'select', 'remove', 'refresh']);

  // Store
  const projectStore = useProjectStore();

  // 状态管理
  const searchKeyword = ref('');
  const userList = ref<ProjectUserPageInfo[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const noMore = ref(false);
  const roles = ref<ProjectUserRole[]>([]);

  // 分页参数
  const pageNum = ref(1);
  const pageSize = ref(20);
  const total = ref(0);

  // 防抖定时器
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  // 获取用户列表
  const fetchUserList = async (isLoadMore = false) => {
    if (isLoadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }

    try {
      const response = await listProjectUsers({
        projectId: props.projectId,
        nickName: searchKeyword.value.trim() || undefined,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      });

      const rows = response.rows || [];
      total.value = response.total || 0;

      if (isLoadMore) {
        // 加载更多，追加数据
        userList.value = [...userList.value, ...rows];
      } else {
        // 首次加载或搜索，替换数据
        userList.value = rows;
      }

      // 判断是否还有更多数据
      noMore.value = userList.value.length >= total.value;
    } catch (error) {
      console.log('获取用户列表失败:', error);
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };

  // 防抖搜索
  const handleSearchDebounced = () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      pageNum.value = 1;
      noMore.value = false;
      fetchUserList();
    }, 500);
  };

  // 滚动加载更多
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // 距离底部50px时触发加载
    if (scrollTop + clientHeight >= scrollHeight - 50 && !loadingMore.value && !noMore.value) {
      pageNum.value++;
      fetchUserList(true);
    }
  };

  // 获取成员的角色和memberId（用于高亮显示和API调用）
  const getMemberInfo = (userId: number) => {
    // 编辑模式：从项目详情中获取团队成员信息
    if (props.projectId) {
      // 优先使用 memberUserId（新字段）
      const teamMember = projectStore.teamUserInfoList?.find((m: any) => m.memberUserId === userId);
      return teamMember;
    }

    // 新建模式：从 selectedMembers 中获取
    return props.selectedMembers?.find((m) => m.userId === userId);
  };

  // 获取成员的 roleId（用于高亮显示按钮）
  const getMemberRoleId = (userId: number): number | string | null => {
    const memberInfo = getMemberInfo(userId);
    return memberInfo?.roleId || null;
  };

  // 获取用户的实际 roleId（包含接口返回的角色）
  const getUserRoleId = (user: ProjectUserPageInfo): number | string | null => {
    if (!user.userId) return null;
    // 优先使用 getMemberRoleId（项目成员列表），其次使用 user.roleId（用户列表返回的角色）
    return getMemberRoleId(user.userId) || user.roleId || null;
  };

  // 获取成员的 roleKey（用于头像显示）
  const getMemberRoleKey = (userId: number): string | null => {
    const memberInfo = getMemberInfo(userId);
    return memberInfo?.roleKey || null;
  };

  // 获取用户头像背景颜色
  const getUserAvatarBg = (user: ProjectUserPageInfo): string => {
    if (!user.userId) return '#F7F8FA';
    // 优先使用 getMemberRoleKey（项目成员列表），其次使用 user.roleKey（用户列表返回的角色）
    const roleKey = getMemberRoleKey(user.userId) || user.roleKey;
    return roleKey ? getRoleBgColor(roleKey) : '#F7F8FA';
  };

  // 获取用户头像文字颜色
  const getUserAvatarColor = (user: ProjectUserPageInfo): string => {
    if (!user.userId) return '#4E5969';
    // 优先使用 getMemberRoleKey（项目成员列表），其次使用 user.roleKey（用户列表返回的角色）
    const roleKey = getMemberRoleKey(user.userId) || user.roleKey;
    return roleKey ? getRoleTextColor(roleKey) : '#4E5969';
  };

  // 获取用户头像文字内容
  const getUserAvatarText = (user: ProjectUserPageInfo): string => {
    if (!user.userId) return user.nickName?.charAt(0) || 'U';
    // 优先使用 getMemberRoleKey（项目成员列表），其次使用 user.roleKey（用户列表返回的角色）
    const roleKey = getMemberRoleKey(user.userId) || user.roleKey;
    return roleKey ? getRoleShortName(roleKey) : user.nickName?.charAt(0) || 'U';
  };

  // 选择角色
  const handleRoleSelect = async (user: ProjectUserPageInfo, roleInfo: ProjectUserRole) => {
    if (!user.userId || !roleInfo.roleId) {
      ElMessage.warning('操作参数不完整');
      return;
    }

    const memberInfo = getMemberInfo(user.userId);

    // 判断是否是真正的编辑模式（有 projectId）
    const isRealEditMode = props.projectId !== undefined;

    if (!isRealEditMode) {
      // 新建模式或项目创建流程中：通过 emit 事件通知父组件，不调用 API
      handleRoleSelectLocal(user, roleInfo);
      return;
    }

    // 真正的编辑模式：调用 API 进行实际操作
    try {
      // 情况1：用户不存在于团队中 - 调用新增接口
      if (!memberInfo || !(memberInfo as any).memberId) {
        console.log('memberInfo', memberInfo);

        await handleAddMember(user.userId, roleInfo.roleId);
        return;
      }

      // 情况2：用户已存在
      const memberId = (memberInfo as any).memberId;
      const isSameRole = memberInfo.roleId === roleInfo.roleId;

      if (isSameRole) {
        // 点击相同角色
        // 如果是导演角色（DIRECTOR），不做任何操作
        if (roleInfo.roleKey === 'DIRECTOR') {
          return;
        }
        // 如果是专员或其他角色，执行删除操作
        if (memberId) {
          await handleDeleteMember(memberId);
        }
      } else {
        // 点击不同角色，执行修改操作
        if (memberId && roleInfo.roleId) {
          await handleEditMember(memberId, roleInfo.roleId);
        }
      }
    } catch (error) {
      console.error('角色操作失败:', error);
    }
  };

  // 新建模式：本地处理角色选择（通过 emit 通知父组件）
  const handleRoleSelectLocal = (user: ProjectUserPageInfo, roleInfo: ProjectUserRole) => {
    if (!user.userId) return;

    const existingMember = props.selectedMembers?.find((m) => m.userId === user.userId);

    if (existingMember) {
      // 如果已经有这个角色，则移除
      if (existingMember.roleId === roleInfo.roleId) {
        emit('remove', user.userId);
        return;
      }
      // 否则更新角色
      const updatedMember: ProjectMember = {
        ...existingMember,
        userId: user.userId,
        nickName: user.nickName,
        deptId: user.deptId,
        deptName: user.deptName,
        roleId: roleInfo.roleId,
        roleKey: roleInfo.roleKey
      };
      emit('select', updatedMember);
    } else {
      // 添加新成员
      const member: ProjectMember = {
        userId: user.userId,
        nickName: user.nickName,
        deptId: user.deptId,
        deptName: user.deptName,
        roleId: roleInfo.roleId,
        roleKey: roleInfo.roleKey
      };
      emit('select', member);
    }
  };

  // 新增协作者
  const handleAddMember = async (userId: number, roleId: number) => {
    if (!props.projectId) return;
    try {
      await addProjectUser({
        projectId: props.projectId,
        userId,
        roleId
      });
      ElMessage.success('添加协作者成功');
      // 刷新项目信息以获取最新的团队成员列表
      await projectStore.loadProjectInfo(props.projectId);
      emit('refresh');
    } catch (error) {
      console.error('添加协作者失败:', error);
    }
  };

  // 修改协作者角色
  const handleEditMember = async (memberId: number, roleId: number) => {
    if (!props.projectId) return;
    try {
      await editProjectUser({
        memberId,
        roleId
      });
      ElMessage.success('修改角色成功');
      // 刷新项目信息以获取最新的团队成员列表
      await projectStore.loadProjectInfo(props.projectId);
      emit('refresh');
    } catch (error) {
      console.error('修改角色失败:', error);
    }
  };

  // 删除协作者
  const handleDeleteMember = async (memberId: number) => {
    if (!props.projectId) return;
    try {
      await deleteProjectUser([memberId]);
      ElMessage.success('移除协作者成功');
      // 刷新项目信息以获取最新的团队成员列表
      await projectStore.loadProjectInfo(props.projectId);
      emit('refresh');
    } catch (error) {
      console.error('移除协作者失败:', error);
    }
  };

  // 获取角色的CSS类名
  const getRoleClass = (roleKey?: string): string => {
    const roleClassMap: Record<string, string> = {
      DIRECTOR: 'role-director',
      COMMISSIONER: 'role-specialist',
      ADMIN: 'role-admin',
      OPERATOR: 'role-operator',
      CUSTOMER: 'role-customer'
    };
    return roleKey ? roleClassMap[roleKey] || '' : '';
  };

  // 加载角色列表
  const fetchRoles = async () => {
    try {
      const response = await getProjectUserRoles();
      if (response.code === 200 && response.data) {
        roles.value = response.data;
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
    }
  };

  // 组件挂载时加载数据
  onMounted(() => {
    fetchRoles();
    fetchUserList();
  });
</script>

<style scoped lang="scss">
  :deep(.el-input__wrapper) {
    background: #fff !important;
    height: 32px !important;
  }
  .invite-member-content {
    display: flex;
    flex-direction: column;
    max-height: 315px;

    .content-header {
      padding: 20px 20px 12px;

      .search-input {
        width: 100%;
      }
    }

    .user-list {
      flex: 1;
      min-height: 200px;
      max-height: 420px;
      padding: 0 20px 20px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        border-radius: 3px;
        background: #f5f7fa;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: rgb(108 92 231 / 30%);
        transition: background 0.3s;

        &:hover {
          background-color: rgb(108 92 231 / 50%);
        }
      }
    }

    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      padding: 10px 12px;
      border-radius: 6px;
      // background: #fafafa;
      transition: all 0.2s;

      &:hover {
        background: #f7f8fa;
      }

      .user-info {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 10px;

        .user-avatar {
          display: flex;
          flex-shrink: 0;
          justify-content: center;
          align-items: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .user-name {
            color: #303133;
            font-size: 14px;
            font-weight: 500;
          }

          .user-id {
            color: #909399;
            font-size: 11px;
          }
        }
      }

      .roles {
        display: flex;

        button {
          min-width: 50px;
          height: 28px;
          border: 1px solid #eee;
          background: #fff;
          color: #4e5969;
        }
        .role-director {
          border: 1px solid #bfbafb;
          background: #f3f3ff;
          color: #5252ff;
        }

        .role-specialist {
          border: 1px solid #82baff;
          background: #e7f2ff;
          color: #4086ff;
        }

        .role-admin {
          border: 1px solid #ffb3ba;
          background: #ffe7e9;
          color: #ff4d5a;
        }

        .role-operator {
          border: 1px solid #b3e5c5;
          background: #e7f9ef;
          color: #28a745;
        }

        .role-customer {
          border: 1px solid #ffd89b;
          background: #fff4e0;
          color: #ff9800;
        }
      }
    }

    .empty {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 12px;
      padding: 60px 20px;
      text-align: center;

      .empty-text {
        color: #909399;
        font-size: 13px;
      }
    }

    .loading-more,
    .no-more {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 12px 0;
      color: #909399;
      font-size: 12px;
    }

    .loading-more {
      .el-icon {
        font-size: 14px;
      }
    }

    .no-more {
      color: #c0c4cc;
    }
  }
</style>
