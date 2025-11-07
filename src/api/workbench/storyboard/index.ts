import request from '@/utils/request';
import type {
  EditEpisodeRoleRequest,
  EditSceneRoleRequest,
  QueryEpisodeRoleRequest,
  QueryEpisodeRoleResponse,
  QuerySceneRoleRequest,
  QuerySceneRoleResponse
} from './types';

/**
 * 查询剧集角色列表
 */
export function queryEpisodeRole(params: QueryEpisodeRoleRequest) {
  return request<QueryEpisodeRoleResponse>({
    url: '/hivision/story/scene/query-episode-role',
    method: 'get',
    params
  });
}

/**
 * 编辑剧集角色
 */
export function editEpisodeRole(data: EditEpisodeRoleRequest) {
  return request({
    url: '/hivision/story/scene/edit-episode-role',
    method: 'put',
    data
  });
}

/**
 * 查询场景角色（单个角色的服装列表）
 */
export function querySceneRole(params: QuerySceneRoleRequest) {
  return request<QuerySceneRoleResponse>({
    url: '/hivision/story/scene/query-scene-role',
    method: 'get',
    params
  });
}

/**
 * 编辑场景角色（单个角色服装编辑）
 */
export function editSceneRole(data: EditSceneRoleRequest) {
  return request({
    url: '/hivision/story/scene/edit-scene-role',
    method: 'put',
    data
  });
}
