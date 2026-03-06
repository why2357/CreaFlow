import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { EpisodeCreateRequest, EpisodeTemplateUploadRequest, ShotForm } from '../project/types';
import type { SceneCommentVo } from '../storyboard/types';
import type { CharacterMatchResponse, HivisionProjectEpisodeVo, SceneEnvSetRequest, SeedanceGenerateRequest, VideoPromptTQuery } from './types';

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
      modelCode: data.modelCode,
      promptPreFix: data.promptPreFix,
      workflowMode: data.workflowMode
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
  if (data.workflowMode) {
    formData.append('workflowMode', data.workflowMode);
  }

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
 * 清除场景环境
 * @param data 场景环境清除请求数据
 */
export const clearSceneEnv = (data: { basicId: number }): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/env/clear',
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

/**
 * 检查图片请求
 */
export interface EpisodeCheckImgRequest {
  /** 剧集id */
  episodeId: number;
  /** 模型码 */
  modelCode: string;
}

/**
 * 检查图片响应
 */
export interface EpisodeCheckImgResponse {
  /** 镜头id列表 */
  basicIdList?: number[];
  /** 累计消费积分 */
  consumerTotalPoints?: number;
}

/**
 * 检查图片接口
 * @param params 检查图片请求参数
 */
export const checkEpisodeImg = (params: EpisodeCheckImgRequest): AxiosPromise<EpisodeCheckImgResponse> => {
  return request({
    url: '/hivision/story/episode/check-img',
    method: 'get',
    params
  });
};

/**
 * 生成图片接口
 * @param data 图片生成请求数据
 */
export interface EpisodeGenerateImgRequest {
  /** 镜头id 给值为单个生成，不给值为批量生成 */
  basicId?: number;
  /** 剧集id */
  episodeId: number;
  /** 模型码 */
  modelCode: string;
}

export const generateEpisodeImg = (data: EpisodeGenerateImgRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/episode/generate-img',
    method: 'post',
    data
  });
};

/**
 * Seedance 2.0 生成视频接口
 * @param data Seedance 生成请求数据（含提示词和有序参考图 ossId 列表）
 */
export const generateSeedanceVideo = (data: SeedanceGenerateRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/episode/generate-seedance',
    method: 'post',
    data
  });
};

// ==================== 历史记录管理 ====================

/**
 * 选择历史明细接口
 * @param data 历史明细选择请求数据
 */
export interface HistoryDetailChoseRequest {
  /** 历史明细id */
  historyDetailId: number;
}

export const chooseHistoryDetail = (data: HistoryDetailChoseRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/history-detail/chose',
    method: 'post',
    data
  });
};

/**
 * 收藏历史明细接口
 * @param data 历史明细收藏请求数据
 */
export interface HistoryDetailCollectRequest {
  /** 历史明细id */
  historyDetailId: number;
}

export const collectHistoryDetail = (data: HistoryDetailCollectRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/history-detail/collect',
    method: 'post',
    data
  });
};

/**
 * 取消收藏历史明细接口
 * @param data 历史明细取消收藏请求数据
 */
export interface HistoryDetailCancelCollectRequest {
  /** 历史明细id */
  historyDetailId: number;
}

export const cancelCollectHistoryDetail = (data: HistoryDetailCancelCollectRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/history-detail/cancel-collect',
    method: 'post',
    data
  });
};

/**
 * 删除历史主数据
 * @param ids 主键数组
 */
export const deleteHistory = (ids: number[]): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/history/${ids.join(',')}`,
    method: 'delete'
  });
};

/**
 * 删除历史明细
 * @param ids 历史明细ID数组
 */
export const deleteHistoryDetail = (ids: number[]): AxiosPromise<void> => {
  return request({
    url: `/hivision/story/history-detail/${ids.join(',')}`,
    method: 'delete'
  });
};

/**
 * 获取镜头历史列表
 * @param params 查询参数
 */
export interface SceneHistoryListRequest {
  /** 镜头id */
  basicId: number;
  /** 镜头类型 1-图片 2-视频 */
  sceneType: number;
}

export interface SceneHistoryListResponse {
  /** 历史信息列表 */
  historyInfoList?: SceneMainHistoryInfo[];
  /** 选中的历史 */
  selectHistory?: SceneMainHistoryInfo;
}

export interface SceneMainHistoryInfo {
  /** 基础镜头id */
  basicId?: number;
  /** 创建时间 */
  createTime?: Date;
  /** 剧集id */
  episodeId?: number;
  /** 历史id */
  historyId?: number;
  /** 模型码 */
  modelCode?: string;
  modelName?: string;

  /** 操作类型 1-模型生成 2-编辑生成 */
  operationType?: number;
  /** 尺寸比例 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16 */
  pictureRatio?: number;
  /** 项目id */
  projectId?: number;
  /** 镜头描述 */
  sceneDesc?: string;
  /** 镜头提示 */
  sceneHint?: string;
  /** 提示词（用于视频生成）*/
  prompt?: string;
  /** 镜头历史明细 */
  sceneItemHistoryInfoList?: SceneItemHistoryInfo[];
  /** 镜头类型 1-图片 2-视频 */
  sceneType?: number;
  /** 视频时长（秒）*/
  duration?: number;
  /** 视频分辨率 */
  resolution?: string;
}

export interface SceneItemHistoryInfo {
  /** 基础镜头id */
  basicId?: number;
  /** 剧集id */
  episodeId?: number;
  /** 历史明细id */
  historyDetailId?: number;
  /** 历史id */
  historyId?: number;
  /** 是否收藏 */
  isCollect?: boolean;
  /** 媒体资源id */
  materialId?: number;
  /** 媒体资源信息 */
  materialVo?: HivisionProjectMaterialVo;
  /** 项目id */
  projectId?: number;
  /** 镜头类型 1-图片 2-视频 */
  sceneType?: number;
  /** 选中状态 0-未选中 1-选中 */
  selectStatus?: number;
  /** 评论列表 */
  commentVoList: SceneCommentVo[];
}

export interface HivisionProjectMaterialVo {
  /** 主键 */
  id?: number;
  /** 原始素材oss id */
  originOssId?: number;
  /** 原始素材oss url */
  originOssUrl?: string;
  /** 预览oss id */
  previewOssId?: number;
  /** 预览oss url */
  previewOssUrl?: string;
  /** 项目id */
  projectId?: number;
  /** 启用状态 0-启用 1-禁用 */
  status?: number;
  /** 用户id */
  userId?: number;
}

export const getSceneHistoryList = (params: SceneHistoryListRequest): AxiosPromise<SceneHistoryListResponse> => {
  return request({
    url: '/hivision/story/history/scene-history-list',
    method: 'get',
    params
  });
};

/**
 * 替换场景图片（本地上传）
 * @param data 图片替换请求数据
 */
export interface ImageReplaceRequestDto {
  /** 镜头id */
  basicId: number;
  /** oss文件id */
  ossId: number;
  // 操作类型 1-模型生成 2-编辑生成 3-本地上传
  // 增加入参，本地上传的时候给一下3，其他场景不用给
  operationType?: number;
}

export const replaceSceneImage = (data: ImageReplaceRequestDto): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/replace-img',
    method: 'post',
    data
  });
};

// ==================== 视频相关接口 ====================

import type {
  AiModelInfoDto,
  ExportVideoPromptTemplateRequest,
  GenVideoRequest,
  VideoEpisodeInfoResponseDto
} from './types';

/**
 * 获取视频镜头列表
 * @param episodeId 剧集ID
 */
export const getVideoSceneList = (episodeId: number): AxiosPromise<VideoEpisodeInfoResponseDto> => {
  return request({
    url: '/hivision/story/episode/video-scene-list',
    method: 'get',
    params: { episodeId }
  });
};

/**
 * 查询视频模型配置
 */
export const getVideoModelConfig = (): AxiosPromise<AiModelInfoDto> => {
  return request({
    url: '/hivision/story/episode/video/model-config',
    method: 'get'
  });
};

/**
 * 生成视频
 * @param data 生成视频请求数据
 */
export const generateVideo = (data: GenVideoRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/episode/generate-video',
    method: 'post',
    data
  });
};

/**
 * 导入视频提示词模版
 * @param file 文件
 * @param projectId 项目ID（可选）
 */
export const importVideoPromptTemplate = (data: VideoPromptTQuery): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/episode/video/prompt-template/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 导出视频提示词模版
 * @param data 导出请求数据
 */
export const exportVideoPromptTemplate = (data: ExportVideoPromptTemplateRequest): AxiosPromise<Blob> => {
  return request({
    url: '/hivision/story/episode/video/prompt-template/export',
    method: 'post',
    data,
    responseType: 'blob'
  });
};

/**
 * 编辑视频提示词
 * @param data 编辑请求数据
 */
export interface EditVideoPromptRequest {
  /** 场景基础信息ID */
  basicId: number;
  /** 视频提示词 */
  videoPrompt?: string;
  /** 尾帧OSS ID */
  endFrameOssId?: number;
  endFrameMaterialId?: number;
  /** 尾帧OSS URL */
  endFrameOssUrl?: string;
}

export const editVideoPrompt = (data: EditVideoPromptRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/edit',
    method: 'post',
    data
  });
};

// ==================== 导出功能接口 ====================

/**
 * 导出剧集图片(压缩包)
 * @param episodeId 剧集ID
 */
export const exportEpisodeImages = (episodeId: number): AxiosPromise<Blob> => {
  return request({
    url: `/hivision/system/episode-export/episode-zip/${episodeId}`,
    method: 'get',
    responseType: 'blob'
  });
};

/**
 * 导出剧集Excel表单（图片）
 * @param episodeId 剧集ID
 */
export const exportEpisodeExcel = (episodeId: number): AxiosPromise<Blob> => {
  return request({
    url: `/hivision/system/episode-export/export-image-excel/${episodeId}`,
    method: 'get',
    responseType: 'blob'
  });
};

/**
 * 导出剧集Excel表单（视频）
 * @param episodeId 剧集ID
 */
export const exportEpisodeVideoExcel = (episodeId: number): AxiosPromise<Blob> => {
  return request({
    url: `/hivision/system/episode-export/export-video-excel/${episodeId}`,
    method: 'get',
    responseType: 'blob'
  });
};

// ==================== 镜头拖动排序接口 ====================

/**
 * 镜头拖动排序请求参数
 */
export interface SceneDragSortRequest {
  /** 被拖动的镜头ID */
  dragBasicId: number;
  /** 目标位置的镜头ID（拖到这个镜头的前面）如果为null，表示拖到最后 */
  targetBasicId?: number;
}

/**
 * 镜头拖动排序
 * @param data 拖动排序请求数据
 */
export const dragSortScene = (data: SceneDragSortRequest): AxiosPromise<void> => {
  return request({
    url: '/hivision/story/scene/drag-sort',
    method: 'post',
    data
  });
};
