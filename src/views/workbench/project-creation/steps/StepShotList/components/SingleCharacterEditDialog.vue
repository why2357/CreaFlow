<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择服装"
    width="988px"
    :close-on-click-modal="false"
    class="single-character-edit-dialog"
    @close="handleClose"
  >
    <!-- 角色服装内容 -->
    <div v-loading="loading" class="character-content">
      <div v-if="!roleData" class="empty-state">
        <p>暂无角色数据</p>
      </div>
      <div v-else class="role-container">
        <!-- 角色标题和服装列表 -->
        <div class="role-group">
          <!-- 角色标题 -->
          <div class="role-header">
            <div class="role-name-tag">{{ roleData.roleName }}</div>
          </div>

          <!-- 服装列表 -->
          <div class="costume-list">
            <div
              v-for="detail in roleData.details"
              :key="detail.detailId"
              class="costume-item"
              :class="{ selected: detail.selected }"
              @click="toggleSelection(detail.detailId)"
            >
              <div class="costume-image-wrapper">
                <el-image :src="detail.previewUrl || detail.originUrl" fit="contain" class="costume-image">
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
  import { editSceneRole, querySceneRole } from '@/api/workbench/storyboard';
  import type { QuerySceneRoleResponse } from '@/api/workbench/storyboard/types';
  import { Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
  import EpisodeTagsDisplay from '../../components/EpisodeTagsDisplay.vue';

  // Props
  interface Props {
    modelValue: boolean;
    basicId?: number | null; // 场景基础信息ID（对应 characterId）
    episodeId?: number | null;
    roleId?: number | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    basicId: null,
    episodeId: null,
    roleId: null
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
  const roleData = ref<QuerySceneRoleResponse | null>(null);

  // 对话框显示状态
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  // 监听对话框打开
  watch(dialogVisible, (newVal) => {
    if (newVal) {
      loadRoleData();
    }
  });

  // 设置横向滚动
  const setupHorizontalScroll = () => {
    nextTick(() => {
      const scrollWrappers = document.querySelectorAll('.single-character-edit-dialog .costume-list');

      scrollWrappers.forEach((wrapper) => {
        const handleWheel = (e: Event) => {
          const wheelEvent = e as WheelEvent;
          // 只处理垂直滚动
          if (wheelEvent.deltaY !== 0) {
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
    const scrollWrappers = document.querySelectorAll('.single-character-edit-dialog .costume-list');
    scrollWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });
  });

  // 加载角色数据
  const loadRoleData = async () => {
    if (!props.basicId || !props.episodeId || !props.roleId) {
      ElMessage.warning('缺少必要参数');
      return;
    }

    loading.value = true;
    try {
      const res = await querySceneRole({
        basicId: String(props.basicId),
        episodeId: String(props.episodeId),
        roleId: String(props.roleId)
      });

      roleData.value = res.data;

      // 数据加载后设置横向滚动
      setupHorizontalScroll();
    } catch (error) {
      console.error('加载角色数据失败:', error);
      roleData.value = null;
    } finally {
      loading.value = false;
    }
  };

  // 切换选中状态（单选模式）
  const toggleSelection = (detailId: number) => {
    if (!roleData.value) return;

    // 取消所有选中
    roleData.value.details.forEach((d) => {
      d.selected = false;
    });

    // 选中当前点击的
    const detail = roleData.value.details.find((d) => d.detailId === detailId);
    if (detail) {
      detail.selected = true;
    }
  };

  // 确认提交
  const handleConfirm = async () => {
    if (!props.basicId || !roleData.value) {
      ElMessage.warning('缺少必要参数');
      return;
    }

    // 收集选中的服装
    const selectedDetails = roleData.value.details.filter((d) => d.selected);

    if (selectedDetails.length === 0) {
      ElMessage.warning('请至少选择一个服装');
      return;
    }

    if (selectedDetails.length > 1) {
      ElMessage.warning('只能选择一个服装');
      return;
    }

    submitting.value = true;
    try {
      await editSceneRole({
        basicId: props.basicId,
        sceneRole: {
          roleId: roleData.value.roleId,
          detailId: selectedDetails[0].detailId
        }
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
  .single-character-edit-dialog {
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
      max-height: 440px;
      overflow-y: auto;

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #9ca3af;
        font-size: 14px;
      }

      .role-container {
        margin-bottom: 20px;
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
            padding-top: 8px;
            padding-bottom: 8px;

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
                line-height: 12px;
                width: 40px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
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
