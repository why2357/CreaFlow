import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { EpisodeCreateRequest, EpisodeTemplateUploadRequest, ShotForm } from '../project/types';
import type { CharacterMatchResponse, HivisionProjectEpisodeVo, SceneEnvSetRequest } from './types';

/**
 * 查询剧集列表
 * @param projectId 项目ID
 * @returns 剧集列表
 */
export const listEpisodes = (projectId: number): AxiosPromise<HivisionProjectEpisodeVo[]> => {
  return request({
    url: '/hivision/story/episode/list',
    method: 'get',
    params: { projectId }
  });
};

/**
 * 创建剧集（剧情文本模式）
 * @param data 剧集创建请求数据
 */
export const createEpisodeByText = (data: EpisodeCreateRequest): AxiosPromise<HivisionProjectEpisodeVo> => {
  return request({
    url: '/hivision/story/episode/create',
    method: 'post',
    data: {
      projectId: data.projectId,
      episodeName: data.episodeName,
      storyText: data.storyText,
      modelCode: data.modelCode
    }
  });
};

/**
 * 创建剧集（上传拆分剧本模式）
 * @param data 剧集模板上传请求数据
 */
export const createEpisodeByTemplate = (data: EpisodeTemplateUploadRequest): AxiosPromise<HivisionProjectEpisodeVo> => {
  const formData = new FormData();
  formData.append('projectId', String(data.projectId));
  formData.append('episodeName', data.episodeName);
  formData.append('file', data.file);

  return request({
    url: '/hivision/story/episode/template/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 重命名剧集（新接口）
 * @param episodeId 剧集ID
 * @param episodeName 新剧集名称
 */
export const renameEpisode = (episodeId: number, episodeName: string): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/episode/rename',
    method: 'post',
    data: {
      episodeId,
      episodeName
    }
  });
};

/**
 * 删除剧集（新接口 - 支持批量删除）
 * @param ids 剧集ID数组
 */
export const deleteEpisodes = (ids: number[]): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/episode/${ids.join(',')}`,
    method: 'delete'
  });
};

// ==================== 分镜管理 ====================

/**
 * 更新分镜
 * @param data 分镜头单数据
 */
export const updateShot = (data: ShotForm): AxiosPromise<void> => {
  return request({
    url: `/workbench/project/episodes/${data.episodeId}/shots/${data.id}`,
    method: 'put',
    data: data
  });
};

/**
 * 获取剧集的图片镜头列表
 * @param episodeId 剧集ID
 */
export const getEpisodeImgSceneList = (episodeId: number): AxiosPromise<any> => {
  return request({
    url: '/hivision/story/episode/img-scene-list',
    method: 'get',
    params: { episodeId }
  });
};

/**
 * 重新匹配角色
 * @param episodeId 剧集ID
 */
export const rematchCharacters = (episodeId: number): AxiosPromise<CharacterMatchResponse> => {
  return request({
    url: '/hivision/story/scene/character-match',
    method: 'post',
    data: { episodeId }
  });
};

/**
 * 编辑场景基础信息
 * @param data 场景基础编辑请求数据
 */
export const editSceneBasic = (data: any): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/edit',
    method: 'post',
    data
  });
};

/**
 * 设置场景环境
 * @param data 场景环境设置请求数据
 */
export const setSceneEnv = (data: SceneEnvSetRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/env',
    method: 'put',
    data
  });
};

/**
 * 查询剧集角色列表
 * @param params 查询参数
 */
export const queryEpisodeRole = (params: { episodeId?: number; projectId?: number }): AxiosPromise<any> => {
  return request({
    url: '/hivision/story/scene/query-episode-role',
    method: 'get',
    params
  });
};

/**
 * 编辑剧集角色
 * @param data 编辑请求数据
 */
export const editEpisodeRole = (data: {
  episodeId: number;
  sceneRoles: Array<{ detailId: number; roleId: number }>;
}): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/edit-episode-role',
    method: 'put',
    data
  });
};
