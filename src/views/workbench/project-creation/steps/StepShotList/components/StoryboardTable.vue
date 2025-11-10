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
      <el-table :data="shots" border stripe height="100%" class="storyboard-table">
        <el-table-column prop="shotNumber" label="镜号" width="120" align="center" fixed>
          <template #default="{ row }">
            <div class="shot-number-cell">
              <ShotNumberActions
                :shot-number="row.shotNumber"
                :comment-count="row.commentCount || 0"
                @comment="(event) => handleShotComment(row, event)"
                @insert="handleShotInsert(row)"
                @review="(event) => handleShotReview(row, event)"
                @delete="handleShotDelete(row)"
                @view-comments="handleViewComments(row)"
              />
              <span class="shot-number-text">{{ row.shotNumber }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="画面" :width="getImageColumnWidth()" align="center" fixed>
          <template #default="{ row }">
            <SceneImageCell
              :image-url="row.sceneImage"
              :material-info-vo-list="row.materialInfoVoList"
              :aspect-ratio="aspectRatio"
              :shot-id="row.id"
              :basic-id="row.basicId"
              :history-detail-id="row.historyDetailId"
              :is-favorite="row.isFavorite"
              :loading="row.imageLoading"
              :task-status="row.taskStatus"
              :model-points="modelPoints"
              @upload="(file:any) => handleImageUpload(row, file)"
              @show-history="handleShowHistory(row)"
              @download="handleImageDownload(row)"
              @crop="handleImageCrop(row)"
              @toggle-favorite="handleToggleFavorite(row)"
              @regenerate="handleImageRegenerate(row)"
              @refresh="emit('refresh')"
            />
          </template>
        </el-table-column>

        <el-table-column prop="sceneHint" label="画面描述" min-width="200">
          <template #default="{ row }">
            <div v-if="!isEditing(row, 'sceneDesc')" class="editable-cell" @click="startEdit(row, 'sceneDesc')">
              <div class="scene-description" v-html="highlightCharacterNames(row.sceneDesc, row.characters)"></div>
              <el-icon class="edit-icon"><Edit /></el-icon>
            </div>
            <div v-else class="editing-cell">
              <el-input
                v-model="editingValue"
                type="textarea"
                :rows="3"
                placeholder="请输入特写镜头描述"
                @keydown="handleKeydown($event, row)"
                autofocus
              />
              <div class="edit-actions">
                <el-button size="small" @click.stop="cancelEdit">取消</el-button>
                <el-button size="small" type="primary" @click.stop="saveEdit(row)">保存</el-button>
              </div>
            </div>
            <div v-if="!isEditing(row, 'sceneHint')" class="editable-cell" @click="startEdit(row, 'sceneHint')">
              <div class="scene-description" v-html="highlightCharacterNames(row.sceneHint, row.characters)"></div>
              <el-icon class="edit-icon"><Edit /></el-icon>
            </div>
            <div v-else class="editing-cell">
              <el-input
                v-model="editingValue"
                type="textarea"
                :rows="3"
                placeholder="请输入场景提示"
                @keydown="handleKeydown($event, row)"
                autofocus
              />
              <div class="edit-actions">
                <el-button size="small" @click.stop="cancelEdit">取消</el-button>
                <el-button size="small" type="primary" @click.stop="saveEdit(row)">保存</el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="dialogue" label="台词" min-width="150">
          <template #default="{ row }">
            <div v-if="!isEditing(row, 'dialogue')" class="editable-cell" @click="startEdit(row, 'dialogue')">
              <div class="dialogue" v-html="highlightCharacterNames(row.dialogue, row.characters)"></div>
              <el-icon class="edit-icon"><Edit /></el-icon>
            </div>
            <div v-else class="editing-cell">
              <el-input
                v-model="editingValue"
                type="textarea"
                :rows="3"
                placeholder="请输入台词"
                @keydown="handleKeydown($event, row)"
                autofocus
              />
              <div class="edit-actions">
                <el-button size="small" @click.stop="cancelEdit">取消</el-button>
                <el-button size="small" type="primary" @click.stop="saveEdit(row)">保存</el-button>
              </div>
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
                fit="cover"
                class="character-avatar character-clickable"
                @click="handleCharacterClick(row, character)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sceneLocation" label="场景" width="180">
          <template #default="{ row }">
            <div class="scene-location-cell">
              <div class="scene-image-wrapper">
                <el-image
                  v-if="row.envMaterialInfoVo"
                  :src="row.envMaterialInfoVo.previewOssUrl || row.envMaterialInfoVo.originOssUrl"
                  fit="cover"
                  class="scene-location-image"
                  :preview-src-list="[row.envMaterialInfoVo.previewOssUrl || row.envMaterialInfoVo.originOssUrl]"
                />
                <div v-else class="scene-placeholder">
                  <img src="../../../../../../assets/images/no-sence.png" alt="暂无图片" class="placeholder-image" />
                </div>
                <!-- Hover操作按钮 -->
                <div class="scene-actions">
                  <div class="scence-box">
                    <el-tooltip content="场景库" placement="top">
                      <el-button class="sence-btn" @click="handleSelectSceneLibrary(row)">
                        <svg-icon icon-class="fy-sence-tupian" class="el-icon" />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="上传" placement="top">
                      <el-button class="sence-btn" @click="handleUploadScene(row)">
                        <svg-icon icon-class="fy-sence-upload" class="el-icon" />
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <template #empty>
          <div class="empty-state">
            <div class="empty-content">
              <img
                style="width: 200px; height: 200px"
                src="../../../../../../assets/images/no-image-light.png"
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

    <!-- 历史记录弹窗 -->
    <ImageHistoryDialog v-model="historyDialogVisible" :shot-id="currentShotId" @select="handleHistorySelect" />

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

    <!-- 留言列表对话框 -->
    <CommentListDialog
      v-model="commentListDialogVisible"
      :basic-id="currentShotForAction?.basicId || 0"
      :scene-type="1"
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
  import { editSceneBasic, setSceneEnv } from '@/api/workbench/episode';
  import type { CharacterClothingInfo } from '@/api/workbench/episode/types';
  import type { EpisodeInfo, LibrarySubInfo, Shot } from '@/api/workbench/project/types';
  import { addScene, deleteScene } from '@/api/workbench/storyboard';
  import { uploadFile } from '@/utils/uploadFile';
  import { Edit, Loading } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { ref } from 'vue';
  import CommentDialog from './CommentDialog.vue';
  import CommentListDialog from './CommentListDialog.vue';
  import ImageCropDialog from './ImageCropDialog.vue';
  import ImageHistoryDialog from './ImageHistoryDialog.vue';
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
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<{
    (e: 'imageUpload', shot: Shot, file: File): void;
    (e: 'imageRegenerate', shot: Shot): void;
    (e: 'toggleFavorite', shot: Shot): void;
    (e: 'updateShot', shot: Shot): void;
    (e: 'refresh'): void;
    (e: 'deleteSuccess', basicId: number): void;
  }>();

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
  const handleImageCrop = (shot: Shot) => {
    currentCropShot.value = shot;
    currentCropImage.value = shot.sceneImage || '';
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
  const handleToggleFavorite = (shot: Shot) => {
    emit('toggleFavorite', shot);
  };

  // 重新生成图片
  const handleImageRegenerate = (shot: Shot) => {
    emit('imageRegenerate', shot);
  };

  // ==================== 场景相关操作 ====================

  // 打开场景库选择
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

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过10MB');
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

  // 保存编辑
  const saveEdit = async (shot: Shot) => {
    if (!editingCell.value) return;

    const field = editingCell.value.field;
    const newValue = editingValue.value.trim();

    // 如果值没有变化，直接取消编辑
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

      // 清除编辑状态
      editingCell.value = null;
      editingValue.value = '';
      originalValue.value = '';
    } catch (error) {
      console.error('保存失败:', error);
      ElMessage.error('保存失败，请重试');
    }
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

  // 处理键盘事件
  const handleKeydown = (event: KeyboardEvent, shot: Shot) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveEdit(shot);
    } else if (event.key === 'Escape') {
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
    // 固定高度为 190px (表格行高)
    const imageHeight = 190;

    // 根据宽高比计算宽度
    const ratioMap: Record<string, number> = {
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '3:4': 3 / 4
    };

    const ratio = ratioMap[props.aspectRatio] || 16 / 9;
    const imageWidth = imageHeight * ratio;

    // 列宽 = 图片宽度 (不加padding，完全铺满)
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
  const handleViewComments = (shot: Shot) => {
    if (!shot.basicId) {
      ElMessage.warning('缺少场景基础信息ID');
      return;
    }
    currentShotForAction.value = shot;
    commentListDialogVisible.value = true;
  };

  // 留言数量变化
  const handleCommentChange = () => {
    emit('refresh');
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
  const handleReviewSuccess = () => {
    emit('refresh');
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
      padding: 20px 20px 0;
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
        cursor: pointer;
        transition: background-color 0.2s;
        overflow: hidden;
        display: flex;
        align-items: center;

        &:hover {
          background-color: #f5f7fa;

          .edit-icon {
            opacity: 1;
          }
        }

        .edit-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          color: #409eff;
          font-size: 14px;
          transition: opacity 0.2s;
        }
      }

      .editing-cell {
        padding: 8px;

        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }
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
      }

      .dialogue {
        color: #606266;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3; // 最多显示3行
        -webkit-box-orient: vertical;
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
        z-index: 1;

        &:hover {
          background-color: #f3f3ff !important;
          z-index: 2;

          > td {
            background-color: transparent !important;
          }
        }
      }

      :deep(.el-table__body .el-table__row .el-table__cell) {
        height: 190px !important;
        vertical-align: middle;
        overflow: hidden;

        &:not(:has(.scene-image-cell)) {
          padding: 12px !important;
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
        height: 100%;

        .shot-number-text {
          min-width: 24px;
          text-align: center;
        }
      }

      // 镜号列单元格hover效果
      :deep(.el-table__body .el-table__row .el-table__cell:first-child) {
        overflow: visible !important;
        position: relative;
        z-index: 10;

        .cell {
          overflow: visible !important;
        }

        &:hover {
          z-index: 100;

          .shot-number-actions {
            .action-dot {
              .dot-inner {
                background-color: #5468ff;
                transform: scale(1.2);
              }
            }

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
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;

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

            .placeholder-image {
              width: 80px;
              height: 80px;
              // opacity: 0.5;
            }
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
    }
  }
</style>
