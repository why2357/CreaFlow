import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { TransactionQuery, TransactionVO } from './types';

/**
 * 查询流水记录分页列表
 * @param query 查询参数
 */
export const listTransaction = (query: TransactionQuery): AxiosPromise<{ rows: TransactionVO[]; total: number }> => {
  return request({
    url: '/hivision/transaction/page-list',
    method: 'get',
    params: query
  });
};
