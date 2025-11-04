<template>
  <div class="episode-list-container">
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
          @contextmenu.prevent="handleShowMenu($event, episode)"
        >
          <div class="episode-info">
            <span class="episode-name">{{ episode.name }}</span>
          </div>
          <el-dropdown
            trigger="click"
            @command="handleCommand"
            @visible-change="(visible:boolean) => visible && setCurrentEpisode(episode)"
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
  }

  withDefaults(defineProps<Props>(), {
    selectedId: null
  });

  interface Emits {
    (e: 'select', id: string | number): void;
    (e: 'add'): void;
    (e: 'rename', episode: Episode): void;
    (e: 'delete', episode: Episode): void;
  }

  const emits = defineEmits<Emits>();

  const currentEpisode = ref<Episode | null>(null);

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

  // 显示右键菜单（保留用于右键点击）
  const handleShowMenu = (_event: MouseEvent, episode: Episode) => {
    // 右键菜单功能可以后续添加
    console.log('Right click menu', episode);
  };
</script>

<style scoped lang="scss">
  .episode-list-container {
    display: flex;
    flex-direction: column;
    width: 240px;
    overflow: hidden;
    border-right: 1px solid #e4e7ed;
    background: white;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      // border-bottom: 1px solid #f0f0f0;
      color: #303133;
      font-size: 14px;
      font-weight: 600;

      .el-icon {
        color: #6c5ce7;
        font-size: 18px;
      }
    }
    .add-box {
      padding: 0 20px;
    }
    .add-episode-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      padding: 12px;
      border-radius: 8px;
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

      .el-icon {
        font-size: 16px;
      }
    }
    .episode-list {
      flex: 1;
      padding: 6px 20px;
      overflow-y: auto;

      .empty-state {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        text-align: center;
        color: #4e5969;
        font-size: 14px;
      }

      .episode-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        padding: 12px;
        border-radius: 8px;
        background: #f9f9f9;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f0f0f0;
        }

        &.active {
          // border-radius: 8px;
          background: #f3f3ff;
          color: #5252ff;

          .episode-progress {
            color: rgb(255 255 255 / 80%);
          }

          .more-icon {
            color: #6c5ce7;
          }
        }

        &.add-episode {
          justify-content: center;
          gap: 6px;
          border: 1px dashed #dcdfe6;
          background: transparent;
          color: #909399;

          &:hover {
            border-color: #6c5ce7;
            background: #f9f8ff;
            color: #6c5ce7;
          }
        }

        .episode-info {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;

          .episode-name {
            font-size: 14px;
            font-weight: 500;
          }

          .episode-progress {
            color: #909399;
            font-size: 12px;
          }
        }

        .more-icon {
          color: #6c5ce7;

          font-size: 18px;
          transition: all 0.3s;

          &:hover {
            color: #6c5ce7;
          }
        }
      }
    }
  }
</style>
