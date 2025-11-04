export * from '../project/types';

/**
 * 场景基础编辑请求 (SceneBasicEditRequestDto)
 */
export interface SceneBasicEditRequest {
  /** 场景基础信息ID */
  basicId: number;
  /** 台词 */
  dialogues?: string;
  /** 镜头描述 */
  sceneDesc?: string;
  /** 镜头提示 */
  sceneHint?: string;
  [property: string]: any;
}

/**
 * 剧集视图对象 (HivisionProjectEpisodeVo)
 * hivision_project_episode
 */
export interface HivisionProjectEpisodeVo {
  /**
   * 当前工作流节点 1-剧本 2-角色 3-场景 4-镜头 5-视频
   */
  currentNode?: number;
  /**
   * 剧集名称
   */
  episodeName?: string;
  /**
   * 主键
   */
  id?: number;
  /**
   * 模型码
   */
  modelCode?: string;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
  /**
   * 小说剧情
   */
  storyText?: string;
  /**
   * 文生文 任务id
   */
  taskId?: number;
  /**
   * 用户id
   */
  userId?: number;
  [property: string]: any;
}

/**
 * 媒体资源视图对象 HivisionProjectMaterialVo
 */
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
  [property: string]: any;
}

/**
 * 人物服装信息 CharacterClothingInfo
 */
export interface CharacterClothingInfo {
  /** 角色名称 */
  characterName?: string;
  /** 服装id */
  clothingId?: number;
  /** 服装名称 */
  clothingName?: string;
  /** 素材信息 */
  materialInfoVo?: HivisionProjectMaterialVo;
  [property: string]: any;
}

/**
 * 剧集场景项信息 EpisodeSceneItemInfo
 */
export interface EpisodeSceneItemInfo {
  /** 场景基础信息ID */
  basicId?: number;
  /** 人物服装 */
  characterClothingInfoList?: CharacterClothingInfo[];
  /** 台词 */
  dialogues?: string;
  /** 环境素材信息 */
  envMaterialInfoVo?: HivisionProjectMaterialVo;
  /** 画面图片或视频 */
  materialInfoVoList?: HivisionProjectMaterialVo[];
  /** 场景描述 */
  sceneDesc?: string;
  /** 场景提示 */
  sceneHint?: string;
  /** 画面状态 0-白色 1-橙色 2-绿色 3-红色 */
  sceneStatus?: number;
  /** 文生图任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败 */
  taskStatus?: number;
  [property: string]: any;
}

/**
 * 剧集信息响应 EpisodeInfoResponseDto
 */
export interface EpisodeInfoResponseDto {
  /** 批量状态 0-未操作 1-已操作 */
  batchStatus?: number;
  /** 剧集id */
  episodeId?: number;
  /** 剧集名称 */
  episodeName?: string;
  /** 剧集场景信息 */
  episodeSceneItemInfoList?: EpisodeSceneItemInfo[];
  /** 模式码 */
  modeCode?: string;
  /** 文生文任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败 */
  taskStatus?: number;
  [property: string]: any;
}
