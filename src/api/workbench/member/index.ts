import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AddProjectUserRequest, EditProjectUserRequest, ProjectUserRole } from './types';

/**
 * 获取项目用户角色初始化信息
 * @returns 角色列表
 */
export const getProjectUserRoles = (): AxiosPromise<ProjectUserRole[]> => {
  return request({
    url: '/hivision/story/team/init-user-role',
    method: 'get'
  });
};

/**
 * 新增协作者
 * @param data 协作者信息
 */
export const addProjectUser = (data: AddProjectUserRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/team/add-user',
    method: 'post',
    data
  });
};

/**
 * 删除协作者
 * @param ids 成员id列表（取项目详情接口的teamUserInfoList.memberId）
 */
export const deleteProjectUser = (ids: number[]): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/team/${ids.join(',')}`,
    method: 'delete'
  });
};

/**
 * 修改项目用户角色
 * @param data 修改信息
 */
export const editProjectUser = (data: EditProjectUserRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/team/edit-user',
    method: 'post',
    data
  });
};
