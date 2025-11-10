import request from '@/utils/request';
import type {
  EditEpisodeRoleRequest,
  EditSceneRoleRequest,
  QueryEpisodeRoleRequest,
  QueryEpisodeRoleResponse,
  QuerySceneRoleRequest,
  QuerySceneRoleResponse,
  SceneAddRequest,
  SceneCommentListRequest,
  SceneCommentRequest,
  SceneCommentVo,
  SceneImageEditRequest,
  SceneReviewRequest,
  StoryBoardRequest,
  StoryBoardSceneVo
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

/**
 * 查询故事板
 */
export function queryStoryBoard(data: StoryBoardRequest) {
  return request<StoryBoardSceneVo[]>({
    url: '/hivision/story/episode/story-board',
    method: 'post',
    data
  });
}

/**
 * 镜头评论
 */
export function addSceneComment(data: SceneCommentRequest) {
  return request({
    url: '/hivision/story/comment',
    method: 'post',
    data
  });
}

/**
 * 查询镜头评论列表
 */
export function getSceneCommentList(data: SceneCommentListRequest) {
  return request<SceneCommentVo[]>({
    url: '/hivision/story/comment/list',
    method: 'post',
    data
  });
}

/**
 * 删除镜头评论
 */
export function deleteSceneComment(ids: number[]) {
  return request({
    url: `/hivision/projectSceneComment/${ids.join(',')}`,
    method: 'delete'
  });
}

/**
 * 分镜审阅
 */
export function reviewScene(data: SceneReviewRequest) {
  return request({
    url: '/hivision/story/scene/review',
    method: 'post',
    data
  });
}

/**
 * 分镜插入
 */
export function addScene(data: SceneAddRequest) {
  return request({
    url: '/hivision/story/scene/add',
    method: 'post',
    data
  });
}

/**
 * 删除镜头
 */
export function deleteScene(ids: number[]) {
  return request({
    url: `/hivision/story/scene/${ids.join(',')}`,
    method: 'delete'
  });
}

/**
 * 图片编辑
 */
export function editSceneImage(data: SceneImageEditRequest) {
  return request({
    url: '/hivision/story/scene/edit-img',
    method: 'post',
    data
  });
}
