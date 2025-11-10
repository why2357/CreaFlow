<template>
  <el-dialog
    v-model="dialogVisible"
    title="场景库"
    width="988px"
    :close-on-click-modal="false"
    class="scene-library-dialog"
    @close="handleClose"
  >
    <!-- 剧集筛选 -->
    <div class="episode-filter">
      <div class="filter-tabs">
        <div class="filter-tab" :class="{ active: selectedEpisodeId === null }" @click="handleEpisodeChange(null)">
          全部
        </div>
        <div
          v-for="episode in episodes"
          :key="episode.episodeId"
          class="filter-tab"
          :class="{ active: selectedEpisodeId === episode.episodeId }"
          @click="handleEpisodeChange(episode.episodeId!)"
        >
          {{ episode.episodeName }}
        </div>
      </div>
    </div>

    <!-- 场景库内容 -->
    <div v-loading="loading" class="scene-content">
      <div v-if="sceneLibraries.length === 0" class="empty-state">
        <p>暂无场景数据</p>
      </div>
      <div v-else class="scene-libraries">
        <div v-for="library in sceneLibraries" :key="library.libraryId" class="library-section">
          <div class="library-header">
            <div class="library-name-tag">{{ library.name }}</div>
            <!-- 编辑集数按钮 -->
            <div class="episode-section">
              <EpisodeSelector
                v-if="currentEditLibrary?.libraryId === library.libraryId"
                v-model="episodePopoverVisible"
                :episode-list="episodes"
                :selected-episode-ids="selectedEpisodeIds"
                :loading="submitting"
                @confirm="confirmEditEpisodes"
                @close="handleEpisodeSelectorClose"
              >
                <template #reference>
                  <el-button size="small" class="edit-episodes-btn" @click="handleEditEpisodes(library)">
                    + 编辑集数
                  </el-button>
                </template>
              </EpisodeSelector>
              <el-button v-else size="small" class="edit-episodes-btn" @click="handleEditEpisodes(library)">
                + 编辑集数
              </el-button>

              <!-- 集数标签显示 -->
              <div v-if="library.episodeList && library.episodeList.length > 0" class="episode-tags">
                <el-tag v-for="(ep, idx) in getDisplayEpisodes(library.episodeList)" :key="idx" size="small">
                  {{ ep.episodeName }}
                </el-tag>
                <el-tag v-if="getExtraEpisodeCount(library.episodeList) > 0" size="small">
                  +{{ getExtraEpisodeCount(library.episodeList) }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="library-items">
            <div
              v-for="item in library.librarySubInfoList"
              :key="item.libraryDetailId"
              class="scene-item"
              :class="{ selected: selectedSceneId === item.materialVo.id }"
              @click="handleSelectScene(item)"
            >
              <div class="scene-image-wrapper">
                <el-image :src="item.ossUrl" fit="cover" class="scene-image">
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="scene-name">{{ item.detailName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">取消</el-button>
        <el-button class="confirm-btn" type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { bindEpisode, getSceneDetail } from '@/api/workbench/library';
  import type { EpisodeInfo, LibraryItemInfo, LibrarySubInfo } from '@/api/workbench/project/types';
  import { LibraryType } from '@/api/workbench/project/types';
  import { Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { nextTick, onUnmounted, ref, watch } from 'vue';
  import EpisodeSelector from '../../components/EpisodeSelector.vue';

  interface Props {
    modelValue: boolean;
    projectId: number;
    episodes: EpisodeInfo[];
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', scene: LibrarySubInfo): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const dialogVisible = ref(false);
  const loading = ref(false);
  const submitting = ref(false);
  const selectedEpisodeId = ref<number | null>(null);
  const sceneLibraries = ref<LibraryItemInfo[]>([]);
  const selectedSceneId = ref<number>();
  const selectedScene = ref<LibrarySubInfo>();
  const episodePopoverVisible = ref(false);
  const currentEditLibrary = ref<LibraryItemInfo | null>(null);
  const selectedEpisodeIds = ref<number[]>([]);

  // 重置状态
  const resetState = () => {
    selectedSceneId.value = undefined;
    selectedScene.value = undefined;
    sceneLibraries.value = [];
  };

  // 设置横向滚动
  const setupHorizontalScroll = () => {
    nextTick(() => {
      const scrollWrappers = document.querySelectorAll('.scene-library-dialog .library-items');

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
    const scrollWrappers = document.querySelectorAll('.scene-library-dialog .library-items');
    scrollWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });
  });

  // 加载场景库列表（按剧集筛选）
  const loadSceneLibraries = async () => {
    if (!selectedEpisodeId.value) return;

    loading.value = true;
    try {
      const res = await getSceneDetail({
        projectId: props.projectId,
        episodeId: selectedEpisodeId.value
      });
      sceneLibraries.value = res.data?.libraryItemInfoList || [];
      // 数据加载后设置横向滚动
      setupHorizontalScroll();
    } catch (error) {
      console.error('加载场景库失败:', error);
      sceneLibraries.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 加载所有场景库列表
  const loadAllSceneLibraries = async () => {
    loading.value = true;
    try {
      const res = await getSceneDetail({
        projectId: props.projectId
      });
      sceneLibraries.value = res.data?.libraryItemInfoList || [];
      // 数据加载后设置横向滚动
      setupHorizontalScroll();
    } catch (error) {
      console.error('加载场景库失败:', error);
      sceneLibraries.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 切换剧集
  const handleEpisodeChange = (episodeId: number | null) => {
    selectedEpisodeId.value = episodeId;
    selectedSceneId.value = undefined;
    selectedScene.value = undefined;
    if (episodeId !== null) {
      loadSceneLibraries();
    } else {
      // 选择"全部"时，加载所有场景
      loadAllSceneLibraries();
    }
  };

  // 选择场景
  const handleSelectScene = (scene: LibrarySubInfo) => {
    selectedSceneId.value = scene.materialVo.id || undefined;
    selectedScene.value = scene;
  };

  // 确认选择
  const handleConfirm = () => {
    if (!selectedScene.value) {
      return;
    }
    emit('confirm', selectedScene.value);
    handleClose();
  };

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false;
  };

  // 获取显示的剧集（最多3个）
  const getDisplayEpisodes = (episodes: EpisodeInfo[]) => {
    return episodes.slice(0, 3);
  };

  // 获取超出数量
  const getExtraEpisodeCount = (episodes: EpisodeInfo[]) => {
    return Math.max(0, episodes.length - 3);
  };

  // 编辑集数（针对场景库分组）
  const handleEditEpisodes = (library: LibraryItemInfo) => {
    currentEditLibrary.value = library;
    selectedEpisodeIds.value =
      library.episodeList?.map((ep) => ep.episodeId).filter((id): id is number => id !== undefined && id !== null) ??
      [];
    episodePopoverVisible.value = true;
  };

  // 关闭集数选择器
  const handleEpisodeSelectorClose = () => {
    currentEditLibrary.value = null;
  };

  // 确认编辑集数
  const confirmEditEpisodes = async (selectedIds: number[]) => {
    if (!currentEditLibrary.value || !currentEditLibrary.value.libraryId) {
      ElMessage.warning('缺少必要的参数');
      return;
    }

    submitting.value = true;
    try {
      await bindEpisode({
        episodeIdList: selectedIds,
        libraryType: LibraryType.SCENE, // 2：场景
        relationId: currentEditLibrary.value.libraryId // 场景关联剧集时给libraryId
      });

      ElMessage.success('剧集关联成功');
      episodePopoverVisible.value = false;
      // 刷新数据以更新显示
      if (selectedEpisodeId.value !== null) {
        await loadSceneLibraries();
      } else {
        await loadAllSceneLibraries();
      }
    } catch (error) {
      console.error('剧集关联失败:', error);
      ElMessage.error('剧集关联失败');
    } finally {
      submitting.value = false;
    }
  };

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
      if (val) {
        // 打开弹窗时，默认选择"全部"
        selectedEpisodeId.value = null;
        loadAllSceneLibraries();
      } else {
        // 关闭弹窗时重置状态
        resetState();
      }
    },
    { immediate: true }
  );

  // 监听 dialogVisible 变化
  watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
  });
</script>

<style scoped lang="scss">
  .scene-library-dialog {
    :deep(.el-dialog__header) {
      padding: 24px 24px 16px;

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
    }

    .episode-filter {
      margin-bottom: 20px;
      padding-bottom: 16px;

      .filter-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;

        // 隐藏滚动条但保持滚动功能
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;

        &::-webkit-scrollbar {
          height: 4px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: transparent;
        }

        &:hover {
          scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);

          &::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
          }
        }
      }

      .filter-tab {
        flex-shrink: 0;
        padding: 6px 16px;
        border-radius: 6px;
        background: #fff;
        border: 1px solid #eee;
        color: #86909c;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e8f3ff;
          color: #5b5bff;
        }

        &.active {
          background: #5b5bff;
          color: white;
          border-color: #5b5bff;
        }
      }
    }

    .scene-content {
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

      .scene-libraries {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .library-section {
        border-radius: 12px;
        background: #f7f8fa;
        padding: 20px;

        .library-header {
          display: flex;
          margin-bottom: 16px;

          .library-name-tag {
            flex-shrink: 0;
            color: #1d2129;
            font-size: 13px;
            line-height: 13px;
            font-weight: 500;
          }

          .episode-section {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            justify-content: flex-end;

            .edit-episodes-btn {
              height: 24px;
              padding: 4px 12px;
              font-size: 12px;
              border-radius: 4px;
              background: white;
              border: 1px solid #e5e7eb;
              color: #6b7280;

              &:hover {
                color: #5b5bff;
                border-color: #5b5bff;
                background: #f5f3ff;
              }
            }

            .episode-tags {
              display: flex;
              align-items: center;
              gap: 4px;
              flex-wrap: wrap;

              .el-tag {
                height: 22px;
                padding: 0 8px;
                font-size: 12px;
                border: none;
                background: rgba(91, 91, 255, 0.1);
                color: #5b5bff;
              }
            }
          }
        }

        .library-items {
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

          .scene-item {
            position: relative;
            flex-shrink: 0;
            width: 140px;
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

            .scene-image-wrapper {
              position: relative;
              width: 100%;
              height: 160px;
              background: #f9fafb;
            }

            .scene-image {
              width: 100%;
              height: 100%;
              display: block;

              :deep(img) {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

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

            .scene-name {
              position: absolute;
              bottom: 12px;
              left: 12px;
              color: #fff;
              font-size: 12px;
              line-height: 12px;
              max-width: calc(100% - 24px);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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
