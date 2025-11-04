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

export default {
  getUserCenterProfile,
  updateUserCenterProfile
};
