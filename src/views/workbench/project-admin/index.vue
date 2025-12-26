<template>
  <div class="project-container">
    <!-- <el-button class="new-add-btn" @click="handleImportMembers">临时上传</el-button> -->
    <!-- Banner轮播 -->
    <BannerCarousel />

    <!-- 全部项目区域 -->
    <div class="all-projects-section">
      <div class="section-header">
        <div class="title-section">
          <h2 class="main-title">全部项目</h2>
          <p class="sub-title">共 {{ projects.length }} 个项目</p>
        </div>
        <!-- 有数据时显示新建按钮 -->
        <el-button
          v-if="projects.length > 0"
          v-hasPermi="['project-add']"
          class="add-btn"
          type="primary"
          @click="addProjectRef?.open()"
        >
          <el-icon style="margin-right: 4px"><Plus /></el-icon>
          新建项目
        </el-button>
      </div>

      <!-- 项目横向滚动列表 -->
      <div v-if="projects.length > 0" class="projects-scroll-wrapper">
        <!-- 左侧滚动按钮 -->
        <div v-show="showLeftArrow" class="scroll-arrow left" @click="scrollLeft">
          <el-icon><ArrowLeftBold /></el-icon>
        </div>

        <!-- 项目列表 -->
        <div ref="projectListRef" class="project-list-horizontal" @scroll="handleProjectScroll">
          <!-- 项目卡片 -->
          <div v-for="item in projects" :key="item.projectId" class="project-card">
            <!-- 封面图 -->
            <div class="card-cover" @click="handleProjectClick(item)">
              <img
                v-if="item.coverUrl"
                :src="item.coverUrl"
                :alt="item.projectName"
                class="cover-image"
                loading="lazy"
              />
              <div v-else class="cover-placeholder">
                <img
                  style="width: 118px; height: 118px"
                  src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/280aecd608a94a8d.png"
                  alt=""
                  loading="lazy"
                />
              </div>

              <!-- 积分显示 -->
              <div v-if="item.limitPoints != null && item.limitPoints > 0" class="points-badge" @click.stop>
                <span>积分：{{ Math.max(0, item.limitPoints - (item.consumedPoints || 0)) }}</span>
                <el-icon v-hasPermi="['point-limit']" class="close-icon" @click="handleCancelLimitPoints(item)">
                  <Close />
                </el-icon>
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
                v-hasPermi="['project-rename', 'project-delete']"
                class="card-actions"
                :class="{ 'dropdown-active': activeDropdownId === String(item.projectId) }"
                @click.stop
              >
                <el-dropdown
                  trigger="click"
                  placement="bottom-end"
                  @command="(command:string) => handleCommand(command, item)"
                  @visible-change="(visible :boolean) => handleDropdownChange(visible, item.projectId)"
                >
                  <div class="action-btn">
                    <svg-icon icon-class="fy-more" style="width: 12px; height: 12px" />
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <div v-hasPermi="['point-limit']">
                        <el-dropdown-item command="limitPoints">
                          <el-icon style="width: 16px; height: 16px; margin-right: 8px"><Money /></el-icon>
                          限制积分
                        </el-dropdown-item>
                      </div>
                      <div v-hasPermi="['project-rename']">
                        <el-dropdown-item command="rename">
                          <svg-icon icon-class="fy-pen" style="width: 16px; height: 16px; margin-right: 8px" />
                          重命名
                        </el-dropdown-item>
                      </div>
                      <div v-hasPermi="['project-delete']">
                        <el-dropdown-item command="delete" divided class="delete-item">
                          <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 8px" />
                          删除
                        </el-dropdown-item>
                      </div>
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
          <div v-if="loading" class="loading-tip-card">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>

        <!-- 右侧滚动按钮 -->
        <div v-show="showRightArrow" class="scroll-arrow right" @click="scrollRight">
          <el-icon><ArrowRightBold /></el-icon>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-image">
          <img
            style="width: 200px"
            src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/4b8b2b04c9af4c4e.png"
            alt=""
            loading="lazy"
          />
        </div>
        <p class="empty-text">暂无项目 <span v-hasPermi="['project-add']"> ，赶快点击下方按钮创建吧～</span></p>
        <el-button v-hasPermi="['project-add']" type="primary" class="add-btn" @click="addProjectRef?.open()">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>
          新建
        </el-button>
      </div>
    </div>

    <!-- Tab内容区域 -->
    <ContentTabs />

    <!-- 新建项目对话框 -->
    <AddProject ref="addProjectRef" @confirm="handleCreate" />

    <!-- 重命名对话框 -->
    <RenameProject ref="renameProjectRef" @confirm="handleRenameConfirm" />

    <!-- 限制积分对话框 -->
    <LimitPointsDialog ref="limitPointsDialogRef" @confirm="handleLimitPointsConfirm" />

    <!-- 临时上传素材对话框 -->
    <UploadMaterialDialog v-model="uploadMaterialVisible" />
  </div>
</template>

<script setup name="Index" lang="ts">
  import {
    addProject as createProject,
    delProject,
    limitProjectPoints,
    listProject,
    renameProject
  } from '@/api/workbench/project';
  import type { Project, ProjectCreateRequest } from '@/api/workbench/project/types';
  import useUserStore from '@/store/modules/user';
  import { ArrowLeftBold, ArrowRightBold, Clock, Close, Loading, Money, Plus } from '@element-plus/icons-vue';
  import dayjs from 'dayjs';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { nextTick, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import AddProject from './components/add-project.vue';
  import BannerCarousel from './components/banner-carousel.vue';
  import ContentTabs from './components/content-tabs.vue';
  import LimitPointsDialog from './components/limit-points-dialog.vue';
  import RenameProject from './components/rename-project.vue';
  import UploadMaterialDialog from './components/UploadMaterialDialog.vue';

  const router = useRouter();
  const userStore = useUserStore();

  // ------- refs --------
  const addProjectRef = ref();
  const renameProjectRef = ref();
  const limitPointsDialogRef = ref();
  const projectListRef = ref<HTMLElement>();
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(20);
  const hasMore = ref(true);
  const uploadMaterialVisible = ref(false);

  // 下拉菜单状态
  const activeDropdownId = ref<string | null>(null);

  // 横向滚动箭头状态
  const showLeftArrow = ref(false);
  const showRightArrow = ref(false);

  // 权限检查辅助函数
  const hasPermission = (permission: string): boolean => {
    const { permissions } = userStore;
    return permissions.some((perm) => perm === '*:*:*' || perm === permission);
  };

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

        // 更新滚动箭头状态
        await nextTick();
        updateScrollArrows();
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

  // ------- 横向滚动相关方法 --------
  const updateScrollArrows = () => {
    if (!projectListRef.value) return;

    const { scrollLeft, scrollWidth, clientWidth } = projectListRef.value;
    // 只有当内容宽度大于容器宽度时才需要显示箭头
    const needScroll = scrollWidth > clientWidth;
    showLeftArrow.value = needScroll && scrollLeft > 0;
    showRightArrow.value = needScroll && scrollLeft + clientWidth < scrollWidth - 1;
  };

  const handleProjectScroll = () => {
    updateScrollArrows();

    // 滚动到接近末尾时加载更多
    if (!projectListRef.value) return;
    const { scrollLeft, scrollWidth, clientWidth } = projectListRef.value;
    if (scrollLeft + clientWidth >= scrollWidth - 100) {
      loadProjects();
    }
  };

  const scrollLeft = () => {
    if (!projectListRef.value) return;
    projectListRef.value.scrollBy({
      left: -600,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!projectListRef.value) return;
    projectListRef.value.scrollBy({
      left: 600,
      behavior: 'smooth'
    });
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
    // 导航到项目制作页
    router.push({ name: 'ProjectCreation', params: { id: project.projectId } });
  };

  // ------- 操作菜单 --------
  const handleDropdownChange = (visible: boolean, projectId: string | number) => {
    activeDropdownId.value = visible ? String(projectId) : null;
  };

  const handleCommand = (command: string, project: Project) => {
    if (command === 'limitPoints') {
      handleLimitPoints(project);
    } else if (command === 'rename') {
      handleRename(project);
    } else if (command === 'delete') {
      handleDelete(project);
    }
  };

  // ------- 限制积分 --------
  const handleLimitPoints = (project: Project) => {
    limitPointsDialogRef.value?.open(project);
  };

  // 取消积分限制
  const handleCancelLimitPoints = async (project: Project) => {
    try {
      await ElMessageBox.confirm('确认解除此项目的积分限制吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await handleLimitPointsConfirm(project.projectId, null);
    } catch (error) {
      if (error === 'cancel') {
        // 用户取消操作
        return;
      }
    }
  };

  const handleLimitPointsConfirm = async (projectId: string | number, limitPoints: number | null) => {
    try {
      await limitProjectPoints({
        projectId: Number(projectId),
        limitPoints: limitPoints
      });

      // 更新本地数据
      const index = projects.value.findIndex((p) => p.projectId === projectId);
      if (index > -1) {
        projects.value[index].limitPoints = limitPoints || undefined;
      }

      if (limitPoints === null) {
        ElMessage.success('已取消积分限制');
      } else {
        ElMessage.success('积分限制设置成功');
      }
    } catch (error) {
      console.log('设置积分限制失败:', error);
      ElMessage.error('设置积分限制失败，请稍后重试');
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

  // ------- 临时上传素材 --------
  const handleImportMembers = () => {
    uploadMaterialVisible.value = true;
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
    padding: 0 24px 24px;
    overflow-y: auto; // 允许整体纵向滚动
    overflow-x: hidden;
    background: transparent;

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

  // 全部项目区域
  .all-projects-section {
    margin-bottom: 48px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

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
      }
    }
  }

  // 项目横向滚动容器
  .projects-scroll-wrapper {
    position: relative;

    .scroll-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: white;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        transform: translateY(-50%) scale(1.1);
      }

      &.left {
        left: -20px;
      }

      &.right {
        right: -20px;
      }

      .el-icon {
        font-size: 20px;
        color: #303133;
      }
    }
  }

  // 项目横向滚动列表
  .project-list-horizontal {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 0 16px;
    scroll-behavior: smooth;

    // 隐藏滚动条但保持滚动功能
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE and Edge

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari, Opera
    }
  }

  // 项目卡片
  .project-card {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0; // 防止卡片被压缩
    width: 280px; // 固定宽度以支持横向滚动
    height: 226px;
    overflow: hidden;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.05), 0 10px 15px 0 rgba(224, 231, 255, 0.1);
    transition: all 0.3s ease;

    &:hover {
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

      // 积分显示
      .points-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 2;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        background: rgba(82, 82, 255, 0.9);
        color: white;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        // 关闭按钮样式
        .close-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          color: white;
          font-size: 12px;
          opacity: 0;
          pointer-events: none;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            color: white;
            background-color: #f56c6c;
          }
        }

        // 悬浮时显示关闭按钮
        &:hover .close-icon {
          opacity: 1;
          pointer-events: auto;
        }
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
        color: #1d2129;
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
    color: #f56c6c;
    &:hover {
      color: #f56c6c;
      .el-icon {
        color: #f56c6c;
      }
    }
  }

  // 加载提示卡片（横向滚动中）
  .loading-tip-card {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    width: 200px;
    height: 226px;
    color: #909399;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;

    .el-icon {
      font-size: 24px;
    }
  }

  // 空状态
  .empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 80px 20px;

    .empty-image {
      margin-bottom: 24px;
    }

    .empty-text {
      margin: 0 0 32px;
      color: #4e5969;
      font-size: 14px;
      text-align: center;
    }

    .add-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 100px;
      padding: 10px 24px;
      border-radius: 8px;
    }
  }
</style>
