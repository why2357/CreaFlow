import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { UserProfileVO, UserProfileUpdateForm } from './types';

/**
 * 查询个人信息
 */
export const getUserCenterProfile = (): AxiosPromise<UserProfileVO> => {
  return request({
    url: '/hivision/system/user-center/user-profile',
    method: 'get'
  });
};

/**
 * 修改个人信息
 * @param data 用户信息
 */
export const updateUserCenterProfile = (data: UserProfileUpdateForm) => {
  return request({
    url: '/hivision/system/user-center/update',
    method: 'post',
    data: data
  });
};

/**
 * 查询钱包积分
 */
export const getWalletPoints = (): AxiosPromise<number> => {
  return request({
    url: '/hivision/system/user-center/wallet-points',
    method: 'get'
  });
};

export default {
  getUserCenterProfile,
  updateUserCenterProfile,
  getWalletPoints
};
