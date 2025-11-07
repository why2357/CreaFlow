<template>
  <el-dialog
    v-model="dialogVisible"
    title="角色编辑"
    width="1200px"
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
            <h3 class="role-name">{{ role.roleName }}</h3>
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
              <el-image :src="detail.previewUrl || detail.originUrl" fit="cover" class="costume-image">
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="costume-name">{{ detail.name }}</div>

              <!-- 选中标记 -->
              <div v-if="detail.selected" class="selected-mark">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { editEpisodeRole, queryEpisodeRole } from '@/api/workbench/episode';
  import type { RoleData } from '@/api/workbench/episode/types';
  import { Check, Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';

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
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 切换选中状态
  const toggleSelection = (roleId: number, detailId: number) => {
    const role = roleList.value.find((r) => r.roleId === roleId);
    if (!role) return;

    const detail = role.details.find((d) => d.detailId === detailId);
    if (!detail) return;

    // 切换选中状态
    detail.selected = !detail.selected;
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
    .character-content {
      min-height: 400px;
      max-height: 600px;
      overflow-y: auto;

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #999;
        font-size: 14px;
      }

      .role-list {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .role-group {
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.25), 0 10px 15px 0 rgba(224, 231, 255, 0.5);
        padding: 20px;

        .role-header {
          margin-bottom: 16px;

          .role-name {
            margin: 0;
            color: #262626;
            font-size: 18px;
            font-weight: 600;
          }
        }

        .costume-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;

          .costume-item {
            position: relative;
            cursor: pointer;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid transparent;
            background: white;
            transition: all 0.3s;

            &:hover {
              transform: translateY(-4px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            &.selected {
              border-color: #5252ff;
              box-shadow: 0 4px 12px rgba(82, 82, 255, 0.3);
            }

            .costume-image {
              width: 100%;
              height: 200px;
              display: block;

              .image-error {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background-color: #f5f7fa;
                color: #c0c4cc;
                font-size: 32px;
              }
            }

            .costume-name {
              padding: 8px 12px;
              font-size: 14px;
              color: #606266;
              text-align: center;
              background-color: #fff;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .selected-mark {
              position: absolute;
              top: 8px;
              left: 8px;
              width: 28px;
              height: 28px;
              background-color: #5252ff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(82, 82, 255, 0.4);
            }
          }
        }
      }
    }
  }
</style>
