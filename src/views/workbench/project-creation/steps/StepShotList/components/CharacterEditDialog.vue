<template>
  <el-dialog
    v-model="dialogVisible"
    title="角色编辑"
    width="988px"
    :close-on-click-modal="false"
    class="character-edit-dialog"
    @close="handleClose"
  >
    <!-- 角色列表内容 -->
    <div v-loading="loading" class="character-content">
      <div v-if="roleList.length === 0" class="empty-state">
        <p>暂无角色数据</p>
      </div>
      <div v-else class="role-list">
        <div v-for="role in roleList" :key="role.roleId" class="role-group">
          <!-- 角色标题 -->
          <div class="role-header">
            <div class="role-name-tag">{{ role.roleName }}</div>
          </div>

          <!-- 服装列表 -->
          <div class="costume-list">
            <div
              v-for="detail in role.details"
              :key="detail.detailId"
              class="costume-item"
              :class="{ selected: detail.selected }"
              @click="toggleSelection(role.roleId, detail.detailId)"
            >
              <div class="costume-image-wrapper">
                <el-image
                  :src="detail.previewUrl || detail.originUrl"
                  fit="contain"
                  class="costume-image"
                  hide-on-click-modal
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>

                <!-- 右上角剧集标签 -->
                <EpisodeTagsDisplay :episode-list="detail.episodeList" />
              </div>
              <div class="costume-name">{{ detail.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">取消</el-button>
        <el-button class="confirm-btn" type="primary" :loading="submitting" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { editEpisodeRole, queryEpisodeRole } from '@/api/workbench/episode';
  import type { RoleData } from '@/api/workbench/episode/types';
  import { Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
  import EpisodeTagsDisplay from '../../components/EpisodeTagsDisplay.vue';

  // Props
  interface Props {
    modelValue: boolean;
    episodeId?: number | null;
    projectId?: number | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    episodeId: null,
    projectId: null
  });

  // Emits
  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }

  const emit = defineEmits<Emits>();

  // 状态
  const loading = ref(false);
  const submitting = ref(false);
  const roleList = ref<RoleData[]>([]);

  // 对话框显示状态
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  // 监听对话框打开
  watch(dialogVisible, (newVal) => {
    if (newVal) {
      loadRoleList();
    }
  });

  // 设置横向滚动（Ctrl+滚轮触发）
  const setupHorizontalScroll = () => {
    nextTick(() => {
      const scrollWrappers = document.querySelectorAll('.character-edit-dialog .costume-list');

      scrollWrappers.forEach((wrapper) => {
        const handleWheel = (e: Event) => {
          const wheelEvent = e as WheelEvent;
          // 只处理按住 Ctrl 键的垂直滚动
          if (wheelEvent.ctrlKey && wheelEvent.deltaY !== 0) {
            wheelEvent.preventDefault();
            // 将垂直滚动转换为横向滚动
            const element = wrapper as HTMLElement;
            element.scrollLeft += wheelEvent.deltaY;
          }
        };

        // 移除旧的监听器
        if ((wrapper as any).__wheelHandler) {
          wrapper.removeEventListener('wheel', (wrapper as any).__wheelHandler);
        }

        // 添加新的监听器
        wrapper.addEventListener('wheel', handleWheel, { passive: false } as any);

        // 保存事件处理器和清理函数
        (wrapper as any).__wheelHandler = handleWheel;
        (wrapper as any).__cleanupScroll = () => {
          wrapper.removeEventListener('wheel', handleWheel);
          delete (wrapper as any).__wheelHandler;
          delete (wrapper as any).__cleanupScroll;
        };
      });
    });
  };

  // 组件卸载时清理
  onUnmounted(() => {
    const scrollWrappers = document.querySelectorAll('.character-edit-dialog .costume-list');
    scrollWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });
  });

  // 加载角色列表
  const loadRoleList = async () => {
    if (!props.episodeId && !props.projectId) {
      ElMessage.warning('缺少必要参数');
      return;
    }

    loading.value = true;
    try {
      const params: any = {};
      if (props.episodeId) params.episodeId = props.episodeId;
      if (props.projectId) params.projectId = props.projectId;

      const res = await queryEpisodeRole(params);
      roleList.value = res.data || [];

      // 数据加载后设置横向滚动
      setupHorizontalScroll();
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 切换选中状态（每个角色只能选中一个服装）
  const toggleSelection = (roleId: number, detailId: number) => {
    const role = roleList.value.find((r) => r.roleId === roleId);
    if (!role) return;

    // 先取消该角色的所有服装选中状态
    role.details.forEach((d) => {
      d.selected = false;
    });

    // 然后选中当前点击的服装
    const detail = role.details.find((d) => d.detailId === detailId);
    if (detail) {
      detail.selected = true;
    }
  };

  // 确认提交
  const handleConfirm = async () => {
    if (!props.episodeId) {
      ElMessage.warning('缺少剧集ID');
      return;
    }

    // 收集选中的角色服装
    const sceneRoles: Array<{ detailId: number; roleId: number }> = [];
    roleList.value.forEach((role) => {
      role.details.forEach((detail) => {
        if (detail.selected) {
          sceneRoles.push({
            detailId: detail.detailId,
            roleId: role.roleId
          });
        }
      });
    });

    if (sceneRoles.length === 0) {
      ElMessage.warning('请至少选择一个角色服装');
      return;
    }

    submitting.value = true;
    try {
      await editEpisodeRole({
        episodeId: props.episodeId,
        sceneRoles
      });

      emit('success');
      dialogVisible.value = false;
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      submitting.value = false;
    }
  };

  // 关闭对话框
  const handleClose = () => {
    dialogVisible.value = false;
  };
</script>

<style scoped lang="scss">
  .character-edit-dialog {
    :deep(.el-dialog__header) {
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e5e7eb;

      .el-dialog__title {
        color: #1f2937;
        font-size: 18px;
        font-weight: 600;
      }
    }

    :deep(.el-dialog__body) {
      padding: 24px;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .character-content {
      min-height: 400px;
      max-height: 500px;
      overflow-y: auto;

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #9ca3af;
        font-size: 14px;
      }

      .role-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .role-group {
        border-radius: 12px;
        background: #f7f8fa;
        padding: 20px;

        .role-header {
          flex-shrink: 0;
          color: #1d2129;
          font-size: 13px;
          line-height: 13px;
          margin-bottom: 16px;
        }

        .costume-list {
          flex: 1;
          display: flex;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 8px;
          padding-top: 8px;

          // 滚动条样式
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;

          &::-webkit-scrollbar {
            height: 6px;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }

          &::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 3px;
          }

          // hover时显示滚动条
          &:hover {
            scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);

            &::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.05);
              border-radius: 3px;
            }

            &::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.2);

              &:hover {
                background: rgba(0, 0, 0, 0.3);
              }
            }
          }

          .costume-item {
            position: relative;
            flex-shrink: 0;
            cursor: pointer;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            border: 2px solid transparent;
            transition: all 0.2s ease;

            &:hover {
              border-color: #e5e7eb;
              transform: translateY(-2px);
            }

            &.selected {
              border-color: #5b5bff;
              box-shadow: 0 0 0 2px rgba(91, 91, 255, 0.1);
            }

            .costume-image-wrapper {
              position: relative;
              width: 100%;
              height: 160px;
              background: #f9fafb;
            }

            .costume-image {
              width: 100%;
              height: 100%;
              display: block;

              .image-error {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background-color: #f3f4f6;
                color: #d1d5db;
                font-size: 32px;
              }
            }

            .costume-name {
              position: absolute;
              bottom: 12px;
              left: 12px;
              color: #fff;
              font-size: 12px;
              line-height: 12px; /* 100% */
              width: 40px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: center;
      gap: 16px;

      .cancel-btn {
        min-width: 100px;
        height: 36px;
        border-radius: 6px;
        font-size: 14px;
        color: #6b7280;
        background: #fff;
        border: 1px solid #e5e7eb;

        &:hover {
          color: #374151;
          border-color: #d1d5db;
          background: #f9fafb;
        }
      }

      .confirm-btn {
        min-width: 100px;
        height: 36px;
        border-radius: 6px;
        font-size: 14px;
        background: #5b5bff;
        border-color: #5b5bff;

        &:hover {
          background: #4a4aee;
          border-color: #4a4aee;
        }
      }
    }
  }
</style>
