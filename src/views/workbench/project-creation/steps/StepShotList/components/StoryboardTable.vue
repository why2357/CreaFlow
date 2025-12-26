<template>
  <div class="storyboard-table-container">
    <!-- 加载中 -->
    <div v-if="loading" v-loading="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" :size="60"><Loading /></el-icon>
        <p class="loading-text">分镜生成中，请稍等...</p>
      </div>
    </div>

    <!-- 分镜表格 -->
    <div v-else class="table-wrapper">
      <el-table ref="tableRef" :data="localShots" border stripe height="100%" class="storyboard-table" row-key="id">
        <el-table-column prop="shotNumber" label="镜号" width="120" align="center" fixed="left">
          <template #default="{ row, $index }">
            <div class="shot-number-cell drag-handle" :data-row-index="$index">
              <ShotNumberActions
                :shot-number="row.shotNumber"
                :scene-status="row.imgStatus"
                @comment="(event: MouseEvent) => handleShotComment(row, event)"
                @insert="handleShotInsert(row)"
                @review="(event: MouseEvent) => handleShotReview(row, event)"
                @delete="handleShotDelete(row)"
                @view-comments="handleViewComments(row)"
              />
              <!-- 拖拽手柄 -->
              <span class="shot-number-text drag-handle">
                {{ row.shotNumber }}
              </span>
              <!-- 留言数量显示 -->
              <div
                v-if="row.commentCount && row.commentCount > 0"
                class="comment-count-badge"
                @mouseenter="(event: MouseEvent) => handleViewComments(row, event)"
                @mouseleave="handleCommentMouseLeave"
              >
                <svg-icon icon-class="fy-comment" class="comment-icon" />

                <span class="count-text">{{ row.commentCount }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="画面" :width="getImageColumnWidth()" align="center" fixed="left">
          <template #default="{ row }">
            <SceneImageCell
              :image-url="row.sceneImage"
              :material-info-vo-list="row.materialInfoVoList"
              :aspect-ratio="aspectRatio"
              :shot-id="row.id"
              :basic-id="row.basicId"
              :history-detail-id="row.historyDetailId"
              :isCollect="row.isCollect"
              :loading="row.imageLoading"
              :task-status="row.taskStatus"
              :model-points="modelPoints"
              @upload="(file:any) => handleImageUpload(row, file)"
              @show-history="handleShowHistory(row)"
              @download="handleImageDownload(row)"
              @crop="(imageUrl: string) => handleImageCrop(row, imageUrl)"
              @toggle-favorite="(isCollect: boolean) => handleToggleFavorite(row, isCollect)"
              @regenerate="handleImageRegenerate(row)"
              @refresh="emit('refresh')"
            />
          </template>
        </el-table-column>

        <el-table-column prop="sceneHint" label="画面描述" min-width="600">
          <template #default="{ row }">
            <div v-if="!isEditing(row, 'sceneDesc')" class="editable-cell" @click="startEdit(row, 'sceneDesc')">
              <div
                class="scene-description"
                :class="{ 'empty-placeholder': !row.sceneDesc }"
                v-html="highlightCharacterNames(row.sceneDesc, row.characters) || '点击输入特写镜头描述'"
              ></div>
            </div>
            <div v-else class="editing-cell">
              <el-input
                v-model="editingValue"
                type="textarea"
                :rows="3"
                maxlength="300"
                placeholder="请输入特写镜头描述"
                @blur="handleBlur(row)"
                @keydown="(evt: Event) => handleKeydown(evt as KeyboardEvent)"
                autofocus
              />
            </div>
            <div v-if="!isEditing(row, 'sceneHint')" class="editable-cell" @click="startEdit(row, 'sceneHint')">
              <div
                class="scene-description"
                :class="{ 'empty-placeholder': !row.sceneHint }"
                v-html="highlightCharacterNames(row.sceneHint, row.characters) || '点击输入场景提示'"
              ></div>
            </div>
            <div v-else class="editing-cell">
              <el-input
                v-model="editingValue"
                type="textarea"
                :rows="3"
                maxlength="300"
                placeholder="请输入场景提示"
                @blur="handleBlur(row)"
                @keydown="(evt: Event) => handleKeydown(evt as KeyboardEvent)"
                autofocus
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="dialogue" label="台词" min-width="280">
          <template #default="{ row }">
            <div v-if="!isEditing(row, 'dialogue')" class="editable-cell" @click="startEdit(row, 'dialogue')">
              <div
                class="dialogue"
                :class="{ 'empty-placeholder': !row.dialogue }"
                v-html="highlightCharacterNames(row.dialogue, row.characters) || '点击输入台词'"
              ></div>
            </div>
            <div v-else class="editing-cell">
              <el-input
                v-model="editingValue"
                type="textarea"
                :rows="3"
                maxlength="300"
                placeholder="请输入台词"
                @blur="handleBlur(row)"
                @keydown="(evt: Event) => handleKeydown(evt as KeyboardEvent)"
                autofocus
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="characters" label="人物" width="120">
          <template #default="{ row }">
            <div class="characters">
              <el-image
                v-for="(character, index) in row.characters"
                :key="index"
                :src="character.materialInfoVo?.previewOssUrl || character.materialInfoVo?.originOssUrl"
                fit="contain"
                class="character-avatar character-clickable"
                :preview-teleported="true"
                hide-on-click-modal
                @click="handleCharacterClick(row, character)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sceneLocation" label="场景" :width="getImageColumnWidth()">
          <template #default="{ row }">
            <div
              class="scene-location-cell"
              :class="{ 'drag-over': isSceneDragOver(row) }"
              :data-aspect-ratio="aspectRatio"
              @mouseenter="handleSceneHover(row, true)"
              @mouseleave="handleSceneHover(row, false)"
              @drop="(event: DragEvent) => handleSceneDrop(event, row)"
              @dragover="handleSceneDragOver"
              @dragenter="(event: DragEvent) => handleSceneDragEnter(event, row)"
              @dragleave="(event: DragEvent) => handleSceneDragLeave(event, row)"
            >
              <!-- Hover操作遮罩层 -->
              <div v-if="isSceneHovered(row)" class="scene-hover-overlay">
                <div class="scene-top-actions">
                  <el-tooltip content="场景库" placement="top">
                    <div class="scene-action-btn" @click="handleSelectSceneLibrary(row)">
                      <svg-icon icon-class="fy-sence-tupian" />
                    </div>
                  </el-tooltip>
                  <el-tooltip content="上传" placement="top">
                    <div class="scene-action-btn" @click="handleUploadScene(row)">
                      <svg-icon icon-class="fy-sence-upload" />
                    </div>
                  </el-tooltip>
                  <el-tooltip v-if="row.envMaterialInfoVo" content="删除" placement="top">
                    <div class="scene-action-btn scene-delete-btn" @click="handleDeleteScene(row)">
                      <svg-icon icon-class="fy-del" style="width: 16px; height: 16px" />
                    </div>
                  </el-tooltip>
                </div>
              </div>

              <!-- 图片内容区域 -->
              <div v-if="row.envMaterialInfoVo" class="scene-image-container">
                <el-image
                  :src="row.envMaterialInfoVo.previewOssUrl || row.envMaterialInfoVo.originOssUrl"
                  fit="contain"
                  class="scene-location-image"
                  :preview-src-list="[row.envMaterialInfoVo.originOssUrl || row.envMaterialInfoVo.previewOssUrl]"
                  :preview-teleported="true"
                  hide-on-click-modal
                />
              </div>
              <div v-else class="scene-placeholder">
                <svg-icon icon-class="no-sence" style="width: 120px; height: 120px" />
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <template #empty>
          <div v-if="episodeTaskStatus !== 1" class="empty-state">
            <div class="empty-content">
              <img
                style="width: 200px; height: 200px"
                src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/1482f35c14ad4f8a.png"
                alt=""
              />
              <p class="empty-text">暂无分镜头</p>
            </div>
          </div>
        </template>
      </el-table>
    </div>

    <!-- 图片裁剪弹窗 -->
    <ImageCropDialog
      v-model="cropDialogVisible"
      :image-url="currentCropImage"
      :aspect-ratio="aspectRatio"
      :basic-id="currentCropShot?.basicId"
      @confirm="handleCropConfirm"
      @success="handleCropSuccess"
    />

    <!-- 场景库选择弹窗 -->
    <SceneLibraryDialog
      v-model="sceneLibraryDialogVisible"
      :project-id="projectId"
      :episodes="episodes"
      @confirm="handleSceneLibraryConfirm"
    />

    <!-- 单个角色服装编辑弹窗 -->
    <SingleCharacterEditDialog
      v-model="singleCharacterDialogVisible"
      :basic-id="currentCharacterData?.basicId"
      :episode-id="currentCharacterData?.episodeId"
      :role-id="currentCharacterData?.roleId"
      @success="handleCharacterEditSuccess"
    />

    <!-- 场景上传输入框（隐藏） -->
    <input ref="sceneUploadInput" type="file" accept="image/*" style="display: none" @change="handleSceneFileChange" />

    <!-- 留言popover -->
    <CommentDialog
      v-model="commentDialogVisible"
      :basic-id="currentShotForAction?.basicId || 0"
      :scene-type="1"
      :trigger-ref="commentTriggerRef"
      @success="handleCommentSuccess"
    />

    <!-- 留言列表 popover -->
    <CommentListDialog
      v-model="commentListDialogVisible"
      :basic-id="currentShotForAction?.basicId || 0"
      :scene-type="1"
      :trigger-ref="commentListTriggerRef"
      trigger-type="hover"
      :comment-list="
        currentShotForAction?.commentInfo && typeof currentShotForAction.commentInfo === 'object'
          ? [currentShotForAction.commentInfo]
          : undefined
      "
      @change="handleCommentChange"
    />

    <!-- 评审popover -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :basic-id="currentShotForAction?.basicId || 0"
      :scene-type="1"
      :current-status="currentShotForAction?.imgStatus"
      :trigger-ref="reviewTriggerRef"
      @success="handleReviewSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { clearSceneEnv, dragSortScene, editSceneBasic, setSceneEnv } from '@/api/workbench/episode';
  import type { CharacterClothingInfo } from '@/api/workbench/episode/types';
  import type { EpisodeInfo, LibrarySubInfo, Shot } from '@/api/workbench/project/types';
  import { addScene, deleteScene } from '@/api/workbench/storyboard';
  import { useAutoScroll } from '@/composables/useAutoScroll';
  import { uploadFile } from '@/utils/uploadFile';
  import { Loading } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import Sortable, { type SortableEvent } from 'sortablejs';
  import { nextTick, ref, watch } from 'vue';
  import CommentDialog from './CommentDialog.vue';
  import CommentListDialog from './CommentListDialog.vue';
  import ImageCropDialog from './ImageCropDialog.vue';
  import ReviewDialog from './ReviewDialog.vue';
  import SceneImageCell from './SceneImageCell.vue';
  import SceneLibraryDialog from './SceneLibraryDialog.vue';
  import ShotNumberActions from './ShotNumberActions.vue';
  import SingleCharacterEditDialog from './SingleCharacterEditDialog.vue';

  interface Props {
    shots: Shot[];
    aspectRatio: string;
    loading?: boolean;
    projectId: number;
    episodes: EpisodeInfo[];
    modelPoints?: number; // 当前模型的点数
    episodeTaskStatus?: number; // 剧集任务状态
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<{
    (e: 'imageUpload', shot: Shot, file: File): void;
    (e: 'imageRegenerate', shot: Shot): void;
    (e: 'toggleFavorite', shot: Shot, isCollect: boolean): void;
    (e: 'updateShot', shot: Shot): void;
    (e: 'refresh'): void;
    (e: 'deleteSuccess', basicId: number): void;
  }>();

  // 表格引用和本地数据
  const tableRef = ref();
  const localShots = ref<Shot[]>([]);

  // 监听 props.shots 变化，同步到本地列表
  watch(
    () => props.shots,
    (newShots) => {
      localShots.value = [...newShots];
    },
    { immediate: true, deep: true }
  );

  // 裁剪相关
  const cropDialogVisible = ref(false);
  const currentCropImage = ref('');
  const currentCropShot = ref<Shot | null>(null);

  // 历史记录相关
  const historyDialogVisible = ref(false);
  const currentShotId = ref<string | number>(0);
  const currentHistoryShot = ref<Shot | null>(null);

  // 编辑相关
  const editingCell = ref<{ shotId: string | number; field: 'sceneDesc' | 'sceneHint' | 'dialogue' } | null>(null);
  const editingValue = ref('');
  const originalValue = ref('');

  // 场景库相关
  const sceneLibraryDialogVisible = ref(false);
  const currentSceneShot = ref<Shot | null>(null);

  // 场景上传相关
  const sceneUploadInput = ref<HTMLInputElement>();
  const currentUploadShot = ref<Shot | null>(null);

  // 单个角色编辑相关
  const singleCharacterDialogVisible = ref(false);
  const currentCharacterData = ref<{
    basicId: number;
    episodeId: number;
    roleId: number;
  } | null>(null);

  // 镜号操作相关
  const currentShotForAction = ref<Shot | null>(null);
  const commentDialogVisible = ref(false);
  const commentTriggerRef = ref<HTMLElement>();
  const commentListDialogVisible = ref(false);
  const commentListTriggerRef = ref<HTMLElement>();
  const reviewDialogVisible = ref(false);
  const reviewTriggerRef = ref<HTMLElement>();

  // 图片上传
  const handleImageUpload = (shot: Shot, file: File) => {
    emit('imageUpload', shot, file);
  };

  // 查看历史
  const handleShowHistory = (shot: Shot) => {
    currentHistoryShot.value = shot;
    currentShotId.value = shot.id;
    historyDialogVisible.value = true;
  };

  // 下载图片
  const handleImageDownload = (shot: Shot) => {
    if (!shot.sceneImage) {
      ElMessage.warning('暂无图片可下载');
      return;
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.href = shot.sceneImage;
    link.download = `shot-${shot.shotNumber}.jpg`;
    link.click();

    ElMessage.success('下载成功');
  };

  // 裁剪图片
  const handleImageCrop = (shot: Shot, imageUrl: string) => {
    currentCropShot.value = shot;
    currentCropImage.value = imageUrl || shot.sceneImage || '';
    cropDialogVisible.value = true;
  };

  // 裁剪确认（兼容旧逻辑，当没有 basicId 时使用）
  const handleCropConfirm = (blob: Blob) => {
    if (!currentCropShot.value) return;

    // 将 blob 转换为文件
    const file = new File([blob], `shot-${currentCropShot.value.shotNumber}-cropped.jpg`, {
      type: 'image/jpeg'
    });

    emit('imageUpload', currentCropShot.value, file);
    ElMessage.success('裁剪成功');
  };

  // 裁剪上传成功（新逻辑，有 basicId 时使用）
  const handleCropSuccess = () => {
    ElMessage.success('裁剪并上传成功');
    emit('refresh');
  };

  // 历史记录选择
  const handleHistorySelect = (imageUrl: string) => {
    if (!currentHistoryShot.value) return;

    // TODO: 更新分镜图片
    currentHistoryShot.value.sceneImage = imageUrl;
    ElMessage.success('已使用历史图片');
  };

  // 切换收藏
  const handleToggleFavorite = (shot: Shot, isCollect: boolean) => {
    // 直接更新本地状态，无需刷新整个列表
    shot.isCollect = isCollect;
  };

  // 重新生成图片
  const handleImageRegenerate = (shot: Shot) => {
    emit('imageRegenerate', shot);
  };

  // ==================== 场景相关操作 ====================

  // 打开场景库选择
  // 场景hover状态
  const sceneHoveredMap = ref<Map<number, boolean>>(new Map());

  const handleSceneHover = (shot: Shot, isHovered: boolean) => {
    if (shot.basicId) {
      sceneHoveredMap.value.set(shot.basicId, isHovered);
    }
  };

  const isSceneHovered = (shot: Shot) => {
    return shot.basicId ? sceneHoveredMap.value.get(shot.basicId) || false : false;
  };

  // 场景拖拽状态管理
  const sceneDragOverMap = ref<Map<number, boolean>>(new Map());
  const sceneDragCounterMap = ref<Map<number, number>>(new Map());

  const isSceneDragOver = (shot: Shot) => {
    return shot.basicId ? sceneDragOverMap.value.get(shot.basicId) || false : false;
  };

  // 场景拖拽进入
  const handleSceneDragEnter = (event: DragEvent, shot: Shot) => {
    event.preventDefault();
    event.stopPropagation();

    if (!shot.basicId) return;

    // 计数器加1
    const currentCount = sceneDragCounterMap.value.get(shot.basicId) || 0;
    sceneDragCounterMap.value.set(shot.basicId, currentCount + 1);

    sceneDragOverMap.value.set(shot.basicId, true);
  };

  // 场景拖拽经过
  const handleSceneDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // 场景拖拽离开
  const handleSceneDragLeave = (event: DragEvent, shot: Shot) => {
    event.preventDefault();
    event.stopPropagation();

    if (!shot.basicId) return;

    // 计数器减1
    const currentCount = sceneDragCounterMap.value.get(shot.basicId) || 0;
    const newCount = currentCount - 1;
    sceneDragCounterMap.value.set(shot.basicId, newCount);

    // 只有当计数器为0时，才真正离开
    if (newCount === 0) {
      sceneDragOverMap.value.set(shot.basicId, false);
    }
  };

  // 场景拖拽放置
  const handleSceneDrop = async (event: DragEvent, shot: Shot) => {
    event.preventDefault();
    event.stopPropagation();

    if (!shot.basicId) return;

    // 重置状态
    sceneDragOverMap.value.set(shot.basicId, false);
    sceneDragCounterMap.value.set(shot.basicId, 0);

    // 获取拖拽的文件
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    // 过滤出图片文件
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      ElMessage.error('请拖拽图片文件');
      return;
    }

    // 只保留第一张图片
    const file = imageFiles[0];

    // 验证文件大小（限制为25MB）
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过25MB');
      return;
    }

    try {
      ElMessage.info('正在上传场景图片...');

      // 获取文件后缀
      const fileSuffix = file.name.substring(file.name.lastIndexOf('.'));

      // 上传文件到OSS
      const uploadRes = await uploadFile({
        file,
        fileSuffix,
        originalFileName: file.name,
        fileType: 'image',
        resourceType: 2,
        needSync: 0
      });

      // 调用设置场景环境接口
      await setSceneEnv({
        basicId: shot.basicId,
        envType: 2, // 本地上传
        ossId: Number(uploadRes.ossId)
      });

      ElMessage.success('场景上传成功');
      // 刷新数据
      emit('refresh');
    } catch (error) {
      console.error('上传场景失败:', error);
      ElMessage.error('上传场景失败');
    }
  };

  const handleSelectSceneLibrary = (shot: Shot) => {
    currentSceneShot.value = shot;
    sceneLibraryDialogVisible.value = true;
  };

  // 场景库选择确认
  const handleSceneLibraryConfirm = async (scene: LibrarySubInfo) => {
    if (!currentSceneShot.value) return;

    const shot = currentSceneShot.value;
    if (!shot.basicId) {
      ElMessage.error('缺少场景基础信息ID');
      return;
    }

    try {
      // 调用设置场景环境接口
      await setSceneEnv({
        basicId: shot.basicId,
        envType: 1, // 场景库
        envMaterialId: scene.materialVo.id
      });

      ElMessage.success('场景设置成功');
      // 刷新数据
      emit('refresh');
    } catch (error) {
      console.error('设置场景失败:', error);
      ElMessage.error('设置场景失败');
    }
  };

  // 打开场景上传
  const handleUploadScene = (shot: Shot) => {
    currentUploadShot.value = shot;
    sceneUploadInput.value?.click();
  };

  // 处理场景文件选择
  const handleSceneFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file || !currentUploadShot.value) {
      return;
    }

    const shot = currentUploadShot.value;
    if (!shot.basicId) {
      ElMessage.error('缺少场景基础信息ID');
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件');
      return;
    }

    // 验证文件大小（限制为25MB）
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过25MB');
      return;
    }

    try {
      ElMessage.info('正在上传场景图片...');

      // 获取文件后缀
      const fileSuffix = file.name.substring(file.name.lastIndexOf('.'));

      // 上传文件到OSS
      const uploadRes = await uploadFile({
        file,
        fileSuffix,
        originalFileName: file.name,
        fileType: 'image',
        resourceType: 2,
        needSync: 0
      });

      // 调用设置场景环境接口
      await setSceneEnv({
        basicId: shot.basicId,
        envType: 2, // 本地上传
        ossId: Number(uploadRes.ossId)
      });

      ElMessage.success('场景上传成功');
      // 刷新数据
      emit('refresh');
    } catch (error) {
      console.error('上传场景失败:', error);
      ElMessage.error('上传场景失败');
    } finally {
      // 清空文件输入框
      if (sceneUploadInput.value) {
        sceneUploadInput.value.value = '';
      }
    }
  };

  // 删除场景
  const handleDeleteScene = async (shot: Shot) => {
    if (!shot.basicId) {
      ElMessage.error('缺少场景基础信息ID');
      return;
    }

    if (!shot.envMaterialInfoVo) {
      ElMessage.warning('该镜头暂无场景图片');
      return;
    }

    try {
      // 调用清除场景环境接口
      await clearSceneEnv({
        basicId: shot.basicId
      });

      ElMessage.success('场景删除成功');
      // 刷新数据
      emit('refresh');
    } catch (error: any) {
      console.error('删除场景失败:', error);
      ElMessage.error('删除场景失败，请重试');
    }
  };

  // 开始编辑
  const startEdit = (shot: Shot, field: 'sceneDesc' | 'sceneHint' | 'dialogue') => {
    editingCell.value = { shotId: shot.id, field };
    editingValue.value = shot[field] || '';
    originalValue.value = shot[field] || '';
  };

  // 判断是否正在编辑
  const isEditing = (shot: Shot, field: 'sceneDesc' | 'sceneHint' | 'dialogue') => {
    return editingCell.value?.shotId === shot.id && editingCell.value?.field === field;
  };

  // 取消编辑
  const cancelEdit = () => {
    editingCell.value = null;
    editingValue.value = '';
    originalValue.value = '';
  };

  // 重置所有编辑状态（供父组件调用）
  const resetEditState = () => {
    cancelEdit();
  };

  // 处理失焦事件 - 自动保存
  const handleBlur = async (shot: Shot) => {
    if (!editingCell.value) return;

    const field = editingCell.value.field;
    const newValue = editingValue.value.trim();

    // 如果值没有变化，直接退出编辑
    if (newValue === originalValue.value) {
      cancelEdit();
      return;
    }

    // 检查是否有 basicId
    if (!shot.basicId) {
      ElMessage.error('缺少场景基础信息ID，无法保存');
      cancelEdit();
      return;
    }

    try {
      // 调用编辑接口
      const editData: any = {
        basicId: shot.basicId
      };

      // 根据不同字段设置参数
      if (field === 'sceneDesc') {
        editData.sceneDesc = newValue;
      } else if (field === 'sceneHint') {
        editData.sceneHint = newValue;
      } else if (field === 'dialogue') {
        editData.dialogues = newValue;
      }

      await editSceneBasic(editData);

      // 更新本地数据
      shot[field] = newValue;

      // 如果编辑的是 sceneDesc 或 sceneHint，需要同步更新 sceneDescription
      if (field === 'sceneDesc' || field === 'sceneHint') {
        const sceneDesc = field === 'sceneDesc' ? newValue : shot.sceneDesc || '';
        const sceneHint = field === 'sceneHint' ? newValue : shot.sceneHint || '';
        shot.sceneDescription = `${sceneDesc}${sceneDesc && sceneHint ? '\n' : ''}${sceneHint}`;
      }

      // 显示成功提示
      ElMessage.success('更新成功');

      // 清除编辑状态
      editingCell.value = null;
      editingValue.value = '';
      originalValue.value = '';
    } catch (error) {
      console.error('保存失败:', error);
      // 保存失败时不退出编辑状态，让用户可以继续编辑
    }
  };

  // 处理键盘事件
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  };

  // 高亮文本中的角色名称
  const highlightCharacterNames = (text: string, characters: any[]) => {
    if (!text || !characters || characters.length === 0) {
      return text || '';
    }

    // 提取所有角色名称
    const characterNames = characters.map((char) => char.characterName).filter((name) => name && name.trim());

    if (characterNames.length === 0) {
      return text;
    }

    // 按名称长度降序排序，避免短名称覆盖长名称
    characterNames.sort((a, b) => b.length - a.length);

    // 转义 HTML 特殊字符
    let escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // 替换所有匹配的角色名称为加粗样式
    characterNames.forEach((name) => {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedName, 'g');
      escapedText = escapedText.replace(regex, `<strong>${name}</strong>`);
    });

    return escapedText;
  };

  // 点击角色图片
  const handleCharacterClick = (shot: Shot, character: CharacterClothingInfo) => {
    if (!shot.episodeId || !shot.basicId) {
      ElMessage.warning('缺少必要参数');
      return;
    }

    if (!character.characterId && !character.roleId) {
      ElMessage.warning('角色信息不完整');
      return;
    }

    currentCharacterData.value = {
      basicId: shot.basicId,
      episodeId: Number(shot.episodeId),
      roleId: character.roleId || character.characterId || 0
    };
    singleCharacterDialogVisible.value = true;
  };

  // 角色编辑成功
  const handleCharacterEditSuccess = () => {
    ElMessage.success('角色服装编辑成功');
    emit('refresh');
  };

  // 计算画面列宽度 - 根据宽高比动态计算
  const getImageColumnWidth = () => {
    // 固定宽度为 260px（用于竖版和正方形）
    const fixedWidth = 260;
    // 横版比例固定高度为 190px (表格行高)
    const imageHeight = 190;

    // 根据宽高比计算宽度
    const ratioMap: Record<string, { ratio: number; fixedWidth?: number }> = {
      '1:1': { ratio: 1, fixedWidth }, // 正方形，固定宽度
      '16:9': { ratio: 16 / 9 },
      '9:16': { ratio: 9 / 16, fixedWidth }, // 竖版，固定宽度
      '4:3': { ratio: 4 / 3 },
      '3:4': { ratio: 3 / 4, fixedWidth } // 竖版，固定宽度
    };

    const config = ratioMap[props.aspectRatio] || { ratio: 16 / 9 };

    // 如果设置了固定宽度，使用固定宽度
    if (config.fixedWidth) {
      return config.fixedWidth;
    }

    // 横版比例根据高度计算宽度
    const imageWidth = imageHeight * config.ratio;
    return Math.ceil(imageWidth);
  };

  // ==================== 镜号操作功能 ====================

  // 留言
  const handleShotComment = (shot: Shot, event?: MouseEvent) => {
    if (!shot.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }
    currentShotForAction.value = shot;
    if (event) {
      commentTriggerRef.value = event.currentTarget as HTMLElement;
    }
    commentDialogVisible.value = true;
  };

  // 留言成功
  const handleCommentSuccess = () => {
    emit('refresh');
  };

  // 查看留言列表
  const handleViewComments = (shot: Shot, event?: MouseEvent) => {
    if (!shot.basicId) {
      ElMessage.warning('该镜头暂无基础信息，无法查看留言');
      return;
    }
    // 检查是否有评论
    if (!shot.commentCount || shot.commentCount <= 0) {
      ElMessage.info('暂无留言');
      return;
    }

    // 先更新当前操作的镜头和触发元素
    currentShotForAction.value = shot;
    if (event) {
      commentListTriggerRef.value = event.currentTarget as HTMLElement;
    }

    // 如果弹窗已经打开，先关闭再立即打开（触发重新加载）
    if (commentListDialogVisible.value) {
      commentListDialogVisible.value = false;
      // 使用 nextTick 确保状态更新后再打开
      nextTick(() => {
        commentListDialogVisible.value = true;
      });
    } else {
      commentListDialogVisible.value = true;
    }
  };

  // 留言数量变化
  const handleCommentChange = () => {
    emit('refresh');
  };

  // 鼠标离开留言徽章时关闭弹窗
  const handleCommentMouseLeave = () => {
    // hover 模式下不需要手动关闭，el-popover 会自动处理
  };

  // 插入镜头
  const handleShotInsert = async (shot: Shot) => {
    if (!shot.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    try {
      await ElMessageBox.confirm('确定要在此镜头后插入新镜头吗？', '插入镜头', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      });

      await addScene({
        preBasicId: shot.basicId,
        sceneType: 1 // 1-图片
      });

      ElMessage.success('插入镜头成功');
      emit('refresh');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('插入镜头失败:', error);
        ElMessage.error('插入镜头失败，请重试');
      }
    }
  };

  // 评审
  const handleShotReview = (shot: Shot, event?: MouseEvent) => {
    if (!shot.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    // 检查是否可以评审（只有橙色、红色、绿色状态才能评审）
    if (shot.imgStatus !== 1 && shot.imgStatus !== 2 && shot.imgStatus !== 3) {
      ElMessage.warning('只能对橙色、红色、绿色状态的镜头进行评审');
      return;
    }

    currentShotForAction.value = shot;
    if (event) {
      reviewTriggerRef.value = event.currentTarget as HTMLElement;
    }
    reviewDialogVisible.value = true;
  };

  // 评审成功
  const handleReviewSuccess = (reviewType: number) => {
    // 无感刷新：直接更新当前镜头的状态，不重新加载整个列表
    if (currentShotForAction.value) {
      // reviewType: 1-通过(绿色) 2-待修改(红色)
      currentShotForAction.value.imgStatus = reviewType === 1 ? 2 : 3;
    }
  };

  // 删除镜头
  const handleShotDelete = async (shot: Shot) => {
    if (!shot.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }

    try {
      await ElMessageBox.confirm(`确定要删除镜号 ${shot.shotNumber} 吗？此操作不可恢复。`, '删除镜头', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      });

      await deleteScene([shot.basicId]);
      ElMessage.success('删除镜头成功');
      // 通知父组件删除成功，父组件可以选择直接移除数据或重新请求
      emit('deleteSuccess', shot.basicId);
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除镜头失败:', error);
        ElMessage.error('删除镜头失败，请重试');
      }
    }
  };

  // ==================== 拖拽排序功能（使用 sortablejs）====================

  // 保存 Sortable 实例
  let sortableInstance: any = null;

  // 初始化自动滚动 composable（垂直滚动）
  const autoScroll = useAutoScroll({
    direction: 'vertical',
    threshold: 350,
    minSpeed: 15,
    maxSpeed: 80
  });

  // 初始化拖拽功能
  const initDraggable = () => {
    nextTick(() => {
      // 添加延迟确保 Element Plus 的 el-scrollbar__wrap 完全渲染
      setTimeout(() => {
        const table = tableRef.value;
        if (!table) return;

        const tbody = table.$el.querySelector('.el-table__body-wrapper tbody');
        if (!tbody) return;

        // 获取滚动容器 - 智能选择有滚动条的容器
        let scrollContainer: HTMLElement | null = null;

        // 尝试1: Element Plus 表格的真实滚动容器（el-scrollbar__wrap）
        const elScrollbarWrap = table.$el.querySelector('.el-scrollbar__wrap') as HTMLElement;

        // 选择有滚动条的容器（scrollHeight > clientHeight）
        if (elScrollbarWrap && elScrollbarWrap.scrollHeight > elScrollbarWrap.clientHeight) {
          scrollContainer = elScrollbarWrap;
        }
        if (!scrollContainer) return;

        // 如果已经存在实例，先销毁
        if (sortableInstance) {
          sortableInstance.destroy();
          sortableInstance = null;
        }

        // 创建新的 Sortable 实例
        sortableInstance = Sortable.create(tbody, {
          handle: '.drag-handle', // 指定拖拽手柄
          animation: 200, // 动画时间
          ghostClass: 'ghost-row', // 拖拽时的占位样式
          chosenClass: 'chosen-row', // 选中时的样式
          dragClass: 'dragging-row', // 拖拽中的样式
          forceFallback: false, // 使用 HTML5 原生拖拽
          // 拖拽开始时，设置滚动容器并添加鼠标移动监听
          onStart: (event: SortableEvent) => {
            // 初始化鼠标位置
            const originalEvent = event as any;
            const initialMouseY = originalEvent.originalEvent?.clientY;
            // 启动自动滚动
            autoScroll.start(scrollContainer as HTMLElement, initialMouseY);
          },
          // 添加 onMove 回调以实时捕获鼠标位置
          onMove: (event: any) => {
            return true; // 返回 true 允许移动
          },
          onEnd: async (event: SortableEvent) => {
            // 停止自动滚动
            autoScroll.stop();
            const { oldIndex, newIndex } = event;

            // 如果位置没有变化，直接返回
            if (oldIndex === newIndex || oldIndex === undefined || newIndex === undefined) {
              return;
            }

            try {
              // 获取被拖拽的场景
              const draggedShot = localShots.value[oldIndex];

              if (!draggedShot || !draggedShot.basicId) {
                ElMessage.error('场景数据无效');
                // 恢复原始顺序
                localShots.value = [...props.shots];
                return;
              }

              // 确定 targetBasicId：接口定义为"拖到这个镜头的前面"，为 undefined 表示拖到最后
              let targetBasicId: number | undefined;

              if (newIndex + 1 < localShots.value.length) {
                // 不是拖到最后，获取拖拽后该场景后面的那个场景
                const nextShot = localShots.value[newIndex + 1];
                targetBasicId = nextShot.basicId;
              }

              // 先更新本地数据（乐观更新）
              const item = localShots.value.splice(oldIndex, 1)[0];
              localShots.value.splice(newIndex, 0, item);

              // 调用接口进行排序
              await dragSortScene({
                dragBasicId: draggedShot.basicId,
                targetBasicId: targetBasicId
              });

              ElMessage.success('镜号顺序调整成功');
              // 刷新列表
              emit('refresh');
            } catch (error) {
              console.error('拖拽排序失败:', error);
              ElMessage.error('拖拽排序失败，请重试');
              // 恢复原始顺序
              localShots.value = [...props.shots];
            }
          }
        });
      }, 500); // 延迟 500ms 确保 Element Plus 滚动容器已完全渲染
    });
  };

  // 监听本地数据变化，数据更新后重新初始化拖拽
  watch(
    () => localShots.value.length,
    () => {
      // 只有在非加载状态下才重新初始化
      if (!props.loading && localShots.value.length > 0) {
        initDraggable();
      }
    }
  );

  // 暴露方法给父组件
  defineExpose({
    resetEditState
  });
</script>

<style scoped lang="scss">
  .storyboard-table-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: rgb(255 255 255 / 90%);

      .loading-content {
        text-align: center;

        .loading-text {
          margin-top: 20px;
          color: #606266;
          font-size: 16px;
        }
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      .empty-content {
        text-align: center;

        .empty-text {
          margin-top: 20px;
          color: #909399;
          font-size: 16px;
        }
      }
    }

    .table-wrapper {
      width: 100%;
      height: 100%;
      // padding: 0px 20px 0 0;
      overflow-x: auto; // 允许横向滚动

      // 滚动条样式优化
      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 4px;

        &:hover {
          background: #c0c4cc;
        }
      }

      &::-webkit-scrollbar-track {
        background: #f5f7fa;
        border-radius: 4px;
      }

      .storyboard-table {
        min-width: 100%; // 确保表格可以横向扩展
      }

      .editable-cell {
        position: relative;
        max-height: 100%;
        padding: 8px;
        cursor: text;
        transition: background-color 0.2s;
        overflow: hidden;
        display: flex;
        align-items: center;

        &:hover {
          background-color: #f5f7fa;
        }
      }

      .editing-cell {
        padding: 8px;
      }

      .scene-description {
        color: #606266;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3; // 最多显示3行
        -webkit-box-orient: vertical;

        &.empty-placeholder {
          color: #c0c4cc;
          // font-style: italic;
        }
      }

      .dialogue {
        color: #606266;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 7; // 最多显示3行
        -webkit-box-orient: vertical;

        &.empty-placeholder {
          color: #c0c4cc;
          // font-style: italic;
        }
      }

      .characters {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        justify-content: center;
        align-items: center;

        .character-avatar {
          width: 40px;
          height: 40px;
          border-radius: 100%;
          cursor: pointer;
          border: 0.5px solid #eee;

          &.character-clickable {
            transition: all 0.3s;
          }
        }
      }

      // 画面列单元格样式 - 完全移除padding，图片铺满
      :deep(.el-table__body .el-table__row .el-table__cell:has(.scene-image-cell)) {
        padding: 0 !important;
        cursor: pointer;
        height: 190px !important;
        vertical-align: middle;
        overflow: hidden;
        isolation: isolate; // 创建新的层叠上下文，防止hover-overlay溢出到其他列

        .cell {
          padding: 0 !important;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hover-overlay {
          opacity: 0;
        }
        &:hover {
          .hover-overlay {
            opacity: 1;
          }
        }
      }

      // 画面列表头样式
      :deep(.el-table__header .el-table__cell:has(div:contains('画面'))) {
        height: 50px !important;
      }

      // 其他列单元格样式 - 固定高度190px，内容超出滚动或省略
      :deep(.el-table__body .el-table__row) {
        height: 190px !important;
        background-color: #fff;
        transition: background-color 0.2s ease;
        position: relative;

        &:hover {
          > td {
            background-color: #f3f3ff !important;
          }
        }

        // ==================== Sortable.js 拖拽样式 ====================
        // 拖拽时的占位符样式（ghost）
        &.ghost-row {
          opacity: 0.4;
          background-color: #e0e7ff !important;

          > td {
            background-color: #e0e7ff !important;
            border: 2px dashed #5252ff !important;
          }
        }

        // 选中时的样式（chosen）
        &.chosen-row {
          background-color: #f0f4ff !important;
          box-shadow: 0 4px 12px rgba(82, 82, 255, 0.2);

          > td {
            background-color: #f0f4ff !important;
            border-color: #5252ff !important;
          }
        }

        // 拖拽中的样式（dragging）
        &.dragging-row {
          opacity: 0.9;
          background-color: #fff !important;
          box-shadow: 0 8px 24px rgba(82, 82, 255, 0.4);
          transform: scale(1.02);
          cursor: grabbing !important;

          > td {
            background-color: #fff !important;
            border: 2px solid #5252ff !important;
          }
        }
      }

      :deep(.el-table__body .el-table__row .el-table__cell) {
        height: 190px !important;
        vertical-align: middle;
        overflow: hidden;
        background-color: #fff;

        &:not(:has(.scene-image-cell)) {
          padding: 12px !important;
        }
      }

      // Fixed列在hover时也需要改变背景色
      :deep(.el-table__fixed) {
        .el-table__body .el-table__row:hover .el-table__cell {
          background-color: #f3f3ff !important;
        }
      }

      :deep(.el-table__fixed-right) {
        .el-table__body .el-table__row:hover .el-table__cell {
          background-color: #f3f3ff !important;
        }
      }

      // 镜号列样式
      .shot-number-cell {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #1d2129;
        width: 100%;
        height: 100%;
        min-height: 160px; // 确保高度充足

        .shot-number-text {
          font-size: 14px;
          color: #4e5969;
          display: flex;
          width: 40px;
          height: 40px;
          padding-right: 0.008px;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #f7f8fa;
          transition: all 0.3s ease;

          // 拖拽手柄样式
          &.drag-handle {
            cursor: grab;
            user-select: none;

            &:hover {
              background: #e8e9eb;
              transform: scale(1.05);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            &:active {
              cursor: grabbing;
              transform: scale(0.98);
            }
          }
        }

        // 留言数量徽标
        .comment-count-badge {
          position: absolute;
          left: -10px;
          bottom: -10px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          z-index: 10;
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: #fff;
          &:hover {
            // background: #4141dd;
            transform: scale(1.05);
          }

          .comment-icon {
            font-size: 12px;
            width: 12px;
            height: 12px;
            color: #5252ff;
          }

          .count-text {
            position: absolute;
            left: 12px;
            top: -12px;
            display: flex;
            width: 20px;
            height: 20px;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            border-radius: 50%;
            background: #5252ff;
            color: #fff;
            font-size: 12px;
            line-height: 20px; /* 133.333% */
          }
        }
      }

      // 镜号列单元格hover效果
      :deep(.el-table__body .el-table__row .el-table__cell:first-child) {
        overflow: visible !important;
        position: relative;

        .cell {
          overflow: visible !important;
        }

        &:hover {
          z-index: 10;

          .shot-number-actions {
            .action-menu {
              opacity: 1;
              visibility: visible;
              pointer-events: auto;
            }
          }
        }
      }

      // 场景列单元格hover效果
      :deep(.el-table__body .el-table__row .el-table__cell:has(.scene-location-cell)) {
        padding: 12px !important;
        cursor: pointer;
        vertical-align: middle;
        height: 190px !important;

        .cell {
          padding: 0 !important;
        }

        &:hover {
          .scene-actions {
            opacity: 1;
          }
        }
      }

      .scene-location-cell {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transition: all 0.3s ease;

        // 拖拽悬停状态
        &.drag-over {
          background: linear-gradient(135deg, rgba(82, 82, 255, 0.1) 0%, rgba(190, 117, 254, 0.1) 100%);
          border: 2px dashed #5252ff;
          box-shadow: inset 0 0 20px rgba(82, 82, 255, 0.15);

          &::after {
            content: '释放以上传场景图片';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            padding: 12px 24px;
            border-radius: 8px;
            background: rgba(82, 82, 255, 0.95);
            color: #fff;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(82, 82, 255, 0.3);
          }
        }

        .scene-image-wrapper {
          position: relative;
          width: 156px; // 180 - 24px padding
          height: 88px; // 保持16:9比例
          overflow: hidden;

          .scene-location-image {
            width: 100%;
            height: 100%;
            cursor: pointer;
          }

          .scene-placeholder {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
          }

          // Hover操作按钮
          .scene-actions {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;

            // background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
            backdrop-filter: blur(2px);
            opacity: 0;
            transition: opacity 0.25s ease;
            padding: 12px;
            .scence-box {
              display: flex;
              align-items: center;
              .sence-btn {
                display: flex;
                width: 40px;
                height: 40px;
                justify-content: center;
                align-items: center;
                border-radius: 8px;
                background: #f7f8fa;
                color: #4e5969;
                &:hover {
                  border: none;
                }
              }
            }
          }
        }

        .scene-name {
          color: #606266;
          font-size: 13px;
          text-align: center;
          word-break: break-word;
        }
      }

      // ==================== 场景列样式 ====================
      // 场景列单元格样式 - 完全移除padding，图片铺满
      :deep(.el-table__body .el-table__row .el-table__cell:has(.scene-location-cell)) {
        padding: 0 !important;
        cursor: pointer;
        height: 190px !important;
        vertical-align: middle;
        overflow: hidden;
        isolation: isolate; // 创建新的层叠上下文，防止hover-overlay溢出到其他列

        .cell {
          padding: 0 !important;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .scene-location-cell {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%; // 填满父容器（190px）
        overflow: hidden;

        // 根据宽高比设置最大高度限制，与画面列保持一致
        &[data-aspect-ratio='16:9'],
        &[data-aspect-ratio='4:3'] {
          max-height: 190px; // 横版比例保持正常行高
        }

        &[data-aspect-ratio='9:16'] {
          max-height: 462px; // 竖版 9:16，260px * (16/9) ≈ 462px
        }

        &[data-aspect-ratio='1:1'] {
          max-height: 260px; // 正方形 1:1
        }

        &[data-aspect-ratio='3:4'] {
          max-height: 347px; // 竖版 3:4，260px * (4/3) ≈ 347px
        }

        .scene-hover-overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 12px;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%);
          pointer-events: none; // 允许点击事件穿透到下层图片，触发预览

          .scene-top-actions {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;

            .scene-action-btn {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 40px;
              height: 40px;
              border-radius: 8px;
              background: #f7f8fa;
              cursor: pointer;
              transition: all 0.3s;
              pointer-events: auto; // 恢复按钮的交互能力

              &:hover {
                background: white;
                transform: scale(1.1);
              }

              &:active {
                transform: scale(0.95);
              }

              .svg-icon {
                font-size: 20px;
              }

              // 删除按钮特殊样式
              &.scene-delete-btn {
                &:hover {
                  background: #fef0f0;
                  .svg-icon {
                    color: #f56c6c;
                  }
                }
              }
            }
          }
        }

        .scene-image-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          .scene-location-image {
            width: 100%;
            height: 100%;
            object-fit: contain; // 使用contain以完整显示图片，不裁剪
            cursor: pointer;
          }
        }

        // 为 scene-image-container 和 scene-location-image 根据比例设置最大高度
        &[data-aspect-ratio='16:9'],
        &[data-aspect-ratio='4:3'] {
          .scene-image-container,
          .scene-location-image {
            max-height: 190px; // 横版比例保持正常行高
          }
        }

        &[data-aspect-ratio='9:16'] {
          .scene-image-container,
          .scene-location-image {
            max-height: 462px; // 竖版 9:16
          }
        }

        &[data-aspect-ratio='1:1'] {
          .scene-image-container,
          .scene-location-image {
            max-height: 260px; // 正方形 1:1
          }
        }

        &[data-aspect-ratio='3:4'] {
          .scene-image-container,
          .scene-location-image {
            max-height: 347px; // 竖版 3:4
          }
        }

        .scene-placeholder {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;

          .placeholder-image {
            width: 120px;
            height: 120px;
            object-fit: contain;
            opacity: 0.5;
          }
        }
      }
    }
  }
</style>
