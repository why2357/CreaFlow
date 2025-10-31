import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import {
  ProcessRecordCreateRequest,
  ProcessReferPageRequest,
  ProjectCreateRequest,
  ProjectForm,
  ProjectInfoResponse,
  ProjectPageInfoResponseDto,
  ProjectProcessRecordVo,
  ProjectQuery,
  ProjectRenameRequest,
  ProjectUserPageInfo,
  ProjectUserQuery
} from './types';

/**
 * 查询项目列表分页
 * @param query 查询参数
 */
export const listProject = (query: ProjectQuery): AxiosPromise<ProjectPageInfoResponseDto[]> => {
  return request({
    url: '/hivision/story/project/page-list',
    method: 'get',
    params: query
  });
};

/**
 * 获取项目详细信息（含剧集、团队、素材统计）
 * @param projectId 项目ID
 */
export const getProjectInfo = (projectId: number): AxiosPromise<ProjectInfoResponse> => {
  return request({
    url: '/hivision/story/project/info',
    method: 'get',
    params: { projectId }
  });
};

/**
 * 创建项目
 * @param data 项目创建请求数据
 * @returns 返回创建的项目ID
 */
export const addProject = (data: ProjectCreateRequest): AxiosPromise<number> => {
  return request({
    url: '/hivision/story/project/create',
    method: 'post',
    data: data
  });
};

/**
 * 重命名项目
 * @param data 项目重命名请求数据
 */
export const renameProject = (data: ProjectRenameRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/project/rename',
    method: 'post',
    data: data
  });
};

/**
 * 更新项目
 * @param data 项目表单数据
 */
export const updateProject = (data: ProjectForm): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/project',
    method: 'put',
    data: data
  });
};

/**
 * 删除项目
 * @param projectId 项目ID
 */
export const delProject = (projectId: string | number): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/project/${projectId}`,
    method: 'delete'
  });
};

/**
 * 获取项目协作者列表（支持分页和昵称模糊搜索）
 * @param query 查询参数
 */
export const listProjectUsers = (query: ProjectUserQuery): AxiosPromise<ProjectUserPageInfo[]> => {
  return request({
    url: '/hivision/story/team/user-list',
    method: 'get',
    params: query
  });
};

// ==================== 工作流记录相关接口 ====================

/**
 * 创建/更新工作流记录
 * @param data 工作流记录创建请求
 */
export const createProcessRecord = (data: ProcessRecordCreateRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/process/create',
    method: 'post',
    data
  });
};

/**
 * 获取项目的跳转页面（工作流记录）
 * @param params 查询参数
 */
export const getReferPage = (params: ProcessReferPageRequest): AxiosPromise<ProjectProcessRecordVo> => {
  return request({
    url: '/hivision/story/process/refer-page',
    method: 'get',
    params
  });
};
