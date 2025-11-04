import request from '@/utils/request';
import axios, { AxiosPromise } from 'axios';
import { PreSignUrlReq, PreSignUrlRes, ReportReq, ReportRes, UploadByUrlReq } from './type';

/**
 * 获取预签名Url
 */
export const getPreSignUrl = (data: PreSignUrlReq): AxiosPromise<PreSignUrlRes> => {
  return request({
    url: '/hivision/system/oss/generate-presigned-url',
    method: 'post',
    data
  });
};

/**
 * 通过获取到的url，上传文件
 */
export const uploadByUrl = (
  data: UploadByUrlReq,
  callback?: (percent: number, loadedSize: number, id?: number | string) => void
): AxiosPromise<{}> => {
  return axios.put(data.uploadUrl, data.file, {
    headers: {
      'content-type': 'application/octet-stream'
    },
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      const size = (loaded / 1024).toFixed(2); // 计算已上传的大小（kb）
      const percentData = total ? Math.floor((loaded * 100) / total) : 0;
      callback?.(percentData, Number(size), data.id);
    }
  });
};

/**
 * 通过获取url文件上传成功后，上报信息
 * @param query
 * @returns {*}
 * permission
 */
export const reportInfo = (data: Partial<ReportReq>): AxiosPromise<ReportRes> => {
  return request({
    url: '/hivision/system/oss/presigned-result-upload',
    method: 'post',
    data
  });
};
