<template>
  <el-dialog v-model="dialogVisible" :title="title" width="670px" :close-on-click-modal="false" @closed="handleClosed">
    <div class="edit-episode-container">
      <!-- 顶部图片预览区域 -->
      <div class="preview-section">
        <!-- 角色模式：显示服装图片 -->
        <div v-if="libraryType === LibraryType.CHARACTER" class="costume-preview">
          <el-image v-if="previewImage" :src="previewImage" fit="cover" class="preview-image">
            <template #error>
              <div class="image-error">
                <el-icon :size="40"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else class="image-placeholder">
            <el-icon :size="40"><Picture /></el-icon>
          </div>
          <!-- 已绑定的剧集标签 -->
          <div v-if="selectedEpisodeIds.length > 0" class="episode-badges">
            <el-tag v-for="(ep, idx) in getDisplayEpisodes()" :key="idx" type="warning" size="small">
              {{ ep.episodeName }}
            </el-tag>
            <el-tag v-if="getExtraEpisodeCount() > 0" type="warning" size="small">
              +{{ getExtraEpisodeCount() }}
            </el-tag>
          </div>
          <!-- 右上角三个点菜单 -->
          <div class="actions-menu">
            <el-dropdown trigger="click">
              <div class="menu-btn">
                <el-icon><MoreFilled /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>查看详情</el-dropdown-item>
                  <el-dropdown-item>下载</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 场景模式：显示场景名称 -->
        <div v-else class="scene-name-card">
          <div class="scene-title">{{ sceneName }}</div>
          <!-- 已绑定的剧集标签 -->
          <div v-if="selectedEpisodeIds.length > 0" class="episode-badges-row">
            <el-tag v-for="(ep, idx) in getDisplayEpisodes()" :key="idx" type="warning" size="small">
              {{ ep.episodeName }}
            </el-tag>
            <el-tag v-if="getExtraEpisodeCount() > 0" type="warning" size="small">
              +{{ getExtraEpisodeCount() }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 编辑集数按钮 -->
      <div class="edit-button-wrapper">
        <el-button class="edit-btn" @click="isEditing = !isEditing">
          <el-icon><Plus /></el-icon>
          编辑集数
        </el-button>
      </div>

      <!-- 剧集选择区域 -->
      <div class="episode-selection">
        <div class="selection-title">选择集数（已选{{ selectedEpisodeIds.length }}个）</div>
        <div class="episode-grid">
          <div
            v-for="episode in episodes"
            :key="episode.episodeId"
            class="episode-item"
            :class="{ selected: isSelected(episode.episodeId!) }"
            @click="toggleEpisode(episode.episodeId!)"
          >
            {{ episode.episodeName }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import type { EpisodeInfo } from '@/api/workbench/project/types';
  import { LibraryType } from '@/api/workbench/project/types';
  import { MoreFilled, Picture, Plus } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    loading?: boolean;
    libraryType: LibraryType; // 1:角色  2:场景
    relationId: number; // 服装ID或场景ID
    episodes: EpisodeInfo[]; // 剧集列表
    selectedEpisodes?: number[]; // 已选中的剧集ID
    previewImage?: string; // 预览图片（角色模式）
    sceneName?: string; // 场景名称（场景模式）
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', episodeIds: number[]): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    selectedEpisodes: () => [],
    previewImage: '',
    sceneName: ''
  });

  const emit = defineEmits<Emits>();

  // 对话框可见性
  const dialogVisible = ref(false);

  // 是否处于编辑模式
  const isEditing = ref(false);

  // 已选中的剧集ID列表
  const selectedEpisodeIds = ref<number[]>([]);

  // 对话框标题
  const title = computed(() => {
    return props.libraryType === LibraryType.CHARACTER ? '角色' : '场景';
  });

  // 监听外部 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
      if (val) {
        // 打开对话框时初始化已选中的剧集
        selectedEpisodeIds.value = [...props.selectedEpisodes];
        isEditing.value = false;
      }
    },
    { immediate: true }
  );

  // 监听内部 dialogVisible 变化
  watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
  });

  // 获取显示的剧集（最多显示2个）
  const getDisplayEpisodes = () => {
    const selectedEps = props.episodes.filter((ep) => selectedEpisodeIds.value.includes(ep.episodeId!));
    return selectedEps.slice(0, 2);
  };

  // 获取超出的数量
  const getExtraEpisodeCount = () => {
    const selectedCount = selectedEpisodeIds.value.length;
    return Math.max(0, selectedCount - 2);
  };

  // 判断是否选中
  const isSelected = (episodeId: number) => {
    return selectedEpisodeIds.value.includes(episodeId);
  };

  // 切换剧集选择
  const toggleEpisode = (episodeId: number) => {
    const index = selectedEpisodeIds.value.indexOf(episodeId);
    if (index > -1) {
      // 已选中，取消选择
      selectedEpisodeIds.value.splice(index, 1);
    } else {
      // 未选中，添加选择
      selectedEpisodeIds.value.push(episodeId);
    }
  };

  // 提交
  const handleSubmit = () => {
    if (selectedEpisodeIds.value.length === 0) {
      ElMessage.warning('请至少选择一个剧集');
      return;
    }
    emit('confirm', selectedEpisodeIds.value);
  };

  // 取消
  const handleCancel = () => {
    dialogVisible.value = false;
  };

  // 对话框关闭后重置
  const handleClosed = () => {
    selectedEpisodeIds.value = [];
    isEditing.value = false;
  };
</script>

<style scoped lang="scss">
  .edit-episode-container {
    padding: 0;
  }

  // 预览区域
  .preview-section {
    margin-bottom: 20px;
  }

  // 角色模式：服装预览
  .costume-preview {
    position: relative;
    width: 100%;
    height: 300px;
    border-radius: 12px;
    overflow: hidden;
    background: #f5f5f5;

    .preview-image {
      width: 100%;
      height: 100%;
    }

    .image-placeholder,
    .image-error {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      color: #d9d9d9;
    }

    // 剧集标签（右上角）
    .episode-badges {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: 50%;
    }

    // 操作菜单（右上角）
    .actions-menu {
      position: absolute;
      top: 12px;
      right: 12px;

      .menu-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  // 场景模式：名称卡片
  .scene-name-card {
    padding: 24px;
    border-radius: 12px;
    border: 2px dashed #e0e0e0;
    background: #fafafa;
    text-align: center;

    .scene-title {
      margin-bottom: 12px;
      color: #1d2129;
      font-size: 18px;
      font-weight: 600;
    }

    .episode-badges-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
  }

  // 编辑按钮
  .edit-button-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    .edit-btn {
      min-width: 120px;
      border-radius: 8px;
      border: 1px dashed #d9d9d9;
      background: white;
      color: #5252ff;
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        border-color: #5252ff;
        background: #f5f5ff;
      }
    }
  }

  // 剧集选择区域
  .episode-selection {
    .selection-title {
      margin-bottom: 16px;
      color: #86909c;
      font-size: 13px;
      text-align: center;
    }

    .episode-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .episode-item {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 40px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      background: white;
      color: #4e5969;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
      user-select: none;

      &:hover {
        border-color: #5252ff;
        color: #5252ff;
      }

      &.selected {
        border-color: #ff9500;
        background: #fff7e6;
        color: #ff9500;
        font-weight: 500;
      }
    }
  }

  // 对话框底部
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  // 按钮样式
  :deep(.el-button) {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;

    &.el-button--primary {
      background-color: #5252ff;
      border-color: #5252ff;

      &:hover {
        background-color: #7375ff;
        border-color: #7375ff;
      }
    }
  }

  // 标签样式
  :deep(.el-tag) {
    border-radius: 4px;

    &.el-tag--warning {
      background-color: #fff7e6;
      border-color: #ff9500;
      color: #ff9500;
    }
  }
</style>
