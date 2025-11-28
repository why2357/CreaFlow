<template>
  <el-dropdown trigger="click" placement="bottom-end" :disabled="isDisabled" @command="handleExportCommand">
    <div class="export-button" :class="{ disabled: isDisabled }">
      <span class="export-text">导出</span>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="images">
          <svg-icon icon-class="export-img" class="menu-icon" />
          <span>导出图片</span>
        </el-dropdown-item>
        <el-dropdown-item command="excel">
          <svg-icon icon-class="export-excel" class="menu-icon" />
          <span>导出图片表单</span>
        </el-dropdown-item>
        <el-dropdown-item command="video-excel">
          <svg-icon icon-class="export-video" class="menu-icon" />
          <span>导出视频表单</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts" name="ExportDropdown">
  import { exportEpisodeExcel, exportEpisodeImages, exportEpisodeVideoExcel } from '@/api/workbench/episode';
  import { useProjectStore } from '@/store/modules/project';
  import { ElLoading, ElMessage } from 'element-plus';
  import { computed } from 'vue';

  const projectStore = useProjectStore();

  // 计算是否禁用导出按钮
  const isDisabled = computed(() => {
    return !projectStore.currentEpisodeId;
  });

  /**
   * 处理导出命令
   * @param command 导出命令类型: images | excel | video-excel
   */
  const handleExportCommand = async (command: string) => {
    const currentEpisodeId = projectStore.currentEpisodeId;

    if (!currentEpisodeId) {
      ElMessage.warning('请先选择要导出的剧集');
      return;
    }

    const loading = ElLoading.service({
      lock: true,
      text: '正在导出，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    try {
      let blob: Blob;
      let fileName: string;
      // 从 episodeInfoList 中查找当前剧集的名称
      const currentEpisodeInfo = projectStore.episodeInfoList.find((ep) => ep.episodeId === Number(currentEpisodeId));
      const episodeName = currentEpisodeInfo?.episodeName || projectStore.currentEpisode?.name || '剧集';
      const projectName = projectStore.projectName || '项目';
      const episodeId = Number(currentEpisodeId);

      if (command === 'images') {
        // 导出图片压缩包
        const response = await exportEpisodeImages(episodeId);
        blob = response as unknown as Blob;
        fileName = `${projectName}_${episodeName}.zip`;
      } else if (command === 'excel') {
        // 导出图片Excel表单
        const response = await exportEpisodeExcel(episodeId);
        blob = response as unknown as Blob;
        fileName = `${projectName}_${episodeName}_图片表单.xlsx`;
      } else if (command === 'video-excel') {
        // 导出视频Excel表单
        const response = await exportEpisodeVideoExcel(episodeId);
        blob = response as unknown as Blob;
        fileName = `${projectName}_${episodeName}_视频表单.xlsx`;
      } else {
        ElMessage.info('该功能暂未开放');
        loading.close();
        return;
      }

      // 创建下载链接并触发下载
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      ElMessage.success('导出成功');
    } catch (error: any) {
      console.error('导出失败:', error);
    } finally {
      loading.close();
    }
  };
</script>

<style scoped lang="scss">
  .export-button {
    display: flex;
    gap: 6px;
    height: 32px;
    width: 80px;
    padding: 8px 28px;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    background: #5252ff;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #6b6bff;
      box-shadow: 0 4px 12px rgba(82, 82, 255, 0.3);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &.disabled {
      background: #c0c4cc;
      cursor: not-allowed;
      opacity: 0.6;

      &:hover {
        background: #c0c4cc;
        box-shadow: none;
        transform: none;
      }

      &:active {
        transform: none;
      }
    }

    .export-icon {
      width: 14px;
      height: 14px;
      color: #fff;
    }

    .export-text {
      white-space: nowrap;
    }
  }
</style>
