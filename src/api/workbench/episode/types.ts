export * from '../project/types';

/**
 * 剧集重命名请求 (EpisodeRenameRequestDto)
 */
export interface EpisodeRenameRequest {
  /** 剧集id */
  episodeId: number;
  /** 剧集名称 */
  episodeName: string;
}

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
}

/**
 * 人物服装信息 CharacterClothingInfo
 */
export interface CharacterClothingInfo {
  /** 角色ID（对应 basicId）*/
  characterId?: number;
  /** 角色名称 */
  characterName?: string;
  /** 服装id */
  clothingId?: number;
  /** 服装名称 */
  clothingName?: string;
  /** 素材信息 */
  materialInfoVo?: HivisionProjectMaterialVo;
  /** 角色ID（用于编辑接口）*/
  roleId?: number;
}

/**
 * 剧集场景项信息 EpisodeSceneItemInfo
 */
export interface EpisodeSceneItemInfo {
  /** 场景基础信息ID */
  basicId?: number;
  /** 人物服装 */
  characterClothingInfoList?: CharacterClothingInfo[];
  /** 评论数 */
  commentCnt?: number;
  /** 台词 */
  dialogues?: string;
  /** 环境素材信息 */
  envMaterialInfoVo?: HivisionProjectMaterialVo;
  /** 历史记录ID */
  historyId?: number;
  /** 历史明细ID */
  historyDetailId?: number;
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
  isCollect: boolean;
  commentCount: number;
  /** 最新一条评论信息 */
  commentInfo?: any;
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
}

/**
 * 角色匹配响应
 */
export interface CharacterMatchResponse {
  /** 超过角色数量的镜头编号列表 */
  errorSceneNums?: number[];
}

/**
 * 场景环境设置请求
 */
export interface SceneEnvSetRequest {
  /** 场景基础信息ID */
  basicId: number;
  /** 环境类型 1-场景库 2-本地上传 */
  envType: 1 | 2;
  /** 场景库素材ID（envType=1时使用） */
  envMaterialId?: number;
  /** OSS文件ID（envType=2时使用） */
  ossId?: number;
}

/**
 * 角色服装详情
 */
export interface RoleDetail {
  /** 服装详情ID */
  detailId: number;
  /** 素材ID */
  materialId: number;
  /** 服装名称 */
  name: string;
  /** 原始图片URL */
  originUrl: string;
  /** 预览图片URL */
  previewUrl: string;
  /** 是否选中 */
  selected: boolean;
  /** 剧集列表 */
  episodeList?: Array<{
    episodeId?: number;
    episodeName?: string;
  }>;
}

/**
 * 角色数据
 */
export interface RoleData {
  /** 服装详情列表 */
  details: RoleDetail[];
  /** 角色ID */
  roleId: number;
  /** 角色名称 */
  roleName: string;
}

/**
 * 查询剧集角色列表响应
 */
export interface QueryEpisodeRoleResponse {
  /** 角色列表 */
  data?: RoleData[];
}

/**
 * 编辑剧集角色请求
 */
export interface EditEpisodeRoleRequest {
  /** 剧集ID */
  episodeId: number;
  /** 场景角色列表 */
  sceneRoles: SceneRole[];
}

/**
 * 场景角色
 */
export interface SceneRole {
  /** 服装详情ID */
  detailId: number;
  /** 角色ID */
  roleId: number;
}
