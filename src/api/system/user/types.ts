import { PostVO } from '@/api/system/post/types';
import { RoleVO } from '@/api/system/role/types';
import { DeptVO } from './../dept/types';

/**
 * 用户信息
 */
export interface UserInfo {
  user: UserVO;
  roles: RoleVO[];
  permissions: string[];
}

/**
 * 用户查询对象类型
 */
export interface UserQuery extends PageQuery {
  userName?: string;
  phonenumber?: string;
  status?: string;
  deptId?: string | number;
  roleId?: string | number;
}

/**
 * 用户返回对象
 */
export interface UserVO extends BaseEntity {
  userId: string | number;
  deptId: number;
  roles: string[];
  userName: string;
  nickName: string;
  userType: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  pubKey: string;
  status: string;
  delFlag: string;
  loginIp: string;
  loginDate: string;
  remark: string;
  dept: DeptVO;
  roleIds: any;
  postIds: any;
  roleId: any;
  admin: boolean;
}

/**
 * 用户表单类型
 */
export interface UserForm {
  id?: string;
  userId?: string;
  deptId?: number;
  userName: string;
  nickName?: string;
  password: string;
  pubKey: string;
  phonenumber?: string;
  email?: string;
  sex?: string;
  status: string;
  remark?: string;
  postIds: string[];
  roleIds: string[];
}

export interface UserInfoVO {
  user: UserVO;
  roles: RoleVO[];
  roleIds: string[];
  posts: PostVO[];
  postIds: string[];
  roleGroup: string;
  postGroup: string;
}

export interface ResetPwdForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 成员查询对象类型
 */
export interface MemberQuery extends PageQuery {
  createDateEnd?: string;
  createDateStart?: string;
  isAsc?: string;
  nickName?: string;
  orderByColumn?: string;
  phoneNumber?: string;
  tenantId?: string;
  userId?: number;
  userName?: string;
  userTypeCode?: number;
}

/**
 * 成员返回对象
 */
export interface MemberVO {
  avatar?: string;
  consumePoint?: number;
  createBy?: string;
  createTime?: Date;
  deptId?: number;
  email?: string;
  loginDate?: Date;
  loginIp?: string;
  nickName?: string;
  phonenumber?: string;
  remark?: string;
  sex?: string;
  status?: number;
  tenantId?: string;
  updateBy?: string;
  updateTime?: Date;
  userId?: number;
  userName?: string;
  userType?: string;
  userTypeCode?: number;
}

/**
 * 新增成员请求参数
 */
export interface MemberAddBo {
  phoneNumber: string;
}

/**
 * 成员点数使用统计请求参数
 */
export interface MemberPointsStatBo {
  /** 结束统计时间 */
  endStatTime: string;
  /** 开始统计时间 */
  startStatTime: string;
  /** 统计类型（1.时间 2.模型）*/
  statType: number;
  /** 时间类型（1.日统计 2.周统计 3.月统计）*/
  timeType?: number;
  /** 用户id */
  userId: number;
}

/**
 * 点数使用报表视图对象
 */
export interface HivisionPointsReportVo {
  /** 维度名称 */
  dimensionName?: string;
  /** 展示日期 */
  displayDate?: string;
  /** 主键 */
  id?: number;
  /** 月 */
  month?: number;
  /** 使用的点数 */
  points?: number;
  /** 租户id */
  tenantId?: string;
  /** 时间类型（1.日 2.周 3.月）*/
  timeType?: number;
  /** 用户id */
  userId?: number;
  /** 年 */
  year?: number;
}
