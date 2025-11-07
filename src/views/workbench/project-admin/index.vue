<template>
  <div class="project-container">
    <!-- 头部 -->
    <div class="project-header">
      <div class="title-section">
        <h2 class="main-title">全部项目</h2>
        <p class="sub-title">共 {{ projects.length }} 个项目</p>
      </div>
      <!-- 有数据时显示新建按钮 -->
      <el-button class="add-btn" v-if="projects.length > 0" type="primary" @click="addProjectRef?.open()">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <!-- 项目列表 -->
    <div v-if="projects.length > 0" class="project-list" @scroll="handleScroll">
      <!-- 项目卡片 -->
      <div v-for="item in projects" :key="item.projectId" class="project-card">
        <!-- 封面图 -->
        <div class="card-cover" @click="handleProjectClick(item)">
          <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.projectName" class="cover-image" />
          <div v-else class="cover-placeholder">
            <img style="width: 118px; height: 118px" src="../../../assets/images/no-image.png" alt="" />
          </div>

          <!-- 角色标签 -->
          <div
            v-if="item.currentUserRole || item.roleName"
            class="role-badge"
            :class="(item.currentUserRole || item.roleName) === '导演' ? 'director' : 'specialist'"
          >
            {{ item.currentUserRole || item.roleName }}
          </div>

          <!-- 操作菜单按钮 -->
          <div
            class="card-actions"
            :class="{ 'dropdown-active': activeDropdownId === String(item.projectId) }"
            @click.stop
          >
            <el-dropdown
              trigger="click"
              @command="(command:string) => handleCommand(command, item)"
              @visible-change="(visible :boolean) => handleDropdownChange(visible, item.projectId)"
            >
              <div class="action-btn">
                <el-icon><MoreFilled /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">
                    <el-icon><Edit /></el-icon>
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="delete-item">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 卡片信息 -->
        <div class="card-info" @click="handleProjectClick(item)">
          <h3 class="project-name">{{ item.projectName }}</h3>
          <p class="project-time">
            <el-icon><Clock /></el-icon>
            {{ item.updateTime }}
          </p>
        </div>
      </div>

      <!-- 加载提示 -->
      <div v-if="loading" class="loading-tip">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 没有更多提示 -->
      <div v-else-if="!hasMore && projects.length > 0" class="no-more-tip">已加载全部项目</div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-image">
        <img style="width: 200px" src="../../../assets/images/no-project.png" alt="" />
      </div>
      <p class="empty-text">暂无项目，赶快点击下方按钮创建吧～</p>
      <el-button type="primary" class="add-btn" @click="addProjectRef?.open()">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>
        新建
      </el-button>
    </div>

    <!-- 新建项目对话框 -->
    <AddProject ref="addProjectRef" @confirm="handleCreate" />

    <!-- 重命名对话框 -->
    <RenameProject ref="renameProjectRef" @confirm="handleRenameConfirm" />
  </div>
</template>

<script setup name="Index" lang="ts">
  import { addProject as createProject, delProject, listProject, renameProject } from '@/api/workbench/project';
  import type { Project, ProjectCreateRequest } from '@/api/workbench/project/types';
  import { Clock, Delete, Edit, Loading, MoreFilled, Plus } from '@element-plus/icons-vue';
  import dayjs from 'dayjs';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import AddProject from './components/add-project.vue';
  import RenameProject from './components/rename-project.vue';

  const router = useRouter();

  // ------- refs --------
  const addProjectRef = ref();
  const renameProjectRef = ref();
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(20);
  const hasMore = ref(true);

  // 下拉菜单状态
  const activeDropdownId = ref<string | null>(null);

  // ------- 生命周期 --------
  onMounted(() => {
    loadProjects();
  });

  // ------- 加载项目列表 --------
  const loadProjects = async () => {
    if (loading.value || !hasMore.value) return;

    try {
      loading.value = true;
      const response = await listProject({
        pageNum: page.value,
        pageSize: pageSize.value
      });

      // 检查响应数据
      if (response.rows && response.rows.length > 0) {
        // 转换后端字段为前端使用的字段
        const convertedProjects = response.rows.map((item) => ({
          ...item,
          projectId: item.projectId || '',
          projectName: item.projectName || '',
          coverUrl: item.coverUrl,
          currentUserRole: item.roleName,
          updateTime: dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')
        })) as Project[];

        projects.value.push(...convertedProjects);
        page.value++;

        // 判断是否还有更多数据
        const total = response.total || 0;
        hasMore.value = projects.value.length < total;
      } else {
        hasMore.value = false;
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
      ElMessage.error('加载项目列表失败，请稍后重试');
      hasMore.value = false;
    } finally {
      loading.value = false;
    }
  };

  // ------- 滚动加载更多 --------
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      loadProjects();
    }
  };

  // ------- 创建项目 --------
  const handleCreate = async (formData: ProjectCreateRequest) => {
    try {
      const res = await createProject(formData);
      if (res.data) {
        const projectId = res.data;
        ElMessage.success('项目创建成功');
        // 跳转到项目创建页面的角色步骤（步骤2）
        router.push({
          path: `/project-creation/${projectId}`,
          query: { step: '2' }
        });
      }
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  };

  // ------- 点击项目卡片 --------
  const handleProjectClick = (project: Project) => {
    console.log('进入项目:', project);
    // 导航到项目制作页
    router.push({ name: 'ProjectCreation', params: { id: project.projectId } });
  };

  // ------- 操作菜单 --------
  const handleDropdownChange = (visible: boolean, projectId: string | number) => {
    activeDropdownId.value = visible ? String(projectId) : null;
  };

  const handleCommand = (command: string, project: Project) => {
    if (command === 'rename') {
      handleRename(project);
    } else if (command === 'delete') {
      handleDelete(project);
    }
  };

  // ------- 重命名项目 --------
  const handleRename = (project: Project) => {
    renameProjectRef.value?.open(project);
  };

  const handleRenameConfirm = async (projectId: string | number, newName: string) => {
    try {
      await renameProject({
        projectId: Number(projectId),
        projectName: newName
      });

      // 更新本地数据
      const index = projects.value.findIndex((p) => p.projectId === projectId);
      if (index > -1) {
        projects.value[index].projectName = newName;
      }

      ElMessage.success('重命名成功');
    } catch (error) {
      console.log('重命名项目失败:', error);
    }
  };

  // ------- 删除项目 --------
  const handleDelete = async (project: Project) => {
    try {
      await ElMessageBox.confirm(`确定要删除项目 "${project.projectName}" 吗？此操作不可恢复。`, '删除项目', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      await delProject(project.projectId);

      // 从列表中移除
      const index = projects.value.findIndex((p) => p.projectId === project.projectId);
      if (index > -1) {
        projects.value.splice(index, 1);
      }

      ElMessage.success('删除成功');
    } catch (error: any) {
      if (error === 'cancel') {
        // 用户取消操作
        return;
      }

      console.error('删除项目失败:', error);
      ElMessage.error('删除项目失败，请稍后重试');
    }
  };
</script>

<style scoped lang="scss">
  .project-container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    height: calc(100vh - 60px); // 减去navbar高度
    // padding: 24px;
    overflow: hidden; // 防止整体滚动
    background: transparent; // 背景透明
  }

  // 头部样式 - 固定不滚动
  .project-header {
    display: flex;
    flex-shrink: 0; // 防止头部被压缩
    justify-content: space-between;
    align-items: flex-start;

    background: transparent; // 背景透明

    .title-section {
      .main-title {
        margin: 0 0 6px;
        color: #303133;
        font-size: 20px;
        font-weight: 600;
      }

      .sub-title {
        margin: 0;
        color: #86909c;
        font-size: 14px;
      }
    }

    .add-btn {
      border-radius: 8px;
      margin-right: 8px;
    }
  }

  // 项目列表 - 独立滚动区域
  .project-list {
    display: grid;
    flex: 1; // 占据剩余高度
    align-content: start; // 内容从顶部开始排列
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    overflow-x: hidden;
    padding-right: 8px;
    overflow-y: auto; // 允许垂直滚动
    padding-top: 24px;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 3px;
      background-color: rgb(144 147 153 / 30%);
      transition: background-color 0.3s;

      &:hover {
        background-color: rgb(144 147 153 / 50%);
      }
    }
  }

  // 项目卡片
  .project-card {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 226px;
    overflow: hidden;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.25), 0 10px 15px 0 rgba(224, 231, 255, 0.5);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
      transform: translateY(-4px);

      .card-actions {
        opacity: 1;
      }
    }

    .card-cover {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 164px;
      overflow: hidden;
      cursor: pointer;

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cover-placeholder {
        color: white;
        opacity: 0.8;
      }

      // 角色标签
      .role-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 2;
        font-size: 12px;
        font-weight: 500;
        backdrop-filter: blur(10px);
        display: flex;
        width: 40px;
        height: 24px;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        border-radius: 6px;
        font-size: 12px;

        &.director {
          border: 1px solid #bfbafb;
          background: #f3f3ff;
          color: #5252ff;
        }

        &.specialist {
          border: 1px solid #82baff;
          background: #e7f2ff;
          color: #4086ff;
        }
      }
    }

    .card-info {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px;
      cursor: pointer;
      border-top: 0.5px solid #cfd3d7;

      .project-name {
        margin: 0 0 8px;
        overflow: hidden;
        color: #303133;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .project-time {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: #86909c;
        font-size: 12px;

        .el-icon {
          font-size: 12px;
        }
      }
    }

    // 操作菜单按钮
    .card-actions {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 3;
      opacity: 0;
      transition: opacity 0.3s;

      // 下拉菜单展开时保持可见
      &.dropdown-active {
        opacity: 1;
      }

      .action-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: white;
          transform: scale(1.1);
        }

        .el-icon {
          color: #606266;
          font-size: 18px;
        }
      }
    }
  }

  // 删除选项红色高亮
  :deep(.delete-item) {
    &:hover {
      color: #f56c6c;

      .el-icon {
        color: #f56c6c;
      }
    }
  }

  // 加载提示
  .loading-tip {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 32px 0;
    color: #909399;
    font-size: 14px;
    grid-column: 1 / -1; // 占满整行

    .el-icon {
      font-size: 18px;
    }
  }

  // 没有更多提示
  .no-more-tip {
    padding: 32px 0;
    color: #c0c4cc;
    font-size: 14px;
    text-align: center;
    grid-column: 1 / -1; // 占满整行
  }

  // 空状态
  .empty-state {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    top: -100px;
    // padding: 60px 20px;

    .empty-text {
      margin: 0 0 40px;
      color: var(--text-color-text-2, #4e5969);
    }
    .add-btn {
      display: flex;
      flex-shrink: 0;
      justify-content: center;
      align-items: center;
      width: 80px;
      height: 32px;
      padding: 8px 16px;
      border-radius: 8px;
    }
  }
</style>
