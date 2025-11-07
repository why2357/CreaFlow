<template>
  <div>
    <!-- 悬浮操作层 -->
    <div class="hover-overlay" @click.self="handleOverlayClick">
      <!-- 顶部操作按钮 -->
      <div class="top-actions">
        <el-tooltip content="本地上传" placement="top">
          <div class="action-btn" @click="handleUpload">
            <el-icon><Upload /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="查看历史" placement="top">
          <div
            class="action-btn"
            :class="{ disabled: taskStatus === 0 }"
            @click="taskStatus !== 0 && handleShowHistory()"
          >
            <el-icon><Clock /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="下载图片" placement="top">
          <div class="action-btn" :class="{ disabled: taskStatus === 0 }" @click="taskStatus !== 0 && handleDownload()">
            <el-icon><Download /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="裁剪图片" placement="top">
          <div class="action-btn" :class="{ disabled: taskStatus === 0 }" @click="taskStatus !== 0 && handleCrop()">
            <el-icon><Crop /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip
          :content="!canFavorite ? '本地上传图片不支持收藏' : isFavorite ? '取消收藏' : '收藏'"
          placement="top"
        >
          <div
            class="action-btn"
            :class="{ active: isFavorite, disabled: taskStatus === 0 || !canFavorite }"
            @click="taskStatus !== 0 && canFavorite && handleToggleFavorite()"
          >
            <el-icon v-if="isFavorite"><StarFilled /></el-icon>
            <el-icon v-else><Star /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <el-button class="edit-btn" disabled>
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button class="gen-btn" @click="handleRegenerate">
          <svg-icon icon-class="fy-shandian" class="el-icon" />
          生成
        </el-button>
      </div>
    </div>
    <div class="scene-image-cell" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
      <!-- 执行中状态 (taskStatus === 1 或 loading) -->
      <div v-if="taskStatus === 1 || loading" v-loading="true" class="loading-overlay">
        <p class="loading-text">生成中，请稍等...</p>
      </div>

      <!-- 执行成功状态 (taskStatus === 2 且有图片) -->
      <div
        v-else-if="taskStatus === 2 && materialInfoVoList && materialInfoVoList.length > 0"
        class="image-grid-container"
        :class="{ 'single-image': materialInfoVoList.length === 1 }"
      >
        <div v-for="(item, index) in materialInfoVoList.slice(0, 4)" :key="index" class="grid-item">
          <el-image
            :src="item.previewOssUrl || item.originOssUrl"
            :fit="fit"
            class="grid-image"
            :preview-src-list="materialInfoVoList.map((i) => i.previewOssUrl || i.originOssUrl || '')"
            :initial-index="index"
          />
        </div>

        <!-- 收藏标记 -->
        <div v-if="isFavorite" class="favorite-badge">
          <el-icon><StarFilled /></el-icon>
        </div>
      </div>

      <!-- 执行失败状态 (taskStatus === 3) -->
      <div v-else-if="taskStatus === 3" class="failure-container">
        <div class="failure-icon">
          <el-icon :size="48"><CircleClose /></el-icon>
        </div>
        <p class="failure-text">生成失败</p>
        <el-button type="primary" size="small" @click="handleRegenerate">
          <el-icon><Refresh /></el-icon>
          重新生成
        </el-button>
      </div>

      <!-- 待执行/空状态 (taskStatus === 0 或其他) -->
      <div v-else class="placeholder-container">
        <img src="../../../../../../assets/images/no-sence.png" alt="暂无图片" class="placeholder-image" />
      </div>

      <!-- 隐藏的文件上传 -->
      <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="handleFileSelected" />
    </div>

    <!-- 历史记录弹窗 - 使用 teleport 传送到 body -->
    <teleport to="body">
      <SceneImageHistoryDialog v-model="historyDialogVisible" :basic-id="basicId" @refresh="handleHistoryRefresh" />
    </teleport>
  </div>
</template>

<script setup lang="ts">
  import { replaceSceneImage } from '@/api/workbench/episode';
  import { uploadFile } from '@/utils/uploadFile';
  import { CircleClose, Clock, Crop, Download, Edit, Refresh, Star, StarFilled, Upload } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref } from 'vue';
  import SceneImageHistoryDialog from './SceneImageHistoryDialog.vue';

  interface MaterialInfoVo {
    id?: number;
    originOssId?: number;
    originOssUrl?: string;
    previewOssId?: number;
    previewOssUrl?: string;
    projectId?: number;
    status?: number;
    userId?: number;
    isCollect?: boolean; // 是否收藏
    historyId?: number; // 历史id
    historyDetailId?: number; // 历史明细id
  }

  interface Props {
    imageUrl?: string;
    materialInfoVoList?: MaterialInfoVo[]; // 所有生成的图片列表
    aspectRatio?: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
    shotId: string | number;
    basicId?: number; // 场景基础信息ID
    isFavorite?: boolean;
    loading?: boolean;
    taskStatus?: number; // 0-待执行 1-执行中 2-执行成功 3-执行失败
  }

  const props = withDefaults(defineProps<Props>(), {
    imageUrl: '',
    materialInfoVoList: () => [],
    aspectRatio: '16:9',
    isFavorite: false,
    loading: false,
    taskStatus: 0
  });

  const emit = defineEmits<{
    (e: 'upload', file: File): void;
    (e: 'showHistory'): void;
    (e: 'download'): void;
    (e: 'crop', imageUrl: string): void;
    (e: 'cropComplete', ossId: number): void;
    (e: 'toggleFavorite'): void;
    (e: 'regenerate'): void;
    (e: 'refresh'): void;
  }>();

  // 状态
  const isHovered = ref(false);
  const fileInputRef = ref<HTMLInputElement>();
  const historyDialogVisible = ref(false);

  // 计算图片填充方式
  const fit = computed(() => {
    // 使用 cover 让图片填满整个容器，可能会裁剪部分内容
    // 这样可以确保图片在格子中满格显示
    return 'cover';
  });

  // 判断是否是本地上传的图片（不能收藏）
  // 当只有一张图片且没有 historyDetailId 时，说明是本地上传或者裁剪的图片
  const isLocalUploadImage = computed(() => {
    return props.materialInfoVoList.length === 1 && !props.materialInfoVoList[0].historyDetailId;
  });

  // 收藏功能是否可用
  const canFavorite = computed(() => {
    return !isLocalUploadImage.value;
  });

  // 本地上传
  const handleUpload = () => {
    fileInputRef.value?.click();
  };

  // 文件选择
  const handleFileSelected = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件');
      target.value = '';
      return;
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过10MB');
      target.value = '';
      return;
    }

    try {
      // 验证图片比例
      const img = new Image();
      const reader = new FileReader();

      await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          img.src = e.target?.result as string;
          img.onload = () => {
            const imageRatio = img.width / img.height;
            const expectedRatio = getExpectedRatio(props.aspectRatio);

            // 允许5%的误差
            if (Math.abs(imageRatio - expectedRatio) / expectedRatio > 0.05) {
              ElMessage.warning(`请上传比例为 ${props.aspectRatio} 的图片`);
              reject(new Error('图片比例不符合要求'));
              return;
            }

            resolve(true);
          };
          img.onerror = () => reject(new Error('图片加载失败'));
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });

      // 如果有 basicId，直接上传并调用替换接口
      if (props.basicId) {
        ElMessage.info('正在上传图片...');

        // 获取文件后缀
        const fileSuffix = file.name.substring(file.name.lastIndexOf('.'));

        // 上传文件到 OSS
        const uploadRes = await uploadFile({
          file,
          fileSuffix,
          originalFileName: file.name,
          fileType: 'image',
          resourceType: 2, // 用户资源
          needSync: 0
        });

        // 调用替换场景图片接口
        await replaceSceneImage({
          basicId: props.basicId,
          ossId: Number(uploadRes.ossId)
        });

        ElMessage.success('上传成功');
        emit('refresh');
      } else {
        // 没有 basicId，使用原来的逻辑（兼容）
        emit('upload', file);
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      if (error instanceof Error && error.message !== '图片比例不符合要求') {
        ElMessage.error('上传图片失败');
      }
    } finally {
      // 清空input，允许重复选择同一文件
      target.value = '';
    }
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
    // 当taskStatus === 2时打开历史弹窗
    if (props.taskStatus === 2) {
      historyDialogVisible.value = true;
    } else {
      emit('showHistory');
    }
  };

  // 点击遮罩层空白区域（只在taskStatus === 2时）
  const handleOverlayClick = () => {
    if (props.taskStatus === 2) {
      historyDialogVisible.value = true;
    }
  };

  // 历史弹窗刷新后的回调
  const handleHistoryRefresh = () => {
    emit('refresh');
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
    // 获取当前显示的图片URL
    const imageUrl =
      props.materialInfoVoList.length > 0
        ? props.materialInfoVoList[0].previewOssUrl || props.materialInfoVoList[0].originOssUrl
        : props.imageUrl;

    if (!imageUrl) {
      ElMessage.warning('暂无图片可裁剪');
      return;
    }
    emit('crop', imageUrl);
  };

  // 收藏/取消收藏
  const handleToggleFavorite = () => {
    emit('toggleFavorite');
  };

  // 重新生成
  const handleRegenerate = () => {
    emit('regenerate');
  };

  // 处理裁剪完成后的替换
  const handleCropComplete = async (ossId: number) => {
    if (!props.basicId) {
      ElMessage.error('基础镜头ID不存在');
      return;
    }

    try {
      await replaceSceneImage({
        basicId: props.basicId,
        ossId
      });
      ElMessage.success('替换成功');
      emit('cropComplete', ossId);
      emit('refresh');
    } catch (error) {
      console.error('替换图片失败:', error);
      ElMessage.error('替换图片失败');
    }
  };

  // 暴露方法给父组件调用
  defineExpose({
    handleCropComplete
  });
</script>

<style scoped lang="scss">
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

        &:active {
          transform: scale(0.95);
        }

        &.active {
          background: #ffc107;
          color: white;

          &:active {
            transform: scale(0.95);
          }
        }

        &.disabled {
          opacity: 0.4;
          cursor: not-allowed;

          &:hover {
            background: rgb(255 255 255 / 90%);
            transform: none;
          }

          &:active {
            transform: none;
          }
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
      .edit-btn {
        display: flex;
        width: 84px;
        height: 24px;
        justify-content: center;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
        border-radius: 6px;
        border: none;
        outline: none;
        background: #f7f8fa;
        color: #4e5969;
        text-align: center;
        font-size: 12px;
        transition: all 0.3s;
        cursor: pointer;

        &:active {
          transform: scale(0.95);
        }
      }
      .gen-btn {
        display: flex;
        width: 84px;
        height: 24px;
        justify-content: center;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        border-radius: 6px;
        border: none;
        outline: none;
        background: linear-gradient(0deg, #6157ff 0%, #be75fe 100%);
        color: #fff;
        font-size: 12px;
        transition: all 0.3s;
        cursor: pointer;

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
  .scene-image-cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%; // 使用100%高度以适配父容器
    overflow: hidden;
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
    }

    .image-grid-container {
      position: relative;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 2px;
      width: 100%;
      height: 100%;

      // 单张图片时铺满整个格子
      &.single-image {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        gap: 0;
      }

      .grid-item {
        width: 100%;
        height: 100%;
        overflow: hidden;

        .grid-image {
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
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
    }

    .placeholder-container {
      position: relative;
      width: 100%;
      height: 100%;

      .placeholder-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .failure-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      gap: 8px;

      .failure-icon {
        color: #f56c6c;
        opacity: 0.6;
      }

      .failure-text {
        margin: 0;
        color: #f56c6c;
        font-size: 14px;
        font-weight: 500;
      }

      .el-button {
        margin-top: 4px;
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
