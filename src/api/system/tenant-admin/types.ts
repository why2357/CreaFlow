/**
 * 租户管理相关类型定义
 */

// ============= 请求参数类型 =============

/**
 * 新增租户请求参数
 */
export interface TenantAddBo {
  phoneNumber?: string;
  tenantName: string;
}

/**
 * 更新租户状态请求参数
 */
export interface TenantUpdateStatusBo {
  id: number;
  status: number; // 0-启用 1-禁用
}

/**
 * 添加管理员请求参数
 */
export interface TenantAddPMBo {
  id: number;
  phoneNumber: string;
}

/**
 * 删除管理员请求参数
 */
export interface TenantDeleteAdminBo {
  userId: number;
}

/**
 * 查询租户列表请求参数
 */
export interface TenantListQuery {
  pageNum?: number;
  pageSize?: number;
  tenantName?: string;
  status?: number;
}

/**
 * 分配点数请求参数
 */
export interface PointsAllocateRequestDto {
  amount: number;
  currency: string; // 人民币-CNY 美元-USD 欧元-EUR
  points: number;
  rechargeFrom: number; // 充值来源 1-系统发放
  rechargeType: number; // 充值类型 1-发放 2-扣减
  tenantId: string;
}

/**
 * 点数记录查询参数
 */
export interface WalletRechargeListQuery {
  pageNum?: number;
  pageSize?: number;
  tenantId?: string;
  rechargeType?: number;
}

// ============= 响应数据类型 =============

/**
 * 系统用户信息
 */
export interface SysUser {
  userId?: number;
  userName?: string;
  nickName?: string;
  phonenumber?: string;
  email?: string;
  avatar?: string;
  status?: number;
  delFlag?: number;
  loginIp?: string;
  loginDate?: Date;
  createBy?: string;
  createTime?: Date;
  updateBy?: string;
  updateTime?: Date;
  remark?: string;
  deptId?: number;
  roleId?: number;
  tenantId?: string;
  userType?: string;
  userTypeCode?: number; // 1-管理员 2-运营 3-普通客户
}

/**
 * 租户钱包信息视图对象
 */
export interface SysTenantWalletVo {
  id?: number;
  tenantId?: string;
  tenantName?: string;
  phone?: string;
  status?: number; // 0-启用 1-禁用
  pointsAvailable?: number; // 剩余积分
  pointsTotal?: number; // 总积分
  amount?: number; // 累计盈收
  pmUserList?: SysUser[]; // 管理员列表
  createTime?: Date;
}

/**
 * 钱包充值记录视图对象
 */
export interface SysWalletRechargeVo {
  id?: number;
  walletId?: number;
  tenantId?: string;
  tenantName?: string;
  rechargeType?: number; // 1-发放 2-扣减
  rechargeFrom?: number; // 1-系统发放
  amount?: number;
  points?: number;
  currency?: string;
  status?: number;
  createTime?: Date;
}
