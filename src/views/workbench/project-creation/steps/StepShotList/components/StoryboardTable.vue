<template>
  <div class="storyboard-table-container">
    <!-- 加载中 -->
    <div v-if="loading" v-loading="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" :size="60"><Loading /></el-icon>
        <p class="loading-text">分镜生成中，请稍等...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="shots.length === 0" class="empty-state">
      <div class="empty-content">
        <img style="width: 200px; height: 200px" src="../../../../../../assets/images/no-image-light.png" alt="" />
        <p class="empty-text">暂无分镜</p>
      </div>
    </div>

    <!-- 分镜表格 -->
    <div v-else class="table-wrapper">
      <el-table :data="shots" border stripe height="100%">
        <el-table-column prop="shotNumber" label="镜号" width="80" align="center" />

        <el-table-column label="画面" width="180" align="center">
          <template #default="{ row }">
            <SceneImageCell
              :image-url="row.sceneImage"
              :aspect-ratio="aspectRatio"
              :shot-id="row.id"
              :is-favorite="row.isFavorite"
              :loading="row.imageLoading"
              @upload="(file:any) => handleImageUpload(row, file)"
              @show-history="handleShowHistory(row)"
              @download="handleImageDownload(row)"
              @crop="handleImageCrop(row)"
              @toggle-favorite="handleToggleFavorite(row)"
              @regenerate="handleImageRegenerate(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="sceneHint" label="画面描述" min-width="200">
          <template #default="{ row }">
            <div v-if="!isEditing(row, 'sceneDesc')" class="editable-cell" @click="startEdit(row, 'sceneDesc')">
              <div class="scene-description">{{ row.sceneDesc }}</div>
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
              <div class="scene-description">{{ row.sceneHint }}</div>
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
              <div class="dialogue">{{ row.dialogue }}</div>
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
              <el-tag
                v-for="(character, index) in row.characters"
                :key="index"
                size="small"
                type="primary"
                round
                class="character-tag"
              >
                {{ character }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sceneLocation" label="场景" width="180">
          <template #default="{ row }">
            <div class="scene-location-cell">
              <div class="scene-image-wrapper">
                <el-image
                  v-if="row.sceneLocationImage"
                  :src="row.sceneLocationImage"
                  fit="cover"
                  class="scene-location-image"
                  :preview-src-list="[row.sceneLocationImage]"
                />
                <div v-else class="scene-placeholder">
                  <img
                    src="../../../../../../assets/images/no-image-light.png"
                    alt="暂无图片"
                    class="placeholder-image"
                  />
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 图片裁剪弹窗 -->
    <ImageCropDialog
      v-model="cropDialogVisible"
      :image-url="currentCropImage"
      :aspect-ratio="aspectRatio"
      @confirm="handleCropConfirm"
    />

    <!-- 历史记录弹窗 -->
    <ImageHistoryDialog v-model="historyDialogVisible" :shot-id="currentShotId" @select="handleHistorySelect" />
  </div>
</template>

<script setup lang="ts">
  import { editSceneBasic } from '@/api/workbench/episode';
  import type { Shot } from '@/api/workbench/project/types';
  import { Edit, Loading } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { ref } from 'vue';
  import ImageCropDialog from './ImageCropDialog.vue';
  import ImageHistoryDialog from './ImageHistoryDialog.vue';
  import SceneImageCell from './SceneImageCell.vue';

  interface Props {
    shots: Shot[];
    aspectRatio: string;
    loading?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<{
    (e: 'imageUpload', shot: Shot, file: File): void;
    (e: 'imageRegenerate', shot: Shot): void;
    (e: 'toggleFavorite', shot: Shot): void;
    (e: 'updateShot', shot: Shot): void;
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

  // 裁剪确认
  const handleCropConfirm = (blob: Blob) => {
    if (!currentCropShot.value) return;

    // 将 blob 转换为文件
    const file = new File([blob], `shot-${currentCropShot.value.shotNumber}-cropped.jpg`, {
      type: 'image/jpeg'
    });

    emit('imageUpload', currentCropShot.value, file);
    ElMessage.success('裁剪成功');
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

      ElMessage.success('保存成功');

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

      .editable-cell {
        position: relative;
        min-height: 40px;
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.2s;

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
      }

      .dialogue {
        color: #606266;
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .characters {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .character-tag {
          margin: 0;
        }
      }

      .scene-location-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 8px 0;

        .scene-image-wrapper {
          width: 100%;
          height: 80px;
          border-radius: 4px;
          overflow: hidden;
          background: #f5f7fa;

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
              width: 60px;
              height: 60px;
              opacity: 0.5;
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
