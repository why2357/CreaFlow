<template>
  <div class="scene-image-cell" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
    <!-- 加载状态 -->
    <div v-if="loading" v-loading="loading" class="loading-overlay">
      <p class="loading-text">图片生成中...</p>
    </div>

    <!-- 图片显示 -->
    <div v-else-if="imageUrl" class="image-container">
      <el-image :src="imageUrl" :fit="fit" class="scene-image" :preview-src-list="[imageUrl]" />

      <!-- 收藏标记 -->
      <div v-if="isFavorite" class="favorite-badge">
        <el-icon><StarFilled /></el-icon>
      </div>

      <!-- 悬浮操作层 -->
      <transition name="fade">
        <div v-show="isHovered" class="hover-overlay">
          <!-- 顶部操作按钮 -->
          <div class="top-actions">
            <el-tooltip content="本地上传" placement="top">
              <div class="action-btn" @click="handleUpload">
                <el-icon><Upload /></el-icon>
              </div>
            </el-tooltip>

            <el-tooltip content="查看历史" placement="top">
              <div class="action-btn" @click="handleShowHistory">
                <el-icon><Clock /></el-icon>
              </div>
            </el-tooltip>

            <el-tooltip content="下载图片" placement="top">
              <div class="action-btn" @click="handleDownload">
                <el-icon><Download /></el-icon>
              </div>
            </el-tooltip>

            <el-tooltip content="裁剪图片" placement="top">
              <div class="action-btn" @click="handleCrop">
                <el-icon><Crop /></el-icon>
              </div>
            </el-tooltip>

            <el-tooltip :content="isFavorite ? '取消收藏' : '收藏'" placement="top">
              <div class="action-btn" :class="{ active: isFavorite }" @click="handleToggleFavorite">
                <el-icon v-if="isFavorite"><StarFilled /></el-icon>
                <el-icon v-else><Star /></el-icon>
              </div>
            </el-tooltip>
          </div>

          <!-- 底部操作按钮 -->
          <div class="bottom-actions">
            <el-button size="small" disabled>
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="primary" @click="handleRegenerate">
              <el-icon><Refresh /></el-icon>
              立即生成
            </el-button>
          </div>
        </div>
      </transition>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-placeholder" @click="handleRegenerate">
      <el-icon :size="32"><Picture /></el-icon>
      <p class="placeholder-text">点击生成图片</p>
    </div>

    <!-- 隐藏的文件上传 -->
    <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="handleFileSelected" />
  </div>
</template>

<script setup lang="ts">
  import { Clock, Crop, Download, Edit, Picture, Refresh, Star, StarFilled, Upload } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref } from 'vue';

  interface Props {
    imageUrl?: string;
    aspectRatio?: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
    shotId: string | number;
    isFavorite?: boolean;
    loading?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    imageUrl: '',
    aspectRatio: '16:9',
    isFavorite: false,
    loading: false
  });

  const emit = defineEmits<{
    (e: 'upload', file: File): void;
    (e: 'showHistory'): void;
    (e: 'download'): void;
    (e: 'crop'): void;
    (e: 'toggleFavorite'): void;
    (e: 'regenerate'): void;
  }>();

  // 状态
  const isHovered = ref(false);
  const fileInputRef = ref<HTMLInputElement>();

  // 计算图片填充方式
  const fit = computed(() => {
    // 根据图片比例决定填充方式
    // 对于表格单元格，我们限定高度，宽度自适应更合适
    return 'contain';
  });

  // 本地上传
  const handleUpload = () => {
    fileInputRef.value?.click();
  };

  // 文件选择
  const handleFileSelected = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // 验证图片比例
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
        img.onload = () => {
          const imageRatio = img.width / img.height;
          const expectedRatio = getExpectedRatio(props.aspectRatio);

          // 允许5%的误差
          if (Math.abs(imageRatio - expectedRatio) / expectedRatio > 0.05) {
            ElMessage.warning(`请上传比例为 ${props.aspectRatio} 的图片`);
            return;
          }

          emit('upload', file);
        };
      };

      reader.readAsDataURL(file);
    }

    // 清空input，允许重复选择同一文件
    target.value = '';
  };

  // 获取期望的宽高比
  const getExpectedRatio = (ratio: string): number => {
    const ratioMap: Record<string, number> = {
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '3:4': 3 / 4
    };
    return ratioMap[ratio] || 16 / 9;
  };

  // 查看历史
  const handleShowHistory = () => {
    emit('showHistory');
  };

  // 下载图片
  const handleDownload = () => {
    if (!props.imageUrl) {
      ElMessage.warning('暂无图片可下载');
      return;
    }
    emit('download');
  };

  // 裁剪图片
  const handleCrop = () => {
    if (!props.imageUrl) {
      ElMessage.warning('暂无图片可裁剪');
      return;
    }
    emit('crop');
  };

  // 收藏/取消收藏
  const handleToggleFavorite = () => {
    emit('toggleFavorite');
  };

  // 重新生成
  const handleRegenerate = () => {
    emit('regenerate');
  };
</script>

<style scoped lang="scss">
  .scene-image-cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 120px; // 固定高度，宽度自适应
    overflow: hidden;
    border-radius: 4px;
    background: #f5f7fa;

    .loading-overlay {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: rgb(255 255 255 / 90%);

      .loading-text {
        margin-top: 12px;
        color: #606266;
        font-size: 13px;
      }
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;

      .scene-image {
        width: 100%;
        height: 100%;
        cursor: pointer;
      }

      .favorite-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgb(255 193 7 / 90%);
        box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
        color: white;
        font-size: 14px;
      }

      .hover-overlay {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 12px;
        background: rgb(0 0 0 / 70%);

        .top-actions {
          display: flex;
          justify-content: center;
          gap: 8px;

          .action-btn {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgb(255 255 255 / 90%);
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              background: white;
              transform: scale(1.1);
            }

            &.active {
              background: #ffc107;
              color: white;
            }

            .el-icon {
              font-size: 16px;
            }
          }
        }

        .bottom-actions {
          display: flex;
          justify-content: center;
          gap: 8px;

          .el-button {
            flex: 1;
          }
        }
      }
    }

    .empty-placeholder {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      color: #c0c4cc;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #e8eaed;
        color: #909399;
      }

      .placeholder-text {
        margin-top: 8px;
        font-size: 12px;
      }
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
