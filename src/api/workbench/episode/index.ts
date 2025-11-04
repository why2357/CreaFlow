import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import {
  EpisodeCreateRequest,
  EpisodeForm,
  EpisodeTemplateUploadRequest,
  GenerateStoryboardForm,
  Shot,
  ShotForm
} from '../project/types';
import type { HivisionProjectEpisodeVo } from './types';

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
 * 更新剧集（旧接口）
 * @param data 剧集表单数据
 */
export const updateEpisode = (data: EpisodeForm): AxiosPromise<void> => {
  return request({
    url: `/workbench/project/${data.projectId}/episodes/${data.id}`,
    method: 'put',
    data: data
  });
};

/**
 * 重命名剧集（新接口）
 * @param episodeId 剧集ID
 * @param episodeName 新剧集名称
 * @param projectId 项目ID（可选）
 */
export const renameEpisode = (episodeId: number, episodeName: string, projectId?: number): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/episode',
    method: 'put',
    data: {
      id: episodeId,
      episodeName,
      projectId
    }
  });
};

/**
 * 删除剧集（旧接口）
 * @param projectId 项目ID
 * @param episodeId 剧集ID
 */
export const delEpisode = (projectId: string | number, episodeId: string | number): AxiosPromise<void> => {
  return request({
    url: `/workbench/project/${projectId}/episodes/${episodeId}`,
    method: 'delete'
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
 * 查询分镜列表
 * @param projectId 项目ID
 * @param episodeId 剧集ID
 */
export const listShots = (projectId: string | number, episodeId: string | number): AxiosPromise<Shot[]> => {
  return request({
    url: `/workbench/project/${projectId}/episodes/${episodeId}/shots`,
    method: 'get'
  });
};

/**
 * 新增分镜
 * @param data 分镜头单数据
 */
export const addShot = (data: ShotForm): AxiosPromise<Shot> => {
  return request({
    url: `/workbench/project/episodes/${data.episodeId}/shots`,
    method: 'post',
    data: data
  });
};

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
 * 删除分镜
 * @param episodeId 剧集ID
 * @param shotId 分镜ID
 */
export const delShot = (episodeId: string | number, shotId: string | number): AxiosPromise<void> => {
  return request({
    url: `/workbench/project/episodes/${episodeId}/shots/${shotId}`,
    method: 'delete'
  });
};

/**
 * 生成分镜
 * @param data 生成分镜头单数据
 */
export const generateStoryboard = (data: GenerateStoryboardForm): AxiosPromise<Shot[]> => {
  const formData = new FormData();
  formData.append('episodeId', String(data.episodeId));
  formData.append('projectId', String(data.projectId));
  formData.append('episodeName', data.episodeName);

  if (data.scriptContent) {
    formData.append('scriptContent', data.scriptContent);
  }

  if (data.scriptFile) {
    formData.append('scriptFile', data.scriptFile);
  }

  if (data.model) {
    formData.append('model', data.model);
  }

  return request({
    url: `/workbench/project/${data.projectId}/episodes/${data.episodeId}/generate-storyboard`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
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
export const rematchCharacters = (episodeId: number): AxiosPromise<void> => {
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
