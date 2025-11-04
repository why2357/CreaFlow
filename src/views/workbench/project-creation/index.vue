<template>
  <div class="project-creation-container">
    <!-- 全局加载遮罩 -->
    <Transition name="fade">
      <div v-if="projectStore.isInitializing" class="global-loading-overlay">
        <div class="loading-content">
          <el-icon class="loading-icon" :size="48">
            <Loading />
          </el-icon>
          <p class="loading-text">加载项目中...</p>
        </div>
      </div>
    </Transition>

    <!-- 顶部导航栏 -->
    <div class="top-header">
      <div class="header-left">
        <div class="logo-back" @click="handleBack">
          <div>
            <img style="width: 40px; height: 40px" src="../../../assets/images/logo.png" alt="" />
          </div>
          <div class="line-sty"></div>
          <span class="project-title">{{ projectName }}</span>
        </div>
      </div>
      <!-- 步骤导航 -->
      <div class="step-tabs" :class="{ 'tabs-initializing': projectStore.isInitializing }">
        <div
          v-for="step in projectStore.steps"
          :key="step.key"
          class="step-tab"
          :class="{
            active: step.key === projectStore.currentStep,
            'tab-disabled': projectStore.isInitializing
          }"
          @click="!projectStore.isInitializing && handleStepChange(step.key)"
        >
          <div class="step-item" style="display: flex; align-items: center">
            <!-- 第4步根据视图模式动态显示图标和名称 -->
            <svg-icon v-if="step.key === 4" class="step-icon" :icon-class="projectStore.step4DisplayInfo.icon" />
            <svg-icon v-else class="step-icon" :icon-class="getStepIconComponent(step.icon)" />

            <span v-if="step.key !== 4" class="step-name">{{ step.name }}</span>

            <!-- 分镜表步骤显示下拉菜单 -->
            <template v-if="step.key === 4">
              <span class="step-name">{{ projectStore.step4DisplayInfo.name }}</span>
              <el-dropdown
                trigger="hover"
                placement="bottom"
                :hide-on-click="true"
                @command="handleStoryboardViewChange"
              >
                <span class="dropdown-trigger" @click.stop>
                  <svg-icon class="dropdown-icon step-icon" icon-class="downward" style="width: 9px; height: 9px" />
                </span>

                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="projectStore.step4ViewMode !== 'storyboard'" command="storyboard">
                      <svg-icon icon-class="step-fenjing" class="step-icon" />
                      <span>分镜头</span>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="projectStore.step4ViewMode !== 'grid'" command="grid">
                      <svg-icon icon-class="step-story" class="step-icon" />
                      <span>故事板</span>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="projectStore.step4ViewMode !== 'waterfall'" command="waterfall">
                      <svg-icon icon-class="step-pubu" class="step-icon" />
                      <span>瀑布流</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </div>
        </div>
      </div>
      <div class="header-right">
        <!-- <div class="credits-badge">
          <el-icon class="icon-flash"><Lightning /></el-icon>
          <span class="credits-text">330 充值</span>
        </div> -->
        <!-- <div class="notifications">
          <el-badge :value="3" class="notification-badge">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>
        </div> -->
        <UserProfileDropdown />
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 中间内容区 -->
      <div class="center-content">
        <!-- 动态步骤内容 -->
        <div class="step-content">
          <Transition name="step-fade" mode="out-in">
            <component :is="currentStepComponent" :key="projectStore.currentStep" />
          </Transition>
        </div>

        <!-- 底部操作按钮 -->
        <!-- <div class="bottom-actions">
          <el-button
            class="next-sty"
            v-if="projectStore.currentStep < 5"
            type="primary"
            size="large"
            @click="handleNextStep"
          >
            下一步
          </el-button>
          <el-button v-else type="success" size="large" @click="handleComplete"> 完成制作 </el-button>
        </div> -->
      </div>
    </div>

    <!-- 新增剧集对话框 -->
    <AddEpisodeDialog
      v-model="addEpisodeDialog"
      :project-id="Number(projectStore.currentProjectId) || 0"
      :next-episode-number="(projectStore.episodeInfoList?.length || 0) + 1"
      @success="handleAddEpisodeSuccess"
    />
  </div>
</template>

<script setup lang="ts" name="ProjectCreation">
  import { useProjectStore } from '@/store/modules/project';
  import { Loading } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import UserProfileDropdown from '@/components/UserProfileDropdown/index.vue';
  import AddEpisodeDialog from './components/AddEpisodeDialog.vue';

  // 懒加载步骤组件
  const StepScript = defineAsyncComponent(() => import('./steps/StepScript/index.vue'));
  const StepCharacter = defineAsyncComponent(() => import('./steps/StepCharacter/index.vue'));
  const StepScene = defineAsyncComponent(() => import('./steps/StepScene/index.vue'));
  const StepShotList = defineAsyncComponent(() => import('./steps/StepShotList/index.vue'));
  const StepGridView = defineAsyncComponent(() => import('./steps/StepGridView/index.vue'));
  const StepWaterfallView = defineAsyncComponent(() => import('./steps/StepWaterfallView/index.vue'));
  const StepVideo = defineAsyncComponent(() => import('./steps/StepVideo/index.vue'));

  const route = useRoute();
  const router = useRouter();
  const projectStore = useProjectStore();

  // 项目名称（从 store 中获取）
  const projectName = computed(() => projectStore.projectName || '加载中...');

  // 新增剧集对话框
  const addEpisodeDialog = ref(false);

  // 当前步骤组件
  const currentStepComponent = computed(() => {
    // 第4步根据视图模式动态加载不同组件
    if (projectStore.currentStep === 4) {
      const viewMode = projectStore.step4ViewMode;
      if (viewMode === 'grid') return StepGridView;
      if (viewMode === 'waterfall') return StepWaterfallView;
      return StepShotList; // 默认使用分镜表
    }

    const componentMap: Record<number, any> = {
      1: StepScript,
      2: StepCharacter,
      3: StepScene,
      5: StepVideo
    };
    return componentMap[projectStore.currentStep] || StepScript;
  });

  // 获取步骤图标组件
  const getStepIconComponent = (iconName: string) => {
    const iconMap: Record<string, string> = {
      document: 'step-juben', // 剧本
      user: 'step-juese', // 角色
      picture: 'step-changjing', // 场景
      list: 'step-fenjing', // 分镜头
      'video-camera': 'step-shipin' // 视频
    };
    return iconMap[iconName];
  };

  // 页面初始化
  onMounted(async () => {
    const projectId = route.params.id || route.query.id;
    if (projectId) {
      // 统一使用工作流记录恢复流程
      // 如果URL中有step参数，作为默认步骤传递（当工作流记录为空时使用）
      const step = route.query.step ? parseInt(route.query.step as string) : undefined;

      // 调用统一的初始化逻辑
      await projectStore.initProject(projectId as string, step);

      // 如果URL中有step参数，初始化完成后移除它，避免刷新时出现问题
      if (route.query.step) {
        router.replace({
          path: `/project-creation/${projectId}`
        });
      }
    } else {
      ElMessage.error('项目ID不存在');
      router.push('/workbench');
    }
  });

  // 预加载组件函数
  const preloadComponent = (step: number) => {
    // 触发组件的懒加载，确保在显示前已经加载完成
    const componentMap: Record<number, any> = {
      1: StepScript,
      2: StepCharacter,
      3: StepScene,
      4: StepShotList, // 第4步默认预加载分镜表
      5: StepVideo
    };
    const component = componentMap[step];
    if (component) {
      // defineAsyncComponent 返回的组件可以通过访问其 __asyncLoader 来触发加载
      component.__asyncLoader?.();
    }
  };

  // 页面卸载前保存状态
  onBeforeUnmount(async () => {});

  // 返回工作台
  const handleBack = async () => {
    try {
      await ElMessageBox.confirm('确定要返回工作台吗?未保存的数据将丢失', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      projectStore.resetProject();
      router.push('/index');
    } catch {
      // 用户取消
    }
  };

  // 新增剧集成功回调
  const handleAddEpisodeSuccess = async () => {
    // 重新加载项目信息以获取最新的剧集列表
    await projectStore.loadProjectInfo(projectStore.currentProjectId as number);
    ElMessage.success('剧集创建成功');
  };

  // 切换步骤
  const handleStepChange = async (step: number) => {
    // 如果点击的是当前步骤，不调用接口
    if (step === projectStore.currentStep) {
      return;
    }
    await projectStore.goToStep(step);
  };

  // 分镜表视图切换
  const handleStoryboardViewChange = async (viewType: string) => {
    // 更新视图模式到 store
    await projectStore.updateStep4ViewMode(viewType as 'storyboard' | 'grid' | 'waterfall');

    // 自动跳转到第4步（组件会根据 viewMode 自动切换）
    await projectStore.goToStep(4);
  };

  // 下一步
  const handleNextStep = async () => {
    await projectStore.nextStep();
  };

  // 完成制作
  const handleComplete = () => {
    ElMessage.success('制作完成!');
    // TODO: 跳转到预览页面或其他逻辑
  };
</script>

<style scoped lang="scss">
  .project-creation-container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  // 全局加载遮罩（覆盖整个页面包括步骤条）
  .global-loading-overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgb(255 255 255 / 98%);
    backdrop-filter: blur(10px);

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 40px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 8px 32px rgb(0 0 0 / 8%);

      .loading-icon {
        color: #5252ff;
        animation: rotate 1.5s linear infinite;
      }

      .loading-text {
        color: #303133;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.5px;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }

  // 顶部导航栏
  .top-header {
    position: relative;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 72px;
    padding: 0 32px;
    // border-bottom: 2px solid #f0f2f5;
    // background: white;
    // box-shadow: 0 2px 8px rgb(0 0 0 / 6%);

    .header-left {
      .logo-back {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 0px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f9f8ff;
          color: #6c5ce7;
        }
        .line-sty {
          width: 1px;
          height: 20px;
          flex-shrink: 0;
          border-radius: 23px;
          background: #c9cdd4;
        }
        .el-icon {
          transition: transform 0.3s;
        }

        &:hover .el-icon {
          transform: translateX(-3px);
        }

        .project-title {
          color: #1a1a1a;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;

      .credits-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        border: 2px solid #ffdb99;
        border-radius: 24px;
        background: linear-gradient(135deg, #fff7e6 0%, #ffe8b3 100%);
        box-shadow: 0 2px 8px rgb(255 193 7 / 20%);
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #ffc107;
          box-shadow: 0 4px 12px rgb(255 193 7 / 30%);
          transform: translateY(-2px);
        }

        .icon-flash {
          color: #ff9800;
          font-size: 18px;
          animation: flash 2s infinite;
        }

        .credits-text {
          color: #e65100;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
      }

      .notifications {
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f9f8ff;
        }

        .el-icon {
          color: #606266;
          transition: color 0.3s;
        }

        &:hover .el-icon {
          color: #6c5ce7;
        }

        .notification-badge {
          :deep(.el-badge__content) {
            border: 2px solid white;
            background: linear-gradient(135deg, #f56c6c 0%, #ff6b9d 100%);
            font-weight: 600;
          }
        }
      }

      .user-avatar {
        border: 2px solid #f0f0f0;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #6c5ce7;
          box-shadow: 0 4px 12px rgb(108 92 231 / 30%);
          transform: scale(1.05);
        }
      }
    }
  }

  @keyframes flash {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.6;
    }
  }

  // 主内容区
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  // 淡入淡出动画
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  // 步骤切换动画
  .step-fade-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .step-fade-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.6, 1);
  }

  .step-fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }

  .step-fade-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  .step-tabs {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 6px;
    border-radius: 30px;
    border: 1px solid #d6d7ff;
    background: #f3f3ff;
    box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
    transition: opacity 0.3s ease;

    &.tabs-initializing {
      opacity: 0.6;
      pointer-events: none;
    }

    .step-tab {
      display: flex;
      // width: 100px;
      height: 28px;
      padding: 6px 25px;
      justify-content: center;
      align-items: center;

      position: relative;
      flex: 1;
      gap: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &.tab-disabled {
        cursor: not-allowed;
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .step-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
        color: #909399;
        transition: all 0.3s;
      }

      .step-name {
        color: #606266;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.3px;
        text-align: center;
        white-space: nowrap;
        transition: all 0.3s;
      }

      &:hover {
        background: #f5f7fa;
        border-radius: 14px;

        .step-icon {
          color: #6c5ce7 !important;
        }

        .step-name {
          color: #6c5ce7;
        }
      }

      &.active {
        background: #5252ff;
        border-radius: 14px;
        box-shadow: 0 4px 12px rgb(108 92 231 / 30%);

        .step-icon {
          color: white !important;
        }

        .step-name {
          color: white;
          font-weight: 700;
        }
        .dropdown-icon {
          color: white;
        }
      }

      .dropdown-trigger {
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        padding: 2px 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: rgb(255 255 255 / 20%);

          .dropdown-icon {
            transform: rotate(180deg);
          }
        }

        .dropdown-icon {
          font-size: 14px;
          transition: transform 0.3s;
        }
      }
    }
  }

  // 下拉菜单样式
  :deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;

    .menu-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
  }

  // 中间内容区
  .center-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 12px 20px;
    overflow: hidden;
    // background: linear-gradient(to bottom, #f8f9fa 0%, #f0f2f5 100%);

    .step-content {
      flex: 1;
      overflow: hidden;
      border-radius: 12px;
    }

    .bottom-actions {
      display: flex;
      justify-content: end;
      margin-top: 12px;
      padding-bottom: 12px;

      .el-button {
        // min-width: 180px;
        height: 48px;
        border-radius: 24px;
        box-shadow: 0 4px 12px rgb(108 92 231 / 30%);
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 1px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          box-shadow: 0 6px 20px rgb(108 92 231 / 40%);
          transform: translateY(-2px);
        }

        &:active {
          transform: translateY(0);
        }

        &.el-button--success {
          border: none;
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          box-shadow: 0 4px 12px rgb(103 194 58 / 30%);

          &:hover {
            box-shadow: 0 6px 20px rgb(103 194 58 / 40%);
          }
        }
      }

      .next-sty {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        width: 80px;
        height: 32px;
        padding: 8px 16px;
        border-radius: 8px;
        background: var(--primary-primary-4, #5252ff);
      }
    }
  }
</style>
