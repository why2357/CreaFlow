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
