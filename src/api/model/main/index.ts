import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { HivisionProjectModelMainVo, ModelMainQueryParams, ModelMainUpdateParams } from './types';

/**
 * 查询项目模型主表列表
 */
export function getModelMainList(params: ModelMainQueryParams): AxiosPromise<HivisionProjectModelMainVo[]> {
  return request({
    url: '/hivision/model/main/list',
    method: 'get',
    params
  });
}

/**
 * 更新模型主表名称及配置表状态和渠道
 */
export function updateModelMain(data: ModelMainUpdateParams) {
  return request({
    url: '/hivision/model/main/update',
    method: 'post',
    data
  });
}
