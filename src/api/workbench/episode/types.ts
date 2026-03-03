export * from '../project/types';

export interface VideoPromptTQuery {
  file: File;
  projectId: number | string;
}
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
  /** 特写镜头描述 */
  sceneDesc?: string;
  /** 场景提示 */
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
  /** 工作流模式：classic-经典工作流 / seedance-Seedance 2.0 */
  workflowMode?: 'classic' | 'seedance';
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

// ==================== 视频相关类型 ====================

/**
 * 视频模型点数配置 VideoModelPointConfig (旧版，保留兼容)
 */
export interface VideoModelPointConfig {
  /** 时长 */
  duration?: number;
  /** 单次扣费数量 */
  points?: number;
  /** 分辨率 */
  resolution?: string;
}

/**
 * 时长配置 DurationConfig
 */
export interface DurationConfig {
  /** 时长 */
  duration?: number;
  /** 单次扣费数量 */
  points?: number;
}

/**
 * 分辨率配置 ResolutionConfig
 */
export interface ResolutionConfig {
  /** 时长配置列表 */
  durationConfigs?: DurationConfig[];
  /** 分辨率 */
  resolution?: string;
}

/**
 * 视频模型配置 VideoModelConfigVo
 */
export interface VideoModelConfigVo {
  /** 模型码 */
  modelCode?: string;
  /** 模型名称 */
  modelName?: string;
  /** 视频模型点数配置 */
  resolutionConfigs?: ResolutionConfig[];
  /** 是否支持尾帧 */
  allowTailImg?: boolean;
}

/**
 * AI模型信息 AiModelInfoDto (旧版，保留兼容)
 */
export interface AiModelInfoDto {
  /** 模型码 */
  modelCode?: string;
  /** 模型名称 */
  modelName?: string;
  /** 单次扣费数量 */
  points?: number;
  /** 视频模型点数配置 */
  videoModelPointConfigs?: VideoModelPointConfig[];
}

/**
 * 视频镜头场景项信息（扩展 EpisodeSceneItemInfo）
 */
export interface VideoSceneItemInfo extends EpisodeSceneItemInfo {
  /** 视频提示词 */
  videoPrompt?: string;
  historyDetailId?: number;
  imgUrl?: string;
  /** 视频链接 */
  videoUrl?: string;
  /** 视频历史列表（最近2条记录） */
  historyVos?: HivisionProjectHistoryVo[];
  /** 选中的模型配置 (前端使用，格式：resolution-duration) */
  selectedModelConfig?: string;
  /** 视频生成中状态 (前端使用) */
  videoGenerating?: boolean;
  /** 尾帧OSS ID */
  endFrameOssId?: number;
  /** 尾帧OSS URL */
  endFrameOssUrl?: string;
}

/**
 * 项目历史视图对象 HivisionProjectHistoryVo
 */
export interface HivisionProjectHistoryVo {
  /** 基础镜头id */
  basicId?: number;
  historyDetailId?: number;
  /** 剧集id */
  episodeId?: number;
  /** 生成图片次数 */
  genImgCnt?: number;
  /** 生成视频次数 */
  genVideoCnt?: number;
  /** 主键 */
  id?: number;
  /** 媒体资源id */
  materialId?: number;
  /** 模型码 */
  modelCode?: string;
  /** 模型名称 */
  modelName?: string;
  // 分辨率
  resolution?: string;
  /** 项目id */
  projectId?: number;
  /** 镜头描述 */
  sceneDesc?: string;
  /** 镜头提示 */
  sceneHint?: string;
  /** 镜头类型 1-图片 2-视频 */
  sceneType?: number;
  /** 启用状态 0-启用 1-禁用 */
  status?: number;
  /** 任务id */
  taskId?: number;
  /** 任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败 */
  taskStatus?: number;
  /** 用户id */
  userId?: number;
  /** 视频URL */
  videoUrl?: string;
  /** 封面图URL */
  imgUrl?: string;
  /** 分辨率 (如: 1080P) */
  ratio?: string;
  /** 时长 (如: 8s) */
  duration?: string;
  /** 创建时间 */
  createTime?: string;
}

/**
 * 视频剧集信息响应 VideoEpisodeInfoResponseDto
 */
export interface VideoEpisodeInfoResponseDto {
  /** 批量状态 0-未操作 1-已操作 */
  batchStatus?: number;
  /** 剧集id */
  episodeId?: number;
  /** 剧集名称 */
  episodeName?: string;
  /** 剧集场景信息 */
  episodeSceneItemInfoList?: VideoSceneItemInfo[];
  /** 模式码 */
  modeCode?: string;
  /** 项目id */
  projectId?: number;
  /** 文生文任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败 */
  taskStatus?: number;
}

/**
 * 生成视频请求 GenVideoBo
 */
export interface GenVideoRequest {
  /** 分镜id列表 */
  basicIds: number[];
  /** 时长 */
  duration: number;
  /** 模型码（jm-3.0：即梦3.0）*/
  modelCode: string;
  /** 单个视频扣除的点数（无需传参）*/
  pointsPerVideo?: number;
  /** 分辨率 */
  resolution: string;
  /** 尾帧OSS ID（可选）*/
  tailFrameOssId?: number;
}

/**
 * 导出视频提示词模板请求 VideoPromptTemplateBo
 */
export interface ExportVideoPromptTemplateRequest {
  /** 剧集id */
  episodeId: number;
}
