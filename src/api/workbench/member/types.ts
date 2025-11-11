/**
 * 成员信息
 */
export interface Member {
  id: number | string;
  name: string;
  username?: string;
  avatar?: string;
  department?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

/**
 * 成员查询参数
 */
export interface MemberQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string; // 搜索关键字（名称、用户名、编号）
  department?: string;
  status?: 'active' | 'inactive';
}

/**
 * 项目用户角色信息
 */
export interface ProjectUserRole {
  /** 角色id */
  roleId?: number;
  /** 角色码 */
  roleKey?: string;
  /** 角色名称 */
  roleName?: string;
  /** 是否显示在下拉列表中 */
  isShow?: boolean;
}

/**
 * 角色码枚举
 */
export enum RoleKey {
  /** 管理员（PM） */
  ADMIN = 'ADMIN',
  /** 运营 */
  OPERATOR = 'OPERATOR',
  /** 普通客户 */
  CUSTOMER = 'CUSTOMER',
  /** 导演 */
  DIRECTOR = 'DIRECTOR',
  /** 专员 */
  COMMISSIONER = 'COMMISSIONER'
}

/**
 * 新增协作者请求参数
 */
export interface AddProjectUserRequest {
  /** 项目id */
  projectId: number;
  /** 角色id */
  roleId: number;
  /** 用户id */
  userId: number;
}

/**
 * 删除协作者请求参数
 */
export interface DeleteProjectUserRequest {
  /** 成员id列表（取项目详情接口的teamUserInfoList.memberId） */
  ids: number[];
}

/**
 * 修改项目用户请求参数
 */
export interface EditProjectUserRequest {
  /** 成员id */
  memberId: number;
  /** 角色id */
  roleId: number;
}
