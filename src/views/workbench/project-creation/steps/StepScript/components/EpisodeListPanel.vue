<template>
  <div class="episode-list-panel">
    <div class="section-title">
      <el-icon><Film /></el-icon>
      <span>剧集列表</span>
    </div>

    <div class="add-box">
      <div class="add-episode-btn" @click="handleAdd">
        <span>新增剧集</span>
        <svg-icon icon-class="fy-add" />
      </div>
    </div>

    <div class="episode-list">
      <!-- 没有剧集时显示 -->
      <div v-if="episodes.length === 0" class="empty-state">暂无剧集</div>

      <!-- 剧集列表 -->
      <template v-else>
        <div
          v-for="episode in episodes"
          :key="episode.id"
          class="episode-item"
          :class="{ active: episode.id === selectedId }"
          @click="handleSelect(episode.id)"
        >
          <div class="episode-info">
            <el-tooltip :content="episode.name" placement="top" :disabled="!isNameOverflow(episode.name)">
              <span class="episode-name">{{ episode.name }}</span>
            </el-tooltip>
            <div v-if="showProgress" class="progress-badge">{{ episode.progress || 0 }}%</div>
          </div>
          <el-dropdown
            trigger="click"
            @command="handleCommand"
            @visible-change="(visible: boolean) => visible && setCurrentEpisode(episode)"
          >
            <el-icon class="more-icon" @click.stop>
              <MoreFilled />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon><Edit /></el-icon>
                  重命名
                </el-dropdown-item>
                <el-dropdown-item command="delete">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Episode } from '@/api/workbench/project/types';
  import { Delete, Edit, Film, MoreFilled } from '@element-plus/icons-vue';
  import { ref } from 'vue';

  interface Props {
    episodes: Episode[];
    selectedId?: string | number | null;
    showProgress?: boolean; // 是否显示进度百分比
  }

  withDefaults(defineProps<Props>(), {
    selectedId: null,
    showProgress: true
  });

  interface Emits {
    (e: 'select', id: string | number): void;
    (e: 'add'): void;
    (e: 'rename', episode: Episode): void;
    (e: 'delete', episode: Episode): void;
  }

  const emits = defineEmits<Emits>();

  const currentEpisode = ref<Episode | null>(null);

  // 判断名称是否溢出（简单判断：超过8个字符认为可能溢出）
  const isNameOverflow = (name: string | undefined): boolean => {
    if (!name) return false;
    return name.length > 8;
  };

  // 选择剧集
  const handleSelect = (id: string | number) => {
    emits('select', id);
  };

  // 新增剧集
  const handleAdd = () => {
    emits('add');
  };

  // 设置当前剧集
  const setCurrentEpisode = (episode: Episode) => {
    currentEpisode.value = episode;
  };

  // 处理下拉菜单命令
  const handleCommand = (command: string) => {
    if (!currentEpisode.value) return;

    if (command === 'rename') {
      emits('rename', currentEpisode.value);
    } else if (command === 'delete') {
      emits('delete', currentEpisode.value);
    }
  };
</script>

<style scoped lang="scss">
  .episode-list-panel {
    display: flex;
    flex-direction: column;
    min-width: 200px;
    max-width: 280px;
    // margin-right: 16px;
    gap: 12px;
    padding: 20px 16px;
    overflow: hidden;
    border-radius: 16px;
    background: white;
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
    height: 100%;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f2f5;
      color: #303133;
      font-size: 14px;
      font-weight: 600;

      .el-icon {
        color: #5252ff;
        font-size: 20px;
      }
    }

    .add-box {
      .add-episode-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        padding: 12px;
        border: 1px solid #d6d7ff;
        border-radius: 12px;
        background: white;
        color: #5252ff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #5252ff;
          background: #f5f5ff;
          box-shadow: 0 2px 8px rgb(82 82 255 / 15%);
        }
      }
    }

    .episode-list {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;

      // 隐藏滚动条但保留滚动功能
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 32px 16px;
        color: #909399;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
      }

      .episode-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        border-radius: 12px;
        background: #f9fafb;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f5f5ff;
        }
        .progress-badge {
          padding: 2px 5px;
          border-radius: 4px;
          background: #f3f3ff;
          color: #5252ff;
          font-size: 8px;
          font-weight: 500;
          border-radius: 4px;
          border: 0.625px solid #d6d7ff;
          margin-right: 4px;
        }
        &.active {
          background: #f3f3ff;
          color: #5252ff;

          .more-icon {
            color: #5252ff;
          }
        }

        .episode-info {
          display: flex;
          flex: 1;
          align-items: center;
          gap: 8px;

          .episode-name {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100px;
          }

          .episode-progress {
            flex-shrink: 0;
            background: #f0f0f0;
            border-color: #e0e0e0;
            color: #909399;
            font-size: 12px;
            font-weight: 500;
          }
        }

        .more-icon {
          color: #909399;
          font-size: 18px;
          transition: all 0.3s;

          &:hover {
            color: #5252ff;
          }
        }
      }
    }
  }
</style>
