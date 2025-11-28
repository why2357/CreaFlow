import { UpListItem, UploadState, UpStatus } from '@/api/tool/upload/type';
import { uploadFile } from '@/utils/uploadFile';
import { defineStore } from 'pinia';

export const useUploadStore = defineStore('upload', {
  state: (): UploadState => ({
    uploading: false,
    upList: []
  }),

  actions: {
    // 用于设置上传状态
    setUploading(loading: boolean) {
      this.uploading = loading;
    },

    // 用于设置上传列表
    setUpList(uploadData: UpListItem[]) {
      this.upList = uploadData;
    },

    // 更新上传状态
    updateUploadStatus(index: number, status: UpStatus) {
      this.upList[index].status = status;
    },

    // 更新上传进度
    updateUploadProgress(index: number, percent: number) {
      this.upList[index].percent = percent;
    },

    // 上传文件的逻辑
    async uploadFileFn({ file, index }: any) {
      const { name } = file;
      const suffix = name.indexOf('.') > -1 ? name.split('.').pop() : '';

      try {
        const res = await uploadFile(
          {
            id: index,
            fileSuffix: `.${suffix}`,
            originalFileName: name,
            fileType: '1',
            file,
            requiredTime: true,
            requiredMd5: true,
            resourceType: 2
          },
          (percent, loadedSize, id) => {
            this.updateUploadProgress(index, percent);
          }
        );
        this.updateUploadStatus(index, UpStatus.Success);
        return Promise.resolve(res);
      } catch (err) {
        this.updateUploadStatus(index, UpStatus.Fail);
        return Promise.reject(err);
      }
    }
  }
});
