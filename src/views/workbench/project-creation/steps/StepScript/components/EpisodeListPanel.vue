<template>
  <div class="episode-list-panel">
    <div class="section-title">
      <svg-icon icon-class="fy-juji" style="width: 16px; height: 16px" />
      <span>剧集列表</span>
    </div>

    <div class="add-box" v-has-project-permi="['episode-create']">
      <div class="add-episode-btn" @click="handleAdd">
        <span>新增剧集</span>
        <svg-icon icon-class="fy-add" />
      </div>
    </div>

    <div class="episode-list">
      <!-- 没有剧集时显示 -->
      <div v-if="episodes.length === 0" class="empty-state">暂无列表</div>

      <!-- 剧集列表 -->
      <template v-else>
        <div
          v-for="episode in episodes"
          :key="episode.id"
          class="episode-item"
          :class="{ active: episode.id === selectedId }"
          @click="handleSelect(episode.id, episode.taskStatus)"
        >
          <div class="episode-info">
            <el-tooltip :content="episode.name" placement="top" :disabled="!isNameOverflow(episode.name)">
              <span class="episode-name">{{ episode.name }}</span>
            </el-tooltip>

            <!-- 工作流模式徽标 -->
            <span v-if="episode.workflowMode === 'seedance'" class="mode-badge mode-badge--seedance">
              Seedance
            </span>

            <div v-if="showProgress" class="progress-badge">{{ episode.progress || 0 }}%</div>

            <!-- 任务状态显示 -->
            <div v-if="episode.taskStatus === 1 && !showProgress" class="status-badge generating">
              <span>生成中...</span>
            </div>
            <div v-else-if="episode.taskStatus === 3 && !showProgress" class="status-badge failed">
              <span>生成失败</span>
              <svg-icon icon-class="fy-refresh" class="retry-icon" />
            </div>
          </div>
          <el-dropdown
            trigger="click"
            v-has-project-permi="['episode-rename', 'episode-delete']"
            @command="handleCommand"
            @visible-change="(visible: boolean) => visible && setCurrentEpisode(episode)"
          >
            <div class="action-btn" @click.stop>
              <svg-icon icon-class="fy-more" style="width: 12px; height: 12px" />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <div v-has-project-permi="['episode-rename']">
                  <el-dropdown-item command="rename">
                    <svg-icon icon-class="fy-pen" style="width: 16px; height: 16px; margin-right: 8px" />
                    重命名
                  </el-dropdown-item>
                </div>
                <div v-has-project-permi="['episode-delete']">
                  <el-dropdown-item command="delete" class="delete-item">
                    <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 8px" />
                    删除
                  </el-dropdown-item>
                </div>
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
    (e: 'select', id: string | number, taskStatus?: number): void;
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
  const handleSelect = (id: string | number, taskStatus?: number) => {
    emits('select', id, taskStatus);
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
  // 删除选项红色高亮
  :deep(.delete-item) {
    &:hover {
      color: #f56c6c;

      .el-icon {
        color: #f56c6c;
      }
    }
  }
  .episode-list-panel {
    display: flex;
    flex-direction: column;
    // min-width: 200px;
    max-width: 280px;
    // margin-right: 16px;
    gap: 12px;
    padding: 20px;
    overflow: hidden;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.25), 0 10px 15px 0 rgba(224, 231, 255, 0.5);
    height: 100%;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #303133;
      font-size: 14px;
      font-weight: 600;

      .el-icon {
        color: #5252ff;
        font-size: 16px;
      }
    }

    .add-box {
      .add-episode-btn {
        height: 34px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        padding: 0 12px;
        border: 1px solid #d6d7ff;
        border-radius: 8px;
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
        height: 100%;
        width: 100%;
        padding: 32px 16px;
        color: #4e5969;
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

          .mode-badge {
            flex-shrink: 0;
            padding: 1px 5px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            line-height: 16px;
            letter-spacing: 0.2px;

            &--seedance {
              color: #5252ff;
              background: #f0f0ff;
              border: 0.5px solid #d6d7ff;
            }
          }

          .status-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
            flex-shrink: 0;

            &.generating {
              color: #86909c;
              margin-right: 13px;
            }

            &.failed {
              color: #f53f3f;
              margin-right: 13px;

              .retry-icon {
                width: 12px;
                height: 12px;
              }
            }
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
      }
    }
  }
  .action-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    transition: all 0.3s;
    margin-left: 4px;

    &:hover {
      background: white;
      transform: scale(1.1);
    }

    .el-icon {
      color: #606266;
      font-size: 18px;
    }
  }
</style>
