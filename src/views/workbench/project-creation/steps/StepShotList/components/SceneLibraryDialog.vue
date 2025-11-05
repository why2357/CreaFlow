<template>
  <el-dialog
    v-model="dialogVisible"
    title="场景库"
    width="1200px"
    :close-on-click-modal="false"
    class="scene-library-dialog"
    @close="handleClose"
  >
    <!-- 剧集标签 -->
    <div class="episode-tabs">
      <el-button
        v-for="episode in episodes"
        :key="episode.episodeId"
        :type="selectedEpisodeId === episode.episodeId ? 'primary' : ''"
        size="small"
        @click="handleEpisodeChange(episode.episodeId!)"
      >
        {{ episode.episodeName }}
      </el-button>
    </div>

    <!-- 场景库内容 -->
    <div v-loading="loading" class="scene-content">
      <div v-if="sceneLibraries.length === 0" class="empty-state">
        <p>暂无场景数据</p>
      </div>
      <div v-else class="scene-libraries">
        <div v-for="library in sceneLibraries" :key="library.libraryId" class="library-section">
          <div class="library-header">
            <h3 class="library-name">{{ library.name }}</h3>
            <div class="episode-tags">
              <el-tag
                v-for="ep in library.episodeList"
                :key="ep.episodeId"
                size="small"
                type="warning"
                class="episode-tag"
              >
                {{ ep.episodeName }}
              </el-tag>
            </div>
          </div>
          <div class="library-items">
            <div
              v-for="item in library.librarySubInfoList"
              :key="item.libraryDetailId"
              class="scene-item"
              :class="{ selected: selectedSceneId === item.libraryDetailId }"
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
              <!-- 选中标记 -->
              <div v-if="selectedSceneId === item.libraryDetailId" class="selected-mark">
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
  import { ref, watch } from 'vue';
  import { getSceneDetail } from '@/api/workbench/library';
  import type { EpisodeInfo, LibraryItemInfo, LibrarySubInfo } from '@/api/workbench/project/types';
  import { Picture, Check } from '@element-plus/icons-vue';

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
  const selectedEpisodeId = ref<number>();
  const sceneLibraries = ref<LibraryItemInfo[]>([]);
  const selectedSceneId = ref<number>();
  const selectedScene = ref<LibrarySubInfo>();

  // 重置状态
  const resetState = () => {
    selectedSceneId.value = undefined;
    selectedScene.value = undefined;
    sceneLibraries.value = [];
  };

  // 加载场景库列表
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

  // 切换剧集
  const handleEpisodeChange = (episodeId: number) => {
    selectedEpisodeId.value = episodeId;
    selectedSceneId.value = undefined;
    selectedScene.value = undefined;
    loadSceneLibraries();
  };

  // 选择场景
  const handleSelectScene = (scene: LibrarySubInfo) => {
    selectedSceneId.value = scene.libraryDetailId;
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

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
      if (val) {
        // 打开弹窗时，默认选择第一个剧集
        if (props.episodes.length > 0) {
          selectedEpisodeId.value = props.episodes[0].episodeId;
          loadSceneLibraries();
        }
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
    .episode-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
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
        gap: 24px;
      }

      .library-section {
        .library-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;

          .library-name {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }

          .episode-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;

            .episode-tag {
              font-size: 12px;
            }
          }
        }

        .library-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;

          .scene-item {
            position: relative;
            cursor: pointer;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid transparent;
            transition: all 0.3s;

            &:hover {
              transform: translateY(-4px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            &.selected {
              border-color: #409eff;
            }

            .scene-image {
              width: 100%;
              height: 120px;
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
              padding: 8px;
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
              right: 8px;
              width: 24px;
              height: 24px;
              background-color: #409eff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
</style>
