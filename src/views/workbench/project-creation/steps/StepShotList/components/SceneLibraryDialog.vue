<template>
  <el-dialog
    v-model="dialogVisible"
    title="场景库"
    width="1200px"
    :close-on-click-modal="false"
    class="scene-library-dialog"
    @close="handleClose"
  >
    <!-- 剧集筛选 -->
    <div class="episode-filter">
      <el-scrollbar>
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
      </el-scrollbar>
    </div>

    <!-- 场景库内容 -->
    <div v-loading="loading" class="scene-content">
      <div v-if="sceneLibraries.length === 0" class="empty-state">
        <p>暂无场景数据</p>
      </div>
      <div v-else class="scene-libraries">
        <div v-for="library in sceneLibraries" :key="library.libraryId" class="library-section">
          <div class="library-header">
            <div class="library-title">
              <h3 class="library-name">{{ library.name }}</h3>
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
                    <el-button size="small" @click="handleEditEpisodes(library)">+ 编辑集数</el-button>
                  </template>
                </EpisodeSelector>
                <el-button v-else size="small" @click="handleEditEpisodes(library)">+ 编辑集数</el-button>

                <!-- 集数标签显示 -->
                <div v-if="library.episodeList && library.episodeList.length > 0" class="episode-tags">
                  <el-tag
                    v-for="(ep, idx) in getDisplayEpisodes(library.episodeList)"
                    :key="idx"
                    size="small"
                    type="warning"
                  >
                    {{ ep.episodeName }}
                  </el-tag>
                  <el-tag v-if="getExtraEpisodeCount(library.episodeList) > 0" size="small" type="warning">
                    +{{ getExtraEpisodeCount(library.episodeList) }}
                  </el-tag>
                </div>
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
              <el-image :src="item.ossUrl" fit="cover" class="scene-image">
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="scene-name">{{ item.detailName }}</div>

              <!-- 右上角剧集标签 -->
              <div v-if="item.episodeList && item.episodeList.length > 0" class="scene-episode-tags">
                <el-tag
                  v-for="(ep, idx) in getDisplayEpisodes(item.episodeList)"
                  :key="idx"
                  size="small"
                  type="warning"
                >
                  {{ ep.episodeName }}
                </el-tag>
                <el-tag v-if="getExtraEpisodeCount(item.episodeList) > 0" size="small" type="warning">
                  +{{ getExtraEpisodeCount(item.episodeList) }}
                </el-tag>
              </div>

              <!-- 选中标记 -->
              <div v-if="selectedSceneId === item.materialVo.id" class="selected-mark">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { bindEpisode, getSceneDetail } from '@/api/workbench/library';
  import type { EpisodeInfo, LibraryItemInfo, LibrarySubInfo } from '@/api/workbench/project/types';
  import { LibraryType } from '@/api/workbench/project/types';
  import { Check, Picture } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { ref, watch } from 'vue';
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
    .episode-filter {
      margin-bottom: 20px;
      overflow: hidden;

      .filter-tabs {
        display: flex;
        gap: 8px;
        white-space: nowrap;
      }

      .filter-tab {
        flex-shrink: 0;
        padding: 4px 16px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        background: white;
        color: #595959;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #5252ff;
          color: #5252ff;
        }

        &.active {
          border-color: #5252ff;
          background: #5252ff;
          color: white;
        }
      }
    }

    .scene-content {
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

      .scene-libraries {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .library-section {
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.25), 0 10px 15px 0 rgba(224, 231, 255, 0.5);
        padding: 20px;

        .library-header {
          margin-bottom: 16px;

          .library-title {
            display: flex;
            align-items: center;
            gap: 12px;

            .library-name {
              margin: 0;
              color: #262626;
              font-size: 18px;
              font-weight: 600;
            }

            .episode-section {
              display: flex;
              align-items: center;
              gap: 8px;

              .episode-tags {
                display: flex;
                align-items: center;
                gap: 4px;
                flex-wrap: wrap;
              }
            }
          }
        }

        .library-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;

          .scene-item {
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

            .scene-image {
              width: 100%;
              height: 140px;
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

            .scene-name {
              padding: 8px 12px;
              font-size: 14px;
              color: #606266;
              text-align: center;
              background-color: #fff;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            // 右上角剧集标签
            .scene-episode-tags {
              position: absolute;
              top: 8px;
              right: 8px;
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              max-width: 120px;

              .el-tag {
                flex-shrink: 0;
              }
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
