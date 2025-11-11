/**
 * 查询剧集角色列表请求参数
 */
export interface QueryEpisodeRoleRequest {
  /**
   * 剧集ID
   */
  episodeId?: number;
  /**
   * 项目id
   */
  projectId?: number;
}

/**
 * 角色详情
 */
export interface RoleDetail {
  detailId: number;
  materialId: number;
  name: string;
  originUrl: string;
  previewUrl: string;
  selected: boolean;
}

/**
 * 剧集角色数据
 */
export interface EpisodeRoleData {
  details: RoleDetail[];
  roleId: number;
  roleName: string;
}

/**
 * 查询剧集角色列表响应
 */
export interface QueryEpisodeRoleResponse {
  data: EpisodeRoleData[];
}

/**
 * 场景角色
 */
export interface SceneRole {
  detailId: number;
  roleId: number;
}

/**
 * 编辑剧集角色请求参数
 */
export interface EditEpisodeRoleRequest {
  episodeId: number;
  sceneRoles: SceneRole[];
}

/**
 * 查询场景角色请求参数
 */
export interface QuerySceneRoleRequest {
  /**
   * 基础ID（对应 characterId）
   */
  basicId: string;
  /**
   * 剧集ID
   */
  episodeId: string;
  /**
   * 角色ID
   */
  roleId: string;
}

/**
 * 场景角色详情
 */
export interface SceneRoleDetail {
  detailId: number;
  materialId: number;
  name: string;
  originUrl: string;
  previewUrl: string;
  selected: boolean;
  episodeList?: Array<{
    episodeId?: number;
    episodeName?: string;
  }>;
}

/**
 * 查询场景角色响应
 */
export interface QuerySceneRoleResponse {
  details: SceneRoleDetail[];
  roleId: number;
  roleName: string;
}

/**
 * 编辑场景角色请求参数
 */
export interface EditSceneRoleRequest {
  /**
   * 场景基础信息ID
   */
  basicId: number;
  /**
   * 场景角色信息
   */
  sceneRole: {
    roleId: number;
    detailId: number;
  };
}

/**
 * 故事板请求参数 (StoryBoardBo)
 */
export interface StoryBoardRequest {
  /**
   * 分镜id列表
   */
  basicIds?: number[];
  /**
   * 剧集id
   */
  episodeId: number;
  /**
   * 镜头状态列表（0-白色 1-橙色 2-绿色 3-红色）
   */
  sceneStatusList?: number[];
  /**
   * 镜头类型
   */
  sceneType: number;
}

/**
 * 故事板响应数据
 * hivision_project_scene_basic
 */
export interface StoryBoardSceneVo {
  /**
   * 评论数
   */
  commentCnt?: number;
  /**
   * 台词
   */
  dialogues?: string;
  /**
   * 尾帧素材id
   */
  endFrameMaterialId?: number;
  /**
   * 场景资源id
   */
  envMaterialId?: number;
  /**
   * 剧集id
   */
  episodeId?: number;
  /**
   * 主键（basicId）
   */
  id?: number;
  /**
   * 图片状态 0-白色 1-橙色 2-绿色 3-红色
   */
  imgStatus?: number;
  /**
   * 文生图 任务id
   */
  imgTaskId?: number;
  /**
   * 顺序
   */
  orderNo?: number;
  /**
   * 原始素材oss url
   */
  originOssUrl?: string;
  /**
   * 预览oss url
   */
  previewOssUrl?: string;
  /**
   * 项目id
   */
  projectId?: number;
  /**
   * 镜头描述
   */
  sceneDesc?: string;
  /**
   * 镜头提示
   */
  sceneHint?: string;
  /**
   * 选中的图片素材ID
   */
  selectImgMaterialId?: number;
  /**
   * 选中的视频素材ID
   */
  selectVideoMaterialId?: number;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
  /**
   * 用户id
   */
  userId?: number;
  /**
   * 视频提示词
   */
  videoPrompt?: string;
  /**
   * 视频状态 0-白色 1-橙色 2-绿色 3-红色
   */
  videoStatus?: number;
  /**
   * 图生视频 任务id
   */
  videoTaskId?: number;
}

/**
 * 镜头评论请求参数
 */
export interface SceneCommentRequest {
  /**
   * 镜头id
   */
  basicId: number;
  /**
   * 评论话术
   */
  comment: string;
  /**
   * 镜头类型 1-图片 2-视频
   */
  sceneType: number;
}

/**
 * 查询镜头评论列表请求参数
 */
export interface SceneCommentListRequest {
  /**
   * 镜头id
   */
  basicId: number;
  /**
   * 镜头类型 1-图片 2-视频
   */
  sceneType: number;
}

/**
 * 镜头评论视图对象
 */
export interface SceneCommentVo {
  /**
   * 评论话术
   */
  comment?: string;
  /**
   * 评论人
   */
  commentUserId?: number;
  /**
   * 评论人名称
   */
  commentUsername?: string;
  /**
   * 创建时间
   */
  createTime?: Date;
  /**
   * 剧集id
   */
  episodeId?: number;
  /**
   * 主键
   */
  id?: number;
  /**
   * 项目id
   */
  projectId?: number;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
}

/**
 * 镜头审阅请求参数
 */
export interface SceneReviewRequest {
  /**
   * 分镜id
   */
  id: number;
  /**
   * 审核操作类型（1.通过 2.驳回）
   */
  reviewType: number;
  /**
   * 镜头类型（1.图片 2.视频）
   */
  sceneType: number;
}

/**
 * 分镜插入请求参数
 */
export interface SceneAddRequest {
  /**
   * 前一个镜头id
   */
  preBasicId: number;
  /**
   * 镜头类型 1-图片 2-视频
   */
  sceneType: number;
}

/**
 * 图片编辑请求参数
 */
export interface SceneImageEditRequest {
  /**
   * 镜头id
   */
  basicId: number;
  /**
   * 新上传的图片ossId列表
   */
  imgOssIdList?: number[];
  /**
   * 模型码
   */
  modelCode: string;
  /**
   * 提示语
   */
  prompt?: string;
}
