import request from '@/utils/request';
import { AxiosPromise } from 'axios';

/**
 * 瀑布流列表请求参数
 */
export interface WaterfallListRequest {
  /** 项目id */
  episodeId?: number;
  /** 是否收藏 */
  isCollect?: boolean;
  [property: string]: any;
}

/**
 * 瀑布流列表项
 */
export interface WaterfallItem {
  createBy: number;
  createTime: string;
  delFlag: number;
  dialogues: string;
  endFrameMaterialId: null;
  envMaterialId: null;
  envType: null;
  episodeId: number;
  historyImgs: HistoryImg[];
  id: number;
  imgStatus: number;
  imgTaskId: number;
  orderNo: number;
  projectId: number;
  sceneDesc: string;
  sceneHint: string;
  selectImg: SelectImg;
  selectImgMaterialId: number;
  selectVideoMaterialId: null;
  status: number;
  tenantId: string;
  updateBy: number;
  updateTime: string;
  userId: number;
  videoPrompt: null;
  videoStatus: number;
  videoTaskId: null;
  [property: string]: any;
}

/**
 * 历史图片信息
 */
export interface HistoryImg {
  basicId: number;
  episodeId: number;
  historyId: number;
  id: number;
  imgMaterial: ImgMaterial;
  isCollect: boolean;
  materialId: number;
  originOssUrl: null;
  previewOssUrl: null;
  projectId: number;
  sceneType: number;
  selectStatus: number;
  status: number;
  userId: number;
  [property: string]: any;
}

/**
 * 图片素材信息
 */
export interface ImgMaterial {
  id: number;
  originOssId: null;
  originOssUrl: string;
  previewOssId: null;
  previewOssUrl: string;
  projectId: number;
  status: number;
  userId: number;
  [property: string]: any;
}

/**
 * 选中的图片信息
 */
export interface SelectImg {
  id: number;
  originOssId: number | null;
  originOssUrl: string;
  previewOssId: number | null;
  previewOssUrl: string;
  projectId: number;
  status: number;
  userId: number;
  [property: string]: any;
}

/**
 * 获取瀑布流列表
 * @param params 查询参数
 */
export const getWaterfallList = (params: WaterfallListRequest): AxiosPromise<WaterfallItem[]> => {
  return request({
    url: '/hivision/story/scene/waterfall-list',
    method: 'get',
    params
  });
};
