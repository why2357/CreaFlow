/**
 * 参考图/提及功能状态管理
 */
import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';
import type { ReferenceImage } from '@/types/mention';

interface ReferenceState {
  /** 参考图列表 */
  images: ReferenceImage[];
  /** 当前最大索引 (用于生成标签: 图片1、图片2...) */
  maxIndex: number;
}

export const useReferenceStore = defineStore('reference', {
  state: (): ReferenceState => ({
    images: [],
    maxIndex: 0
  }),

  getters: {
    /**
     * 获取参考图数量
     */
    imageCount: (state) => state.images.length,

    /**
     * 获取所有已上传成功的图片
     */
    uploadedImages: (state) => state.images.filter((img) => img.uploadStatus === 'success'),

    /**
     * 是否有参考图
     */
    hasImages: (state) => state.images.length > 0
  },

  actions: {
    /**
     * 添加参考图
     * @param file 文件对象
     * @returns 添加的参考图数据
     */
    async addImage(file: File): Promise<ReferenceImage> {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('请选择图片文件');
        throw new Error('Invalid file type');
      }

      // 验证文件大小 (限制 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.warning('图片大小不能超过 10MB');
        throw new Error('File size exceeded');
      }

      // 创建本地预览 URL
      const localUrl = URL.createObjectURL(file);

      // 生成唯一 ID
      const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 生成标签
      this.maxIndex++;
      const label = `图片${this.maxIndex}`;

      // 创建参考图对象
      const referenceImage: ReferenceImage = {
        id,
        src: localUrl,
        thumbnail: localUrl,
        label,
        file,
        uploadStatus: 'pending',
        uploadProgress: 0
      };

      // 添加到列表
      this.images.push(referenceImage);

      return referenceImage;
    },

    /**
     * 删除参考图
     * @param id 参考图ID
     */
    removeImage(id: string): void {
      const index = this.images.findIndex((img) => img.id === id);
      if (index !== -1) {
        const image = this.images[index];

        // 释放 blob URL
        if (image.src.startsWith('blob:')) {
          URL.revokeObjectURL(image.src);
        }

        // 从列表中移除
        this.images.splice(index, 1);

        ElMessage.success(`已删除${image.label}`);
      }
    },

    /**
     * 获取参考图
     * @param id 参考图ID
     * @returns 参考图数据
     */
    getImage(id: string): ReferenceImage | undefined {
      return this.images.find((img) => img.id === id);
    },

    /**
     * 清空所有参考图
     */
    clearAll(): void {
      // 释放所有 blob URL
      this.images.forEach((image) => {
        if (image.src.startsWith('blob:')) {
          URL.revokeObjectURL(image.src);
        }
      });

      this.images = [];
      this.maxIndex = 0;
    },

    /**
     * 更新上传状态
     * @param id 参考图ID
     * @param status 上传状态
     * @param progress 上传进度
     */
    updateUploadStatus(id: string, status: ReferenceImage['uploadStatus'], progress?: number): void {
      const image = this.getImage(id);
      if (image) {
        image.uploadStatus = status;
        if (progress !== undefined) {
          image.uploadProgress = progress;
        }
      }
    },

    /**
     * 更新服务器返回的图片ID
     * @param id 本地参考图ID
     * @param serverId 服务器返回的图片ID
     */
    updateServerId(id: string, serverId: string): void {
      const image = this.getImage(id);
      if (image) {
        image.serverId = serverId;
      }
    },

    /**
     * 更新图片URL (上传成功后替换为服务器URL)
     * @param id 参考图ID
     * @param url 新的图片URL
     */
    updateImageUrl(id: string, url: string): void {
      const image = this.getImage(id);
      if (image) {
        // 释放旧的 blob URL
        if (image.src.startsWith('blob:')) {
          URL.revokeObjectURL(image.src);
        }

        image.src = url;
        image.thumbnail = url;
      }
    }
  }
});
