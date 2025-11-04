<template>
  <div class="step-scene">
    <!-- 顶部操作栏 -->
    <div class="scene-header">
      <!-- 左侧剧集筛选 -->
      <div class="episode-filter">
        <el-scrollbar>
          <div class="filter-tabs">
            <div class="filter-tab" :class="{ active: selectedEpisodeId === null }" @click="handleEpisodeFilter(null)">
              全部
            </div>
            <div
              v-for="episode in episodeList"
              :key="episode.episodeId"
              class="filter-tab"
              :class="{ active: selectedEpisodeId === episode.episodeId }"
              @click="handleEpisodeFilter(episode.episodeId!)"
            >
              {{ episode.episodeName }}
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧新增按钮 -->
      <el-button class="add-rigtop" type="primary" @click="handleAddSceneGroup" v-if="libraryList.length !== 0">
        <el-icon style="margin-right: 6px"><Plus /></el-icon>
        新增场景
      </el-button>
    </div>

    <!-- 场景列表内容区域 -->
    <div class="scene-content" v-loading="loading">
      <!-- 空状态 -->
      <div class="empty-box" v-if="libraryList.length === 0 && !loading">
        <img style="width: 200px; height: 200px" src="../../../../../assets/images/no-text.png" alt="" />
        <div>暂无场景，点击新增场景开始创建</div>
        <el-button class="add-sty" type="primary" @click="handleAddSceneGroup">
          <el-icon><Plus /></el-icon>
          新建
        </el-button>
      </div>

      <!-- 场景分组显示 -->
      <div v-else class="scenes-container">
        <div v-for="library in libraryList" :key="library.libraryId" class="scene-group">
          <!-- 场景组标题 -->
          <div class="group-header">
            <div class="group-title">
              <span class="group-name">{{ library.name }}</span>
              <!-- 编辑集数按钮 -->
              <div v-if="episodeList.length > 0" class="episode-section">
                <EpisodeSelector
                  v-if="currentEditLibrary?.libraryId === library.libraryId"
                  v-model="episodePopoverVisible"
                  :episode-list="episodeList"
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
                    {{ typeof ep === 'string' ? ep : ep.episodeName }}
                  </el-tag>
                  <el-tag v-if="getExtraEpisodeCount(library.episodeList) > 0" size="small" type="warning">
                    +{{ getExtraEpisodeCount(library.episodeList) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="group-actions">
              <el-dropdown trigger="click" @command="(cmd: string) => handleGroupCommand(cmd, library)">
                <el-button class="dro-btn" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="rename">
                      <el-icon><Edit /></el-icon>
                      重命名
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="delete-item">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 场景图片列表 -->
          <div class="scenes-grid">
            <!-- 上传卡片 -->
            <SceneUploadCard
              :max-files="imageAttr.allMaxLen"
              :max-size="imageAttr.singleMaxSize"
              :accept="imageAttr.suffix"
              @upload="(files:any) => handleUploadFiles(files, library)"
            />

            <!-- 场景图片滚动容器 -->
            <div class="scenes-scroll-wrapper">
              <!-- 场景卡片 -->
              <div v-for="scene in library.librarySubInfoList || []" :key="scene.libraryDetailId" class="scene-card">
                <!-- 图片 -->
                <div class="scene-image">
                  <el-image :src="scene.ossUrl || ''" fit="cover" :preview-src-list="[scene.ossUrl || '']">
                    <template #error>
                      <div class="image-error">
                        <el-icon :size="40"><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>

                  <!-- 右上角剧集标签 -->
                  <div v-if="scene.episodeList && scene.episodeList.length > 0" class="episode-tags">
                    <el-tag
                      v-for="(ep, idx) in getDisplayEpisodes(scene.episodeList)"
                      :key="idx"
                      size="small"
                      type="warning"
                    >
                      {{ typeof ep === 'string' ? ep : ep.episodeName }}
                    </el-tag>
                    <el-tag v-if="getExtraEpisodeCount(scene.episodeList) > 0" size="small" type="warning">
                      +{{ getExtraEpisodeCount(scene.episodeList) }}
                    </el-tag>
                  </div>

                  <!-- 右下角更多按钮 -->
                  <div class="scene-actions">
                    <el-dropdown trigger="click" @command="(cmd: string) => handleSceneCommand(cmd, scene)">
                      <div class="more-btn">
                        <el-icon><MoreFilled /></el-icon>
                      </div>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="delete" class="delete-item">
                            <el-icon><Delete /></el-icon>
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增场景对话框 -->
    <AddItemDialog
      v-model="addGroupDialog"
      :loading="submitting"
      title="新增场景"
      label="场景名称"
      placeholder="请输入场景名称"
      @confirm="confirmAddGroup"
    />

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialog" :title="renameTitle" width="400px" :close-on-click-modal="false">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="renameForm.name" placeholder="请输入名称" maxlength="15" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRename" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import {
    bindEpisode,
    createLibrary,
    createLibraryDetail,
    deleteLibrary,
    deleteLibraryDetail,
    getSceneDetail,
    renameLibrary
  } from '@/api/workbench/library';
  import type {
    EpisodeInfo,
    LibraryItemInfo,
    LibrarySubInfo,
    SceneDetailResponse
  } from '@/api/workbench/project/types';
  import { LibraryType } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { uploadFile } from '@/utils/uploadFile';
  import { Delete, Edit, MoreFilled, Picture, Plus } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { nextTick, onMounted, onUnmounted, ref } from 'vue';
  import AddItemDialog from '../StepCharacter/components/AddItemDialog.vue';
  import EpisodeSelector from '../components/EpisodeSelector.vue';
  import SceneUploadCard from './components/SceneUploadCard.vue';

  const projectStore = useProjectStore();

  // 状态
  const loading = ref(false);
  const submitting = ref(false);
  const sceneData = ref<SceneDetailResponse | null>(null);
  const episodeList = ref<EpisodeInfo[]>([]);
  const libraryList = ref<LibraryItemInfo[]>([]);
  const selectedEpisodeId = ref<number | null>(null);

  // 上传图片配置
  const imageAttr = {
    allMaxLen: 20,
    suffix: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    singleMaxSize: 10 * 1024 * 1024 // 10MB
  };

  // 对话框状态
  const addGroupDialog = ref(false);
  const renameDialog = ref(false);
  const episodePopoverVisible = ref(false);

  // 上传相关
  const uploading = ref(false);

  // 表单数据
  const renameForm = ref({ name: '' });
  const renameTitle = ref('重命名');
  const renameTarget = ref<{ type: 'library'; data: LibraryItemInfo } | null>(null);
  const currentEditLibrary = ref<LibraryItemInfo | null>(null);
  const selectedEpisodeIds = ref<number[]>([]);

  // 获取显示的剧集（最多3个）
  const getDisplayEpisodes = (episodes: EpisodeInfo[]) => {
    return episodes.slice(0, 3);
  };

  // 获取超出数量
  const getExtraEpisodeCount = (episodes: EpisodeInfo[]) => {
    return Math.max(0, episodes.length - 3);
  };

  // 初始化
  onMounted(() => {
    loadSceneData();
    setupHorizontalScroll();
  });

  // 设置横向滚动
  const setupHorizontalScroll = () => {
    // 先清理旧的监听器
    const oldWrappers = document.querySelectorAll('.scenes-scroll-wrapper');
    oldWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });

    nextTick(() => {
      const scrollWrappers = document.querySelectorAll('.scenes-scroll-wrapper');

      scrollWrappers.forEach((wrapper, index) => {
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
    const scrollWrappers = document.querySelectorAll('.scenes-scroll-wrapper');
    scrollWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });
  });

  // 加载场景数据
  const loadSceneData = async (episodeId?: number | null) => {
    loading.value = true;
    try {
      const params: any = {
        projectId: Number(projectStore.currentProjectId)
      };

      // 如果有剧集ID,添加到参数中
      if (episodeId !== undefined && episodeId !== null) {
        params.episodeId = episodeId;
      }

      const res = await getSceneDetail(params);

      sceneData.value = res.data;
      episodeList.value = res.data?.episodeInfoList ?? [];
      libraryList.value = res.data?.libraryItemInfoList ?? [];

      // 数据加载后重新设置横向滚动
      nextTick(() => {
        setupHorizontalScroll();
      });
    } catch (error) {
      console.error('加载场景数据失败:', error);
      ElMessage.error('加载场景数据失败');
    } finally {
      loading.value = false;
    }
  };

  // 剧集筛选
  const handleEpisodeFilter = (episodeId: number | null) => {
    selectedEpisodeId.value = episodeId;
    // 调用接口重新加载数据
    loadSceneData(episodeId);
  };

  // 新增场景组
  const handleAddSceneGroup = () => {
    addGroupDialog.value = true;
  };

  const confirmAddGroup = async (name: string) => {
    submitting.value = true;
    try {
      await createLibrary({
        projectId: Number(projectStore.currentProjectId),
        libraryType: LibraryType.SCENE,
        name: name
      });

      ElMessage.success('场景创建成功');
      addGroupDialog.value = false;
      await loadSceneData();
    } catch (error) {
      console.error('创建场景失败:', error);
      ElMessage.error('创建场景失败');
    } finally {
      submitting.value = false;
    }
  };

  // 场景组操作
  const handleGroupCommand = (command: string, library: LibraryItemInfo) => {
    if (command === 'rename') {
      renameTitle.value = '重命名场景';
      renameForm.value.name = library.name || '';
      renameTarget.value = { type: 'library', data: library };
      renameDialog.value = true;
    } else if (command === 'delete') {
      ElMessageBox.confirm(`确定要删除场景"${library.name}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            await deleteLibrary(library.libraryId!);
            ElMessage.success('删除成功');
            await loadSceneData();
          } catch (error) {
            console.error('删除失败:', error);
            ElMessage.error('删除失败');
          }
        })
        .catch(() => {});
    }
  };

  // 场景图片操作
  const handleSceneCommand = (command: string, scene: LibrarySubInfo) => {
    if (command === 'delete') {
      ElMessageBox.confirm(`确定要删除这张场景图片吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            await deleteLibraryDetail(scene.libraryDetailId!);
            ElMessage.success('删除成功');
            await loadSceneData();
          } catch (error) {
            console.error('删除失败:', error);
            ElMessage.error('删除失败');
          }
        })
        .catch(() => {});
    }
  };

  // 确认重命名
  const confirmRename = async () => {
    if (!renameForm.value.name.trim()) {
      ElMessage.warning('请输入名称');
      return;
    }

    if (!renameTarget.value) return;

    submitting.value = true;
    try {
      const lib = renameTarget.value.data as LibraryItemInfo;
      await renameLibrary({
        libraryId: lib.libraryId!,
        projectId: Number(projectStore.currentProjectId),
        libraryType: LibraryType.SCENE,
        name: renameForm.value.name
      });

      ElMessage.success('重命名成功');
      renameDialog.value = false;
      await loadSceneData();
    } catch (error) {
      console.error('重命名失败:', error);
      ElMessage.error('重命名失败');
    } finally {
      submitting.value = false;
    }
  };

  // 处理文件上传
  const handleUploadFiles = async (files: File[], library: LibraryItemInfo) => {
    if (!files || files.length === 0) return;

    uploading.value = true;
    try {
      // 上传文件到 OSS
      const uploadedImages: { url: string; ossId: string }[] = [];

      for (const file of files) {
        try {
          const suffix = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';

          const uploadResult = await uploadFile({
            file: file,
            fileSuffix: suffix,
            originalFileName: file.name,
            fileType: 'image',
            requiredTime: false,
            requiredPoster: false,
            requiredMd5: true
          });

          if (uploadResult.url && uploadResult.ossId) {
            uploadedImages.push({
              url: uploadResult.url,
              ossId: uploadResult.ossId
            });
          } else {
            console.warn('上传结果缺少必要字段:', { url: uploadResult.url, ossId: uploadResult.ossId });
          }
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
        }
      }

      if (uploadedImages.length > 0) {
        // 调用创建场景图片的 API
        for (const imgInfo of uploadedImages) {
          await createLibraryDetail({
            libraryId: Number(library.libraryId),
            name: '',
            ossId: Number(imgInfo.ossId),
            ossUrl: imgInfo.url
          });
        }

        ElMessage.success(`成功上传 ${uploadedImages.length} 张图片`);
        await loadSceneData();
      } else {
        console.warn('没有可上传的图片');
      }
    } catch (error) {
      console.error('上传失败:', error);
      ElMessage.error(typeof error === 'string' ? error : '上传失败');
    } finally {
      uploading.value = false;
    }
  };

  // 编辑集数（针对场景名称分组）
  const handleEditEpisodes = (library: LibraryItemInfo) => {
    currentEditLibrary.value = library;
    selectedEpisodeIds.value = library.episodeList?.map((ep) => ep.episodeId!).filter(Boolean) ?? [];
    episodePopoverVisible.value = true;
  };

  // 关闭集数选择器
  const handleEpisodeSelectorClose = () => {
    currentEditLibrary.value = null;
  };

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
      await loadSceneData();
    } catch (error) {
      console.error('剧集关联失败:', error);
      ElMessage.error('剧集关联失败');
    } finally {
      submitting.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .step-scene {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .scene-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    .add-rigtop {
      display: flex;
      width: 118px;
      height: 32px;
      padding: 0 20px;
      gap: 6px;
      border-radius: 8px;
      background: #5252ff;
      color: #fff;
      font-size: 14px;
    }
  }

  .episode-filter {
    flex: 1;
    margin-right: 16px;
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
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    .empty-box {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      top: -100px;
      color: #4e5969;
      font-size: 13px;
      .add-sty {
        display: flex;
        width: 80px;
        height: 32px;
        padding: 8px 16px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        border-radius: 8px;
        margin-top: 40px;
      }
    }
  }

  .scenes-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .scene-group {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 6px 0 rgba(224, 231, 255, 0.25), 0 10px 15px 0 rgba(224, 231, 255, 0.5);
    padding: 20px;
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .group-title {
        display: flex;
        align-items: center;
        gap: 12px;

        .group-name {
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

      .group-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .dro-btn {
          border-radius: 6px;
          background: #f3f3ff;
        }
      }
    }

    .scenes-grid {
      display: flex;
      gap: 16px;
      position: relative;

      // 固定上传卡片
      > :first-child {
        flex-shrink: 0;
        width: 200px;
        position: sticky;
        left: 0;
        z-index: 2;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
      }

      // 场景列表容器
      .scenes-scroll-wrapper {
        display: flex;
        gap: 16px;
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        // padding-bottom: 8px;

        // 隐藏滚动条，但保持滚动功能
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

        // hover时显示优雅的滚动条
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
      }

      // 场景卡片不换行
      .scene-card {
        flex-shrink: 0;
        // width: 200px;
      }
    }
  }

  // 删除选项红色高亮
  :deep(.delete-item) {
    &:hover {
      color: #f56c6c !important;

      .el-icon {
        color: #f56c6c;
      }
    }
  }

  .scene-card {
    position: relative;
    overflow: hidden;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    background: white;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
    }
  }

  .scene-image {
    position: relative;
    width: 100%;
    height: 240px;

    .el-image {
      width: 100%;
      height: 100%;
    }

    .image-error {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: #fafafa;
      color: #d9d9d9;
    }

    // 右上角剧集标签
    .episode-tags {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 150px;

      .el-tag {
        flex-shrink: 0;
      }
    }

    // 右下角更多按钮
    .scene-actions {
      position: absolute;
      right: 8px;
      bottom: 8px;

      .more-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background: rgb(255 255 255 / 90%);
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: white;
          box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
        }
      }
    }
  }
</style>
