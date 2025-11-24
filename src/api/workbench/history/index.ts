import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { AssetListRequest, ProjectHistoryDetailVo } from './types';

/**
 * 查询资产列表
 * @param params 查询参数
 * @returns 项目历史明细列表（分页）
 */
export const getAssetList = (params: AssetListRequest): AxiosPromise<ProjectHistoryDetailVo[]> => {
  return request({
    url: '/hivision/story/history-detail/asset-list',
    method: 'get',
    params
  });
};
