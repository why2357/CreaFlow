<template>
  <div class="model-admin-container">
    <!-- Header -->
    <div class="header">
      <div class="title">模型路由策略表</div>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <el-table v-loading="loading" :data="modelMainList" stripe style="width: 100%">
        <!-- 模型名称列 -->
        <el-table-column label="模型名称" min-width="200">
          <template #default="{ row }">
            <div class="model-info">
              <!-- 可编辑的模型名称 -->
              <div class="model-name-wrapper">
                <el-input
                  v-if="editingMainId === row.id"
                  v-model="editingModelName"
                  size="small"
                  class="edit-input"
                  @blur="handleSaveModelName(row)"
                  @keyup.enter="handleSaveModelName(row)"
                  ref="editInputRef"
                />
                <div v-else class="model-name" @dblclick="handleEditModelName(row)">
                  {{ row.modelName }}
                  <el-icon class="edit-icon" @click.stop="handleEditModelName(row)">
                    <Edit />
                  </el-icon>
                </div>
              </div>
              <div v-if="row.modelVoList && row.modelVoList[0]" class="model-id">ID: {{ row.modelCode }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 前端显示列 -->
        <el-table-column label="前端显示" min-width="300" align="center">
          <template #default="{ row }">
            <div class="display-controls">
              <el-button
                :type="row.selectStatus === 0 ? 'primary' : ''"
                :plain="row.selectStatus !== 0"
                size="small"
                @click="handleStatusChange(row, 0)"
              >
                显示
              </el-button>
              <el-button
                :type="row.selectStatus === 1 ? 'info' : ''"
                :plain="row.selectStatus !== 1"
                size="small"
                @click="handleStatusChange(row, 1)"
              >
                隐藏
              </el-button>
            </div>
          </template>
        </el-table-column>

        <!-- 供应商选择列 -->
        <el-table-column label="供应商选择" min-width="350" align="center">
          <template #default="{ row }">
            <div class="channel-controls">
              <template v-if="row.modelVoList && row.modelVoList.length > 0">
                <el-button
                  v-for="config in row.modelVoList"
                  :key="config.id"
                  :type="config.id === row.selectId ? 'primary' : ''"
                  :plain="config.id !== row.selectId"
                  size="small"
                  @click="handleChannelSwitch(row, config)"
                >
                  {{ config.channel === 1 ? '灵客 Linker' : config.channel === 2 ? '官方 Official' : '未知渠道' }}
                </el-button>
              </template>
              <span v-else class="no-channel">暂无供应商</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup name="Model" lang="ts">
  import { getModelMainList, updateModelMain } from '@/api/model/main';
  import type { HivisionProjectModelMainVo, HivisionProjectModelVo } from '@/api/model/main/types';
  import { Edit } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { nextTick, onMounted, ref } from 'vue';

  // 扩展主表数据结构，添加当前选中的配置信息
  interface EnhancedModelMain extends HivisionProjectModelMainVo {
    selectId?: number; // 当前选中的配置ID
    selectStatus?: number; // 当前选中配置的状态
    selectChannel?: number; // 当前选中配置的渠道
  }

  // 数据状态
  const modelMainList = ref<EnhancedModelMain[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const pageNum = ref(1);
  const pageSize = ref(20);

  // 编辑状态
  const editingMainId = ref<number | null>(null);
  const editingModelName = ref('');
  const editInputRef = ref();

  // 初始化加载数据
  onMounted(() => {
    loadModelList();
  });

  // 加载模型列表
  const loadModelList = async () => {
    try {
      loading.value = true;
      const res = await getModelMainList({
        pageNum: pageNum.value,
        pageSize: pageSize.value
      });

      // 处理数据，为每个主表添加当前选中的配置信息
      modelMainList.value = (res.rows || []).map((mainItem) => {
        // 默认选中第一个配置，或者 status=0 的第一个配置
        const defaultConfig = mainItem.modelVoList?.find((c) => c.status === 0) || mainItem.modelVoList?.[0];

        return {
          ...mainItem,
          modelCode: defaultConfig?.modelCode,
          selectId: defaultConfig?.id,
          selectStatus: defaultConfig?.status,
          selectChannel: defaultConfig?.channel
        };
      });

      total.value = res.total || 0;
    } catch (error) {
      console.error('加载模型列表失败:', error);
      ElMessage.error('加载模型列表失败');
    } finally {
      loading.value = false;
    }
  };

  // 开始编辑模型名称
  const handleEditModelName = (row: EnhancedModelMain) => {
    editingMainId.value = row.id || null;
    editingModelName.value = row.modelName || '';

    // 下一帧聚焦输入框
    nextTick(() => {
      if (editInputRef.value) {
        const input = Array.isArray(editInputRef.value) ? editInputRef.value[0] : editInputRef.value;
        input?.focus();
      }
    });
  };

  // 保存模型名称
  const handleSaveModelName = async (row: EnhancedModelMain) => {
    // 如果名称没有变化，直接取消编辑
    if (editingModelName.value === row.modelName) {
      editingMainId.value = null;
      return;
    }

    // 验证名称不能为空
    if (!editingModelName.value || editingModelName.value.trim() === '') {
      ElMessage.error('模型名称不能为空');
      editingModelName.value = row.modelName || '';
      return;
    }

    if (!row.id || !row.selectId) {
      ElMessage.error('模型ID不存在');
      editingMainId.value = null;
      return;
    }

    try {
      // 更新模型名称
      await updateModelMain({
        id: row.id,
        modelConfigId: row.selectId,
        modelName: editingModelName.value.trim(),
        status: row.selectStatus ?? 0
      });

      // 刷新数据列表
      await loadModelList();
      ElMessage.success('模型名称更新成功');
    } catch (error) {
      console.error('更新模型名称失败:', error);
      ElMessage.error('更新失败，请重试');
    } finally {
      editingMainId.value = null;
    }
  };

  // 更新模型状态（显示/隐藏）
  const handleStatusChange = async (row: EnhancedModelMain, status: number) => {
    if (!row.id || !row.selectId) {
      ElMessage.error('模型ID不存在');
      return;
    }

    // 如果状态相同，不需要更新
    if (row.selectStatus === status) {
      return;
    }

    try {
      // 更新状态
      await updateModelMain({
        id: row.id,
        modelConfigId: row.selectId,
        modelName: row.modelName || '',
        status
      });

      // 更新本地数据：更新 selectStatus 和 modelVoList 中对应配置的 status
      row.selectStatus = status;

      // 同步更新 modelVoList 中对应配置的 status
      if (row.modelVoList) {
        const targetConfig = row.modelVoList.find((config) => config.id === row.selectId);
        if (targetConfig) {
          targetConfig.status = status;
        }
      }

      ElMessage.success(`已${status === 0 ? '显示' : '隐藏'}模型`);
    } catch (error) {
      console.error('更新模型状态失败:', error);
      ElMessage.error('更新失败，请重试');
    }
  };

  // 切换供应商
  const handleChannelSwitch = (row: EnhancedModelMain, targetConfig: HivisionProjectModelVo) => {
    // 如果点击的是当前选中的配置，不需要切换
    if (row.selectId === targetConfig.id) {
      return;
    }

    // 更新当前选中的配置信息
    row.selectId = targetConfig.id;
    row.selectStatus = targetConfig.status;
    row.selectChannel = targetConfig.channel;

    ElMessage.success(
      `已切换至${targetConfig.channel === 1 ? '灵客 Linker' : '官方 Official'}（ID: ${targetConfig.modelCode}）`
    );
  };

  // 分页大小改变
  const handleSizeChange = (size: number) => {
    pageSize.value = size;
    pageNum.value = 1;
    loadModelList();
  };

  // 当前页改变
  const handleCurrentChange = (page: number) => {
    pageNum.value = page;
    loadModelList();
  };
</script>

<style scoped lang="scss">
  .model-admin-container {
    width: 100%;
    height: 100%;
    padding: 20px;
    background: #f5f7fa;

    .header {
      margin-bottom: 20px;

      .title {
        font-size: 20px;
        font-weight: 600;
        color: #1d2129;
      }
    }

    .table-wrapper {
      background: white;
      border-radius: 8px;
      padding: 20px;

      .model-info {
        .model-name-wrapper {
          margin-bottom: 4px;

          .edit-input {
            width: 100%;
          }

          .model-name {
            font-size: 14px;
            font-weight: 500;
            color: #1d2129;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;

            &:hover {
              color: #409eff;

              .edit-icon {
                opacity: 1;
              }
            }

            .edit-icon {
              font-size: 14px;
              opacity: 0;
              transition: opacity 0.2s;
              cursor: pointer;

              &:hover {
                color: #409eff;
              }
            }
          }
        }

        .model-id {
          font-size: 12px;
          color: #86909c;
        }
      }

      .display-controls {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .channel-controls {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;

        .no-channel {
          color: #86909c;
          font-size: 14px;
        }

        :deep(.el-button) {
          min-width: 100px;
        }
      }

      .pagination {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
    }
  }

  // 自定义按钮样式
  :deep(.el-button) {
    min-width: 80px;
    border-radius: 6px;
  }
</style>
