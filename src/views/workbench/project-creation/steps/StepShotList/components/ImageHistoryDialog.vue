<template>
  <el-dialog v-model="visible" title="历史生成记录" width="900px" :close-on-click-modal="false" @close="handleClose">
    <div class="history-container">
      <!-- 空状态 -->
      <el-empty v-if="historyList.length === 0" description="暂无历史记录" />

      <!-- 历史列表 -->
      <div v-else class="history-grid">
        <div
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
          :class="{ selected: selectedId === item.id }"
          @click="handleSelect(item.id)"
        >
          <!-- 图片 -->
          <div class="item-image">
            <el-image :src="item.imageUrl" fit="cover" :preview-src-list="[item.imageUrl]" />

            <!-- 选中标记 -->
            <div v-if="selectedId === item.id" class="selected-badge">
              <el-icon><Check /></el-icon>
            </div>
          </div>

          <!-- 信息 -->
          <div class="item-info">
            <div class="info-row">
              <span class="info-label">生成时间</span>
              <span class="info-value">{{ item.createTime }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">模型</span>
              <span class="info-value">{{ item.model }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="item-actions">
            <el-button size="small" text @click.stop="handleDownload(item)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button size="small" text type="danger" @click.stop="handleDelete(item)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!selectedId" @click="handleUseSelected">使用选中图片</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { Check, Delete, Download } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { ref, watch } from 'vue';

  interface HistoryItem {
    id: string | number;
    imageUrl: string;
    createTime: string;
    model: string;
  }

  interface Props {
    modelValue: boolean;
    shotId: string | number;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'select', imageUrl: string): void;
  }>();

  const visible = ref(false);
  const selectedId = ref<string | number | null>(null);

  // 模拟历史数据
  const historyList = ref<HistoryItem[]>([
    {
      id: 1,
      imageUrl: 'https://via.placeholder.com/300x200',
      createTime: '2025-01-20 14:30:25',
      model: 'Gemini 2.5 Pro'
    },
    {
      id: 2,
      imageUrl: 'https://via.placeholder.com/300x200',
      createTime: '2025-01-20 14:25:10',
      model: 'Jimeng'
    },
    {
      id: 3,
      imageUrl: 'https://via.placeholder.com/300x200',
      createTime: '2025-01-20 14:20:05',
      model: 'Nano Banana'
    }
  ]);

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        loadHistory();
      } else {
        selectedId.value = null;
      }
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 加载历史记录
  const loadHistory = async () => {
    // TODO: 调用接口加载历史记录
    console.log('加载历史记录', props.shotId);
  };

  // 选择图片
  const handleSelect = (id: string | number) => {
    selectedId.value = id;
  };

  // 下载图片
  const handleDownload = (item: HistoryItem) => {
    ElMessage.success(`下载图片: ${item.id}`);
    // TODO: 实现下载逻辑
  };

  // 删除历史
  const handleDelete = async (item: HistoryItem) => {
    try {
      await ElMessageBox.confirm('确定要删除这条历史记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      historyList.value = historyList.value.filter((h) => h.id !== item.id);
      ElMessage.success('删除成功');

      // TODO: 调用删除接口
    } catch {
      // 用户取消
    }
  };

  // 使用选中的图片
  const handleUseSelected = () => {
    const selected = historyList.value.find((item) => item.id === selectedId.value);
    if (selected) {
      emit('select', selected.imageUrl);
      handleClose();
    }
  };

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };
</script>

<style scoped lang="scss">
  .history-container {
    min-height: 400px;

    .history-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;

      .history-item {
        overflow: hidden;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 4px 12px rgb(64 158 255 / 30%);
          transform: translateY(-2px);
        }

        &.selected {
          border-color: #409eff;
          box-shadow: 0 4px 12px rgb(64 158 255 / 50%);
        }

        .item-image {
          position: relative;
          width: 100%;
          height: 160px;
          background: #f5f7fa;

          .el-image {
            width: 100%;
            height: 100%;
          }

          .selected-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #409eff;
            box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
            color: white;
            font-size: 16px;
          }
        }

        .item-info {
          padding: 12px;
          background: white;

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            &:last-child {
              margin-bottom: 0;
            }

            .info-label {
              color: #909399;
              font-size: 12px;
            }

            .info-value {
              color: #606266;
              font-size: 12px;
              font-weight: 500;
            }
          }
        }

        .item-actions {
          display: flex;
          justify-content: space-around;
          padding: 8px 12px;
          border-top: 1px solid #e4e7ed;
          background: #f5f7fa;

          .el-button {
            flex: 1;
          }
        }
      }
    }
  }
</style>
