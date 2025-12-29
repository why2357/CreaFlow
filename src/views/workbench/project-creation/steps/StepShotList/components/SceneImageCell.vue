<template>
  <div
    class="scene-image-wrapper"
    :class="{ 'drag-over': isDragOver }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <!-- 悬浮操作层 -->
    <div class="hover-overlay" @click.self="handleOverlayClick">
      <!-- 顶部操作按钮 -->
      <div class="top-actions">
        <el-tooltip content="本地上传" placement="top">
          <div
            class="action-btn"
            :class="{ disabled: isOperationDisabled }"
            @click="!isOperationDisabled && handleUpload()"
          >
            <svg-icon icon-class="fy-tihuan" />
          </div>
        </el-tooltip>

        <el-tooltip content="查看历史" placement="top">
          <div
            class="action-btn"
            :class="{ disabled: isOperationDisabled || isHistoryDisabled }"
            @click="!isOperationDisabled && !isHistoryDisabled && handleShowHistory()"
          >
            <svg-icon icon-class="fy-lishi" />
          </div>
        </el-tooltip>

        <el-tooltip :content="hasMultipleImages ? '多张图片时不支持下载' : '下载图片'" placement="top">
          <div
            class="action-btn"
            :class="{ disabled: isOperationDisabled || !canDownload || isDownloadDisabled }"
            @click="!isOperationDisabled && canDownload && !isDownloadDisabled && handleDownload()"
          >
            <svg-icon icon-class="fy-download" />
          </div>
        </el-tooltip>

        <el-tooltip :content="hasMultipleImages ? '多张图片时不支持裁剪' : '裁剪图片'" placement="top">
          <div
            class="action-btn"
            :class="{ disabled: isOperationDisabled || !canCrop || isCropDisabled }"
            @click="!isOperationDisabled && canCrop && !isCropDisabled && handleCrop()"
          >
            <svg-icon icon-class="fy-clip" />
          </div>
        </el-tooltip>

        <el-tooltip
          :content="hasMultipleImages ? '多张图片时不支持收藏' : isCollect ? '取消收藏' : '收藏'"
          placement="top"
        >
          <div
            class="action-btn"
            :class="{ active: isCollect, disabled: isOperationDisabled || !canFavorite || isFavoriteDisabled }"
            @click="!isOperationDisabled && canFavorite && !isFavoriteDisabled && handleToggleFavorite()"
          >
            <svg-icon v-if="isCollect" icon-class="fy-starfilled" style="width: 12px; height: 12px; color: #ff7d00" />
            <svg-icon v-else icon-class="fy-star" style="width: 16px; height: 16px" />
          </div>
        </el-tooltip>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <el-button
          class="edit-btn"
          :disabled="hasMultipleImages || isOperationDisabled || isEditDisabled"
          @click="handleEdit"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <div class="gen-btn-wrapper">
          <el-button
            class="gen-btn"
            :disabled="isOperationDisabled"
            @click="!isOperationDisabled && handleRegenerate()"
          >
            <svg-icon icon-class="fy-shandian" class="el-icon" />
            {{ modelPoints }} 生成
          </el-button>
        </div>
      </div>
    </div>
    <div
      class="scene-image-cell"
      :data-aspect-ratio="aspectRatio"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- 排队中状态 (taskStatus === 0 或 loading) -->
      <div v-if="taskStatus === 0" class="queue-overlay">
        <svg-icon icon-class="fy-gen-waiting" class="queue-icon" />
        <p class="queue-text">排队中...</p>
      </div>

      <!-- 执行中状态 (taskStatus === 1) -->
      <div v-else-if="taskStatus === 1" class="loading-overlay">
        <div class="loading-animation-wrapper">
          <Vue3Lottie :animation-data="generatingAnimation" :height="80" :width="80" class="loading-icon" />
        </div>
        <p class="loading-text">生成中，请稍等...</p>
      </div>

      <!-- 执行失败状态 (taskStatus === 3 且没有历史图片) -->
      <div
        v-else-if="taskStatus === 3 && (!materialInfoVoList || materialInfoVoList.length === 0)"
        class="failure-container"
      >
        <div class="failure-icon">
          <svg-icon class="error-icon" icon-class="fy-gen-failed" />
        </div>
        <p class="failure-text">生成失败</p>
      </div>

      <!-- 执行失败但有历史图片：显示图片+失败提示层 (taskStatus === 3 且有图片) -->
      <div
        v-else-if="taskStatus === 3 && materialInfoVoList && materialInfoVoList.length > 0"
        class="failure-with-image"
      >
        <!-- 背景图片 -->
        <div class="image-grid-container" :class="{ 'single-image': materialInfoVoList.length === 1 }">
          <div v-for="(item, index) in materialInfoVoList.slice(0, 4)" :key="index" class="grid-item">
            <el-image
              :src="item.previewOssUrl || item.originOssUrl"
              :fit="fit"
              class="grid-image"
              :preview-src-list="materialInfoVoList.map((i) => i.originOssUrl || i.previewOssUrl || '')"
              :initial-index="index"
              :preview-teleported="true"
              hide-on-click-modal
            />
          </div>
        </div>
        <!-- 失败提示遮罩 -->
        <div class="failure-overlay">
          <div class="failure-badge">
            <span class="badge-text">生成失败</span>
          </div>
        </div>
      </div>

      <!-- 有图片数据：显示图片 (materialInfoVoList有数据，不管taskStatus是什么值) -->
      <div
        v-else-if="materialInfoVoList && materialInfoVoList.length > 0"
        class="image-grid-container"
        :class="{ 'single-image': materialInfoVoList.length === 1 }"
      >
        <div v-for="(item, index) in materialInfoVoList.slice(0, 4)" :key="index" class="grid-item">
          <el-image
            :src="item.previewOssUrl || item.originOssUrl"
            :fit="fit"
            class="grid-image"
            :preview-src-list="materialInfoVoList.map((i) => i.originOssUrl || i.previewOssUrl || '')"
            :initial-index="index"
            :preview-teleported="true"
            hide-on-click-modal
          />
        </div>
        <!-- 收藏标记 -->
        <div v-if="isCollect" class="favorite-badge">
          <svg-icon icon-class="fy-starfilled" />
        </div>
      </div>

      <!-- 其他状态/空状态：没有图片数据 -->
      <div v-else class="placeholder-container">
        <img
          style="width: 120px; height: 120px"
          src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/280aecd608a94a8d.png"
          alt="暂无图片"
          class="placeholder-image"
        />
      </div>

      <!-- 隐藏的文件上传 -->
      <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="handleFileSelected" />
    </div>

    <!-- 历史记录弹窗 - 使用 teleport 传送到 body -->
    <teleport to="body">
      <SceneImageHistoryDialog v-model="historyDialogVisible" :basic-id="basicId" @refresh="handleHistoryRefresh" />
    </teleport>

    <!-- 图片编辑弹窗 - 使用 teleport 传送到 body -->
    <teleport to="body">
      <SceneImageEditDialog
        v-model="editDialogVisible"
        :basic-id="basicId"
        :main-image-url="currentImageUrl"
        @success="handleEditSuccess"
      />
    </teleport>
  </div>
</template>

<script setup lang="ts">
  import { cancelCollectHistoryDetail, collectHistoryDetail, replaceSceneImage } from '@/api/workbench/episode';
  import generatingAnimation from '@/assets/lottie/video-generating.json';
  import { sizeToValue } from '@/utils/projectUtils';
  import { uploadFile } from '@/utils/uploadFile';
  import { Edit } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref } from 'vue';
  import { Vue3Lottie } from 'vue3-lottie';
  import SceneImageEditDialog from './SceneImageEditDialog.vue';
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
    historyDetailId?: number; // 历史明细ID（用于判断是否本地上传）
    isCollect?: boolean;
    loading?: boolean;
    taskStatus?: number; // 0-待执行 1-执行中 2-执行成功 3-执行失败
    modelPoints?: number; // 当前模型的点数
  }

  const props = withDefaults(defineProps<Props>(), {
    imageUrl: '',
    materialInfoVoList: () => [],
    aspectRatio: '16:9',
    isCollect: false,
    loading: false,
    taskStatus: 0,
    modelPoints: 0
  });

  const emit = defineEmits<{
    (e: 'upload', file: File): void;
    (e: 'showHistory'): void;
    (e: 'download'): void;
    (e: 'crop', imageUrl: string): void;
    (e: 'cropComplete', ossId: number): void;
    (e: 'toggleFavorite', isCollect: boolean): void;
    (e: 'regenerate'): void;
    (e: 'refresh'): void;
  }>();

  // 状态
  const isHovered = ref(false);
  const fileInputRef = ref<HTMLInputElement>();
  const historyDialogVisible = ref(false);
  const editDialogVisible = ref(false);
  const isDragOver = ref(false);
  const dragCounter = ref(0); // 拖拽计数器，解决子元素触发dragleave的问题

  // 计算图片填充方式 - 始终使用cover填满容器
  const fit = computed(() => {
    return 'cover' as const;
  });

  // 是否有多张图片
  const hasMultipleImages = computed(() => {
    return props.materialInfoVoList.length > 1;
  });

  // taskStatus === 0 或 1 时，所有操作都禁用
  const isOperationDisabled = computed(() => {
    return props.taskStatus === 0 || props.taskStatus === 1;
  });

  // 判断是否没有历史图片
  const hasNoImages = computed(() => {
    return !props.materialInfoVoList || props.materialInfoVoList.length === 0;
  });

  // 没有图片时，查看历史、下载、剪裁、收藏、编辑操作禁用
  // 只要有图片就可以查看历史，即使生成失败也可以
  // 或者生成失败时(taskStatus === 3)，即使没有图片也可以查看历史
  const isHistoryDisabled = computed(() => {
    // 如果是生成失败状态，允许查看历史
    if (props.taskStatus === 3) {
      return false;
    }
    return hasNoImages.value;
  });

  const isDownloadDisabled = computed(() => {
    return hasNoImages.value;
  });

  const isCropDisabled = computed(() => {
    return hasNoImages.value;
  });

  const isFavoriteDisabled = computed(() => {
    return hasNoImages.value;
  });

  const isEditDisabled = computed(() => {
    return hasNoImages.value;
  });

  // 收藏功能是否可用（只在多张图片时不能收藏）
  const canFavorite = computed(() => {
    return !hasMultipleImages.value;
  });

  // 下载功能是否可用（多张图片时不能下载）
  const canDownload = computed(() => {
    return !hasMultipleImages.value;
  });

  // 裁剪功能是否可用（多张图片时不能裁剪）
  const canCrop = computed(() => {
    return !hasMultipleImages.value;
  });

  // 当前显示的图片URL（用于编辑弹窗，使用原图以保证质量）
  const currentImageUrl = computed(() => {
    if (props.materialInfoVoList.length > 0) {
      return props.materialInfoVoList[0].originOssUrl || props.materialInfoVoList[0].previewOssUrl || '';
    }
    return props.imageUrl;
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

    // 验证文件大小（限制为25MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过25MB');
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
          ossId: Number(uploadRes.ossId),
          operationType: 3
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

  // 获取期望的宽高比（使用统一的工具函数）
  const getExpectedRatio = (ratio: string): number => {
    return sizeToValue(ratio);
  };

  // ==================== 拖拽上传功能 ====================

  // 拖拽进入
  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // 计数器加1
    dragCounter.value++;

    // 只在非禁用状态下显示拖拽提示
    if (!isOperationDisabled.value) {
      isDragOver.value = true;
    }
  };

  // 拖拽经过
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // 拖拽离开
  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // 计数器减1
    dragCounter.value--;

    // 只有当计数器为0时，才真正离开
    if (dragCounter.value === 0) {
      isDragOver.value = false;
    }
  };

  // 放置文件
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    isDragOver.value = false;
    dragCounter.value = 0; // 重置计数器

    // 检查是否禁用
    if (isOperationDisabled.value) {
      ElMessage.warning('当前状态不支持上传');
      return;
    }

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

    // 如果拖拽了多张图片，提示用户
    // if (imageFiles.length > 1) {
    //   ElMessage.info(`检测到${imageFiles.length}张图片，已自动选择第一张`);
    // }

    // 验证文件大小（限制为25MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过25MB');
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
          ossId: Number(uploadRes.ossId),
          operationType: 3
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
    }
  };

  // 查看历史
  const handleShowHistory = () => {
    // 当taskStatus === 2时打开历史弹窗
    // if (props.taskStatus === 2 || props.taskStatus === 4) {
    historyDialogVisible.value = true;
    // }
  };

  // 点击遮罩层空白区域打开历史记录
  const handleOverlayClick = () => {
    // 只要有图片数据，就打开查看历史图片的弹窗
    if (!hasNoImages.value) {
      historyDialogVisible.value = true;
    }
  };

  // 历史弹窗刷新后的回调
  const handleHistoryRefresh = () => {
    emit('refresh');
  };

  // 下载图片
  const handleDownload = async () => {
    // 获取当前显示的图片URL
    const imageUrl =
      props.materialInfoVoList.length > 0
        ? props.materialInfoVoList[0].originOssUrl || props.materialInfoVoList[0].previewOssUrl
        : props.imageUrl;

    if (!imageUrl) {
      ElMessage.warning('暂无图片可下载');
      return;
    }

    try {
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a');
      link.style.display = 'none';

      // 使用 fetch 获取图片数据
      const response = await fetch(imageUrl, {
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 从 URL 中提取文件名，或使用默认名称
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1] || `scene-image-${props.shotId}.jpg`;

      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      ElMessage.success('下载成功');
    } catch (error) {
      console.error('下载图片失败:', error);
      // 如果 fetch 失败（可能是跨域问题），尝试直接打开链接
      try {
        window.open(imageUrl, '_blank');
        ElMessage.info('已在新标签页打开图片，请手动保存');
      } catch {
        ElMessage.error('下载失败，请稍后重试');
      }
    }
  };

  // 裁剪图片
  const handleCrop = () => {
    // 获取原图URL（裁剪必须使用原图以保证质量）
    const imageUrl = currentImageUrl.value;

    if (!imageUrl) {
      ElMessage.warning('暂无图片可裁剪');
      return;
    }
    emit('crop', imageUrl);
  };

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!props.historyDetailId) {
      return;
    }

    try {
      if (props.isCollect) {
        // 取消收藏
        await cancelCollectHistoryDetail({ historyDetailId: props.historyDetailId });
        ElMessage.success('取消收藏成功');
        // 触发状态更新,传递新的收藏状态
        emit('toggleFavorite', false);
      } else {
        // 收藏
        await collectHistoryDetail({ historyDetailId: props.historyDetailId });
        ElMessage.success('收藏成功');
        // 触发状态更新,传递新的收藏状态
        emit('toggleFavorite', true);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      ElMessage.error('操作失败,请重试');
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    emit('regenerate');
  };

  // 编辑图片
  const handleEdit = () => {
    if (hasMultipleImages.value) {
      ElMessage.warning('多张图片时不支持编辑');
      return;
    }

    // if (props.taskStatus !== 2) {
    //   ElMessage.warning('请先生成图片');
    //   return;
    // }

    editDialogVisible.value = true;
  };

  // 编辑成功回调
  const handleEditSuccess = () => {
    emit('refresh');
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
  // 最外层容器，占满整个单元格
  .scene-image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;

    // 拖拽悬停状态
    &.drag-over {
      background: linear-gradient(135deg, rgba(82, 82, 255, 0.1) 0%, rgba(190, 117, 254, 0.1) 100%);
      border: 2px dashed #5252ff;
      box-shadow: inset 0 0 20px rgba(82, 82, 255, 0.15);

      &::after {
        content: '释放以上传图片';
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
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%);
    pointer-events: auto; // 允许点击触发历史记录弹窗
    cursor: pointer;

    .top-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      pointer-events: auto; // 恢复按钮区域的交互

      .action-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: #f7f8fa;
        cursor: pointer;
        transition: all 0.3s;
        pointer-events: auto; // 确保按钮可点击

        &:hover {
          background: white;
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }

        &.active {
          // background: #ffc107;
          color: white;

          &:active {
            transform: scale(0.95);
          }
        }

        &.disabled {
          // opacity: 0.4;
          color: #c9cdd4;
          cursor: not-allowed;

          &:hover {
            // background: rgb(255 255 255 / 90%);
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
      pointer-events: auto; // 恢复按钮区域的交互

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
        pointer-events: auto; // 确保按钮可点击

        &:active {
          transform: scale(0.95);
        }

        &.is-disabled {
          // opacity: 0.4;
          cursor: not-allowed;
          color: #c9cdd4;

          &:hover {
            color: #c9cdd4;
            transform: none;
          }

          &:active {
            transform: none;
          }
        }
      }
      .gen-btn-wrapper {
        position: relative;
        display: flex;
        align-items: center;

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
          pointer-events: auto; // 确保按钮可点击

          &:active {
            transform: scale(0.95);
          }

          &.is-disabled {
            opacity: 0.8;
            cursor: not-allowed;

            &:hover {
              transform: none;
            }

            &:active {
              transform: none;
            }
          }
        }
      }
    }
  }
  .scene-image-cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%; // 填满父容器高度
    overflow: hidden;
    // background: #f5f7fa;

    // 根据宽高比设置宽度,高度由父容器决定(190px)
    // 竖版比例固定宽度为260px,高度自适应
    &[data-aspect-ratio='16:9'] {
      width: 338px; // 190 * (16/9) ≈ 338
    }
    &[data-aspect-ratio='9:16'] {
      width: 260px; // 竖版固定宽度
      min-height: 462px; // 260 * (16/9) ≈ 462px，保持最小高度
      height: auto; // 高度自适应
    }
    &[data-aspect-ratio='1:1'] {
      width: 260px; // 1:1 固定宽度
      min-height: 260px; // 1:1 保持正方形
      height: auto; // 高度自适应
    }
    &[data-aspect-ratio='4:3'] {
      width: 253px; // 190 * (4/3) ≈ 253
    }
    &[data-aspect-ratio='3:4'] {
      width: 260px; // 竖版固定宽度
      min-height: 347px; // 260 * (4/3) ≈ 347px，保持最小高度
      height: auto; // 高度自适应
    }

    // 排队中状态样式
    .queue-overlay {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      .queue-icon {
        width: 60px;
        height: 60px;
      }

      .queue-text {
        margin-top: 12px;
        color: #4e5969;
        font-size: 13px;
        font-weight: 400;
      }
    }

    // 生成中状态样式
    .loading-overlay {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      // background: linear-gradient(180deg, #f0ebff 0%, #fef5ff 100%);
      .loading-animation-wrapper {
        animation: fadeInScale 0.4s ease-out;
      }
      .loading-icon {
        width: 80px;
        height: 80px;
      }

      .loading-text {
        margin-top: 12px;
        color: #4e5969;
        font-size: 13px;
        font-weight: 400;
      }
    }

    // 旋转动画
    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
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

        .grid-item {
          .grid-image {
            object-fit: cover; // 单张图片时使用cover填满
          }
        }
      }

      .grid-item {
        width: 100%;
        height: 100%;
        overflow: hidden;

        .grid-image {
          width: 100%;
          height: 100%;
          object-fit: cover; // 确保图片填满容器
          cursor: pointer;
        }
      }

      .favorite-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: rgb(255 255 255 / 90%);
        box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
        font-size: 14px;

        .svg-icon {
          width: 12px;
          height: 12px;
          color: #ff7d00;
        }
      }
    }

    .placeholder-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      // background: #f5f7fa;

      .placeholder-image {
        object-fit: contain;
        opacity: 0.5;
      }
    }

    // 首次失败容器
    .failure-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      gap: 12px;

      .failure-icon {
        display: flex;
        justify-content: center;
        align-items: center;

        .error-icon {
          width: 80px;
          height: 80px;
          opacity: 0.8;
        }
      }

      .failure-text {
        margin: 0;
        color: #f53f3f;
        font-size: 13px;
        font-weight: 500;
      }
    }

    // 再次失败：有图片的失败状态
    .failure-with-image {
      position: relative;
      width: 100%;
      height: 100%;

      .image-grid-container {
        width: 100%;
        height: 100%;
        filter: brightness(0.8);
      }

      .failure-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgb(0 0 0 / 30%);
        pointer-events: none;

        .failure-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 67px;
          background: linear-gradient(0deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%);
          backdrop-filter: blur(4.75px);

          .badge-icon {
            font-size: 16px;
            color: #fff;
          }

          .badge-text {
            color: #f53f3f;
            font-size: 13px;
            font-weight: 500;
          }
        }
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
