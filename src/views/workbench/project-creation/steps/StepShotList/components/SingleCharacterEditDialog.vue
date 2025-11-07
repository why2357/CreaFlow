<template>
  <el-dialog
    v-model="dialogVisible"
    title="角色服装编辑"
    width="800px"
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
        <!-- 角色标题 -->
        <div class="role-header">
          <h3 class="role-name">{{ roleData.roleName }}</h3>
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

    <!-- 底部操作按钮 -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { editSceneRole, querySceneRole } from '@/api/workbench/storyboard';
  import type { QuerySceneRoleResponse } from '@/api/workbench/storyboard/types';
  import { Check, Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';

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
    .character-content {
      min-height: 300px;
      max-height: 600px;
      overflow-y: auto;

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: #999;
        font-size: 14px;
      }

      .role-container {
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
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
              height: 180px;
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
