import request from '@/utils/request';
import type { HivisionProjectModelVo, ModelConfigQueryParams, ModelConfigUpdateParams } from './types';

/**
 * 查询项目模型列表
 */
export function getModelConfigList(params: ModelConfigQueryParams) {
  return request<HivisionProjectModelVo[]>({
    url: '/hivision/model/config/list',
    method: 'get',
    params
  });
}

/**
 * 更新项目模型
 */
export function updateModelConfig(data: ModelConfigUpdateParams) {
  return request({
    url: '/hivision/model/config/update',
    method: 'post',
    data
  });
}
