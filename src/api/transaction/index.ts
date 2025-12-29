import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { TransactionQuery, TransactionVO, WalletTypeVO } from './types';

/**
 * 查询流水记录分页列表
 * @param query 查询参数
 */
export const listTransaction = (query: TransactionQuery): AxiosPromise<TransactionVO[]> => {
  return request({
    url: '/hivision/wallet/transaction/page-list',
    method: 'get',
    params: query
  });
};

/**
 * 获取钱包类型列表
 */
export const getWalletTypes = (): AxiosPromise<WalletTypeVO[]> => {
  return request({
    url: '/hivision/wallet/transaction/name-types',
    method: 'get'
  });
};
