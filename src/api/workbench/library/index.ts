import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type {
  CharacterDetailResponse,
  CreateLibraryDetailRequest,
  CreateLibraryRequest,
  LibraryBindEpisodeRequest,
  LibraryQueryParams,
  RenameLibraryDetailRequest,
  RenameLibraryRequest,
  SceneDetailResponse
} from '../project/types';

// 新增类型定义
export interface LibraryListQuery {
  createBy?: string;
  createTime?: Date;
  id?: number;
  isAsc?: string;
  libraryType?: number; // 库类型 1-角色 2-场景
  name?: string;
  orderByColumn?: string;
  pageNum?: number;
  pageSize?: number;
  params?: { [key: string]: any };
  projectId?: number;
  remark?: string;
  status?: number; // 启用状态 0-启用 1-禁用
  updateBy?: string;
  updateTime?: Date;
  userId?: number;
}

export interface LibraryListItem {
  id?: number;
  libraryType?: number;
  name?: string;
  projectId?: number;
  status?: number;
  tenantId?: string;
  userId?: number;
}

// ==================== 资源库管理 ====================

/**
 * 获取资源库列表
 * @param query 查询参数
 */
export const listLibrary = (query: LibraryListQuery): AxiosPromise<LibraryListItem[]> => {
  return request({
    url: '/hivision/story/library/list',
    method: 'get',
    params: query
  });
};

/**
 * 创建资源库
 * @param data 资源库数据
 */
export const createLibrary = (data: CreateLibraryRequest): AxiosPromise<any> => {
  return request({
    url: '/hivision/story/library/create',
    method: 'post',
    data
  });
};

/**
 * 重命名资源库
 * @param data 重命名数据
 */
export const renameLibrary = (data: RenameLibraryRequest): AxiosPromise<any> => {
  return request({
    url: '/hivision/story/library/rename',
    method: 'post',
    data
  });
};

/**
 * 删除资源库
 * @param ids 资源库ID（多个用逗号分隔）
 */
export const deleteLibrary = (ids: string | number): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/library/${ids}`,
    method: 'delete'
  });
};

/**
 * 获取角色列表详情
 * @param params 查询参数
 */
export const getCharacterDetail = (params: LibraryQueryParams): AxiosPromise<CharacterDetailResponse> => {
  return request({
    url: '/hivision/story/library/character-detail',
    method: 'get',
    params
  });
};

/**
 * 获取场景列表详情
 * @param params 查询参数
 */
export const getSceneDetail = (params: LibraryQueryParams): AxiosPromise<SceneDetailResponse> => {
  return request({
    url: '/hivision/story/library/env-detail',
    method: 'get',
    params
  });
};

// ==================== 资源库明细管理 ====================

/**
 * 创建资源库明细
 * @param data 明细数据
 */
export const createLibraryDetail = (data: CreateLibraryDetailRequest): AxiosPromise<any> => {
  return request({
    url: '/hivision/story/library-detail/create',
    method: 'post',
    data
  });
};

/**
 * 重命名资源库明细
 * @param data 重命名数据
 */
export const renameLibraryDetail = (data: RenameLibraryDetailRequest): AxiosPromise<any> => {
  return request({
    url: '/hivision/story/library-detail/rename',
    method: 'post',
    data
  });
};

/**
 * 删除资源库明细
 * @param ids 明细ID（多个用逗号分隔）
 */
export const deleteLibraryDetail = (ids: string | number): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/library-detail/${ids}`,
    method: 'delete'
  });
};

/**
 * 资源库绑定剧集
 * @param data 绑定数据
 */
export const bindEpisode = (data: LibraryBindEpisodeRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/library/bind-episode',
    method: 'post',
    data
  });
};

/**
 * 获取资源库详情数量
 * @param libraryId 资源库ID
 */
export const getLibraryDetailCount = (libraryId: number): AxiosPromise<number> => {
  return request({
    url: '/hivision/story/library/detail-count',
    method: 'get',
    params: { libraryId }
  });
};
