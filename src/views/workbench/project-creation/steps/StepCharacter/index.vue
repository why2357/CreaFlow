<template>
  <div class="step-character">
    <!-- 顶部操作栏 -->
    <div class="character-header">
      <!-- 剧集筛选 -->
      <HorizontalScrollTabs
        v-model="selectedEpisodeId"
        :items="episodeList"
        item-key="episodeId"
        item-label="episodeName"
        @change="handleEpisodeFilter"
      />

      <!-- 新增按钮 -->
      <el-button class="add-rigtop" type="primary" @click="handleAddCharacterGroup" v-show="libraryList.length !== 0">
        <el-icon style="margin-right: 6px"><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <!-- 角色列表内容区域 -->
    <div class="character-content" v-loading="loading">
      <!-- 空状态 -->
      <div class="empty-box" v-if="libraryList.length === 0 && !loading">
        <img style="width: 200px; height: 200px" src="../../../../../assets/images/no-member.png" alt="" />
        <div>暂无角色，点击新增角色开始创建</div>
        <el-button class="add-sty" type="primary" @click="handleAddCharacterGroup">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
      </div>

      <!-- 角色分组显示 -->
      <div v-else class="characters-container">
        <div v-for="library in libraryList" :key="library.libraryId" class="character-group">
          <!-- 角色组标题 -->
          <div class="group-header">
            <div class="group-title">
              <el-tooltip :content="library.name" placement="top" :disabled="!isGroupNameOverflow(library.name)">
                <span class="group-name">{{ library.name }}</span>
              </el-tooltip>
            </div>
            <el-dropdown trigger="click" @command="(cmd: string) => handleGroupCommand(cmd, library)">
              <el-button class="dro-btn" text>
                <svg-icon icon-class="fy-more" style="width: 16px; height: 16px" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">
                    <svg-icon icon-class="fy-pen" style="width: 16px; height: 16px; margin-right: 16px" />
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided class="delete-item">
                    <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 16px" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 服装列表 -->
          <div class="costumes-grid">
            <!-- 上传卡片 -->
            <CharacterUploadCard
              :max-files="imageAttr.allMaxLen"
              :max-size="imageAttr.singleMaxSize"
              :accept="imageAttr.suffix"
              :library-id="library.libraryId"
              :total-limit="imageAttr.totalLimit"
              :validate-dimensions="false"
              @upload="(files:any) => handleUploadFiles(files, library)"
            />

            <!-- 服装卡片滚动容器 -->
            <div class="costumes-scroll-wrapper">
              <!-- 服装卡片 -->
              <div
                v-for="costume in library.librarySubInfoList || []"
                :key="costume.libraryDetailId"
                class="costume-card"
              >
                <!-- 图片 -->
                <div class="costume-image">
                  <el-image :src="costume.ossUrl || ''" fit="contain" :preview-src-list="[costume.ossUrl || '']">
                    <template #error>
                      <div class="image-error">
                        <el-icon :size="40"><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>

                  <!-- 右上角剧集标签 -->
                  <div v-if="costume.episodeList && costume.episodeList.length > 0" class="episode-tags">
                    <el-tooltip
                      v-for="(ep, idx) in getDisplayEpisodes(costume.episodeList)"
                      :key="idx"
                      :content="typeof ep === 'string' ? ep : ep.episodeName"
                      placement="top"
                      :disabled="!isEpisodeNameOverflow(typeof ep === 'string' ? ep : ep.episodeName)"
                    >
                      <el-tag size="small" type="warning" class="episode-tag-ellipsis">
                        <span class="episode-tag-text">{{ typeof ep === 'string' ? ep : ep.episodeName }}</span>
                      </el-tag>
                    </el-tooltip>
                    <el-tag v-if="getExtraEpisodeCount(costume.episodeList) > 0" size="small" type="warning">
                      +{{ getExtraEpisodeCount(costume.episodeList) }}
                    </el-tag>
                  </div>

                  <!-- 右下角更多按钮 -->
                  <div class="costume-actions">
                    <el-dropdown trigger="click" @command="(cmd: string) => handleCostumeCommand(cmd, costume)">
                      <div class="more-btn">
                        <svg-icon icon-class="fy-more" style="width: 12px; height: 12px" />
                      </div>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="rename">
                            <svg-icon icon-class="fy-pen" style="width: 16px; height: 16px; margin-right: 16px" />
                            重命名
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" divided class="delete-item">
                            <svg-icon icon-class="fy-del" style="width: 16px; height: 16px; margin-right: 16px" />
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>

                  <!-- 左下角服装名称 -->
                  <div class="costume-name-overlay">{{ costume.detailName }}</div>
                </div>

                <!-- 编辑集数按钮 -->
                <div class="costume-footer" v-if="episodeList.length > 0">
                  <EpisodeSelector
                    v-if="currentEditCostume?.libraryDetailId === costume.libraryDetailId"
                    v-model="episodePopoverVisible"
                    :episode-list="episodeList"
                    :selected-episode-ids="selectedEpisodeIds"
                    :loading="submitting"
                    @confirm="confirmEditEpisodes"
                    @close="handleEpisodeSelectorClose"
                  >
                    <template #reference>
                      <el-button size="small" @click="handleEditEpisodes(costume)">+ 编辑集数</el-button>
                    </template>
                  </EpisodeSelector>
                  <el-button v-else size="small" @click="handleEditEpisodes(costume)">+ 编辑集数</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增角色对话框 -->
    <AddItemDialog
      v-model="addGroupDialog"
      :loading="submitting"
      title="新增角色"
      label="角色名称"
      placeholder="请输入角色名称"
      @confirm="confirmAddGroup"
    />

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialog" :title="renameTitle" width="400px" :close-on-click-modal="false">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="renameForm.name" placeholder="请输入名称" maxlength="20" show-word-limit />
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
    getCharacterDetail,
    renameLibrary,
    renameLibraryDetail
  } from '@/api/workbench/library';
  import type {
    CharacterDetailResponse,
    EpisodeInfo,
    LibraryItemInfo,
    LibrarySubInfo
  } from '@/api/workbench/project/types';
  import { LibraryType } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { uploadFile } from '@/utils/uploadFile';
  import { Picture, Plus } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { nextTick, onMounted, onUnmounted, ref } from 'vue';
  import EpisodeSelector from '../components/EpisodeSelector.vue';
  import HorizontalScrollTabs from '../components/HorizontalScrollTabs.vue';
  import AddItemDialog from './components/AddItemDialog.vue';
  import CharacterUploadCard from './components/CharacterUploadCard.vue';

  const projectStore = useProjectStore();

  // 状态
  const loading = ref(false);
  const submitting = ref(false);
  const characterData = ref<CharacterDetailResponse | null>(null);
  const episodeList = ref<EpisodeInfo[]>([]);
  const libraryList = ref<LibraryItemInfo[]>([]);
  const selectedEpisodeId = ref<number | null>(null);

  // 上传图片配置
  const imageAttr = {
    allMaxLen: 10, // 单次最多上传10张
    totalLimit: 10, // 总数限制10张
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
  const renameTarget = ref<{ type: 'library' | 'detail'; data: LibraryItemInfo | LibrarySubInfo } | null>(null);
  const currentEditCostume = ref<LibrarySubInfo | null>(null);
  const selectedEpisodeIds = ref<number[]>([]);

  // 获取显示的剧集（最多3个）
  const getDisplayEpisodes = (episodes: EpisodeInfo[]) => {
    return episodes.slice(0, 3);
  };

  // 获取超出数量
  const getExtraEpisodeCount = (episodes: EpisodeInfo[]) => {
    return Math.max(0, episodes.length - 3);
  };

  // 判断剧集名称是否溢出（简单判断：超过4个字符认为可能溢出）
  const isEpisodeNameOverflow = (name: string | undefined): boolean => {
    if (!name) return false;
    return name.length > 4;
  };

  // 判断组名是否溢出（简单判断：超过10个字符认为可能溢出）
  const isGroupNameOverflow = (name: string | undefined): boolean => {
    if (!name) return false;
    return name.length > 10;
  };

  // 初始化
  onMounted(() => {
    // 等待项目初始化完成后再加载数据
    const waitForInit = () => {
      if (projectStore.isInitializing) {
        // 如果还在初始化，延迟50ms后重试
        console.log('[StepCharacter] 等待项目初始化完成...');
        setTimeout(waitForInit, 50);
      } else {
        // 初始化完成，加载数据
        console.log('[StepCharacter] 项目初始化完成，开始加载角色数据');
        loadCharacterData();
        setupHorizontalScroll();
      }
    };
    waitForInit();
  });

  // 设置横向滚动
  const setupHorizontalScroll = () => {
    // 先清理旧的监听器
    const oldWrappers = document.querySelectorAll('.costumes-scroll-wrapper');
    oldWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });

    nextTick(() => {
      const scrollWrappers = document.querySelectorAll('.costumes-scroll-wrapper');

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

        console.log('已为第', index + 1, '个容器绑定滚轮事件');
      });
    });
  };

  // 组件卸载时清理
  onUnmounted(() => {
    // 清理服装卡片的滚轮事件
    const scrollWrappers = document.querySelectorAll('.costumes-scroll-wrapper');
    scrollWrappers.forEach((wrapper) => {
      if ((wrapper as any).__cleanupScroll) {
        (wrapper as any).__cleanupScroll();
      }
    });
  });

  // 加载角色数据
  const loadCharacterData = async (episodeId?: number | null) => {
    loading.value = true;
    try {
      const params: any = {
        projectId: Number(projectStore.currentProjectId)
      };

      // 如果有剧集ID,添加到参数中
      if (episodeId !== undefined && episodeId !== null) {
        params.episodeId = episodeId;
      }

      const res = await getCharacterDetail(params);

      characterData.value = res.data;
      episodeList.value = res.data?.episodeInfoList ?? [];
      libraryList.value = res.data?.libraryItemInfoList ?? [];

      // 数据加载后重新设置横向滚动
      nextTick(() => {
        setupHorizontalScroll();
      });
    } catch (error) {
      console.error('加载角色数据失败:', error);
      ElMessage.error('加载角色数据失败');
    } finally {
      loading.value = false;
    }
  };

  // 剧集筛选
  const handleEpisodeFilter = (episodeId: number | null) => {
    // 调用接口重新加载数据
    loadCharacterData(episodeId);
  };

  // 新增角色组
  const handleAddCharacterGroup = () => {
    addGroupDialog.value = true;
  };

  const confirmAddGroup = async (name: string) => {
    submitting.value = true;
    try {
      await createLibrary({
        projectId: Number(projectStore.currentProjectId),
        libraryType: LibraryType.CHARACTER,
        name: name
      });

      ElMessage.success('角色创建成功');
      addGroupDialog.value = false;
      await loadCharacterData();
    } catch (error) {
      console.log('创建角色失败:', error);
    } finally {
      submitting.value = false;
    }
  };

  // 角色组操作
  const handleGroupCommand = (command: string, library: LibraryItemInfo) => {
    if (command === 'rename') {
      renameTitle.value = '重命名角色';
      renameForm.value.name = library.name || '';
      renameTarget.value = { type: 'library', data: library };
      renameDialog.value = true;
    } else if (command === 'delete') {
      ElMessageBox.confirm(`确定要删除角色"${library.name}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            await deleteLibrary(library.libraryId!);
            ElMessage.success('删除成功');
            await loadCharacterData();
          } catch (error) {
            console.error('删除失败:', error);
            ElMessage.error('删除失败');
          }
        })
        .catch(() => {});
    }
  };

  // 服装操作
  const handleCostumeCommand = (command: string, costume: LibrarySubInfo) => {
    if (command === 'rename') {
      renameTitle.value = '重命名服装';
      renameForm.value.name = costume.detailName || '';
      renameTarget.value = { type: 'detail', data: costume };
      renameDialog.value = true;
    } else if (command === 'delete') {
      ElMessageBox.confirm(`确定要删除服装"${costume.detailName}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            await deleteLibraryDetail(costume.libraryDetailId!);
            ElMessage.success('删除成功');
            await loadCharacterData();
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
      if (renameTarget.value.type === 'library') {
        const lib = renameTarget.value.data as LibraryItemInfo;
        await renameLibrary({
          libraryId: lib.libraryId!,
          projectId: Number(projectStore.currentProjectId),
          libraryType: LibraryType.CHARACTER,
          name: renameForm.value.name
        });
      } else {
        const detail = renameTarget.value.data as LibrarySubInfo;
        // 需要找到对应的 libraryId
        const library = libraryList.value.find((lib) =>
          lib.librarySubInfoList?.some((sub) => sub.libraryDetailId === detail.libraryDetailId)
        );

        if (library) {
          await renameLibraryDetail({
            detailId: detail.libraryDetailId!,
            libraryId: library.libraryId!,
            name: renameForm.value.name
          });
        }
      }

      ElMessage.success('重命名成功');
      renameDialog.value = false;
      await loadCharacterData();
    } catch (error) {
      console.error('重命名失败:', error);
      ElMessage.error('重命名失败');
    } finally {
      submitting.value = false;
    }
  };

  // 处理文件上传（新的简化版本）
  const handleUploadFiles = async (files: File[], library: LibraryItemInfo) => {
    if (!files || files.length === 0) return;

    uploading.value = true;
    try {
      // 上传文件到 OSS
      const uploadedImages: { url: string; ossId: string; name: string }[] = [];

      for (const file of files) {
        try {
          const suffix = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
          const fileName = file.name.replace(/\.[^/.]+$/, ''); // 去掉文件扩展名

          const uploadResult = await uploadFile({
            file: file,
            fileSuffix: suffix,
            originalFileName: file.name,
            fileType: 'image',
            requiredTime: false,
            requiredPoster: false,
            requiredMd5: true
          });

          console.log('上传结果:', uploadResult);

          if (uploadResult.url && uploadResult.ossId) {
            uploadedImages.push({
              url: uploadResult.url,
              ossId: uploadResult.ossId,
              name: fileName
            });
            console.log('已添加到上传列表:', { url: uploadResult.url, ossId: uploadResult.ossId, name: fileName });
          } else {
            console.warn('上传结果缺少必要字段:', { url: uploadResult.url, ossId: uploadResult.ossId });
          }
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
        }
      }

      console.log('准备创建库详情，图片数量:', uploadedImages.length);

      if (uploadedImages.length > 0) {
        // 调用创建服装图片的 API
        for (const imgInfo of uploadedImages) {
          console.log('调用 createLibraryDetail:', {
            libraryId: Number(library.libraryId),
            name: imgInfo.name,
            ossId: Number(imgInfo.ossId),
            ossUrl: imgInfo.url
          });

          await createLibraryDetail({
            libraryId: Number(library.libraryId),
            name: imgInfo.name,
            ossId: Number(imgInfo.ossId),
            ossUrl: imgInfo.url
          });
        }

        ElMessage.success(`成功上传 ${uploadedImages.length} 张图片`);

        // 如果当前不在"全部"剧集页面，切换到"全部"页面方便用户查看上传的图片
        if (selectedEpisodeId.value !== null) {
          selectedEpisodeId.value = null;
        }

        await loadCharacterData();
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

  // 编辑集数
  const handleEditEpisodes = (costume: LibrarySubInfo) => {
    currentEditCostume.value = costume;
    selectedEpisodeIds.value =
      costume.episodeList?.map((ep) => ep.episodeId).filter((id): id is number => typeof id === 'number') ?? [];
    episodePopoverVisible.value = true;
  };

  // 关闭集数选择器
  const handleEpisodeSelectorClose = () => {
    currentEditCostume.value = null;
  };

  const confirmEditEpisodes = async (selectedIds: number[]) => {
    if (!currentEditCostume.value || !currentEditCostume.value.libraryDetailId) {
      ElMessage.warning('缺少必要的参数');
      return;
    }

    submitting.value = true;
    try {
      await bindEpisode({
        episodeIdList: selectedIds,
        libraryType: LibraryType.CHARACTER, // 1：服装（角色）
        relationId: currentEditCostume.value.libraryDetailId
      });

      ElMessage.success('剧集关联成功');
      episodePopoverVisible.value = false;
      // 刷新数据以更新图片右上角的集数标签显示
      await loadCharacterData();
    } catch (error) {
      console.error('剧集关联失败:', error);
      ElMessage.error('剧集关联失败');
    } finally {
      submitting.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .step-character {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .character-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .character-content {
    flex: 1;
    padding-top: 14px;
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

  .characters-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .character-group {
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
        flex: 1;
        min-width: 0;

        .group-name {
          display: inline-block;
          max-width: 200px;
          color: #262626;
          font-size: 18px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: bottom;
        }
      }
      .dro-btn {
        border-radius: 6px;
        // background: #f3f3ff;
      }
    }

    .costumes-grid {
      display: flex;
      gap: 16px;
      position: relative;

      // 固定上传卡片
      > :first-child {
        flex-shrink: 0;
        min-width: 120px;
        max-width: 200px;
        height: 240px;
        position: sticky;
        left: 0;
        z-index: 2;
        // background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
      }

      // 服装列表容器
      .costumes-scroll-wrapper {
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

      // 服装卡片不换行
      .costume-card {
        flex-shrink: 0;
        // width: 200px; // 移除固定宽度，让图片自适应
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

  .costume-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
    }

    &.upload-card {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 280px;
      border: 2px dashed #d9d9d9;
      cursor: pointer;

      &:hover {
        border-color: #5252ff;
        background: #f5f5ff;
      }

      .upload-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #8c8c8c;
        text-align: center;

        .upload-icon {
          color: #bfbfbf;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 500;
        }

        .upload-subtext {
          font-size: 12px;
        }

        .upload-limit {
          font-size: 12px;
          color: #bfbfbf;
        }
      }
    }
  }

  .costume-image {
    position: relative;
    width: 100%;
    height: 240px;

    &:hover {
      .costume-actions {
        opacity: 1;
      }
    }

    .el-image {
      width: 100%;
      height: 100%;
      border-radius: 8px;
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

    // 左下角名称
    .costume-name-overlay {
      position: absolute;
      bottom: 6px;
      left: 0;
      max-width: calc(100% - 80px);
      padding: 4px 8px;
      overflow: hidden;
      color: #fff;
      font-size: 12px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    // 右上角剧集标签
    .episode-tags {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 190px;

      .el-tag {
        flex-shrink: 0;
        height: 20px;
        line-height: 20px;
        border-radius: 62px;
        border: 0.556px solid #ffcf8b;
        background: #fff7e8;
        display: flex;
        align-items: center;
      }

      .episode-tag-ellipsis {
        display: inline-block;
        max-width: 60px;
        height: 20px;
        line-height: 20px;
        display: flex;
        align-items: center;

        :deep(.el-tag__content) {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .episode-tag-text {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    // 右下角更多按钮
    .costume-actions {
      position: absolute;
      right: 8px;
      bottom: 8px;
      opacity: 0;

      .more-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(5.300000190734863px);
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: white;
          box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
        }
      }
    }
  }

  .costume-footer {
    margin-top: 8px;
    text-align: center;

    .el-button {
      width: 100%;
      border-radius: 3px;
      border: 1px dashed #c9cdd4;
      background: #f7f8fa;
      color: #86909c;
      font-size: 13px;
    }
  }
</style>

<style lang="scss">
  .el-upload-dragger {
    padding: 20px;
  }

  .el-upload-list {
    margin-top: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .custom-file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    margin-bottom: 8px;
    transition: all 0.3s;

    &:hover {
      border-color: #6c5ce7;
      background-color: #f9f8ff;
    }

    .file-preview {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      margin-right: 12px;
    }

    .file-name {
      flex: 1;
      color: #606266;
      font-size: 12px;
      max-width: 70%;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-icon {
      cursor: pointer;
      color: #f56c6c;
      font-size: 18px;
      transition: all 0.3s;

      &:hover {
        color: #f00;
      }
    }
  }
</style>
