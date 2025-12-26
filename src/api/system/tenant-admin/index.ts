/**
 * 租户管理API接口
 */
import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type {
  PointsAllocateRequestDto,
  SysTenantWalletVo,
  SysWalletRechargeVo,
  TenantAddBo,
  TenantAddPMBo,
  TenantDeleteAdminBo,
  TenantListQuery,
  TenantUpdateStatusBo,
  WalletRechargeListQuery
} from './types';

/**
 * 新增租户
 */
export function addTenant(data: TenantAddBo) {
  return request({
    url: '/hivision/system/tenant/add-tenant',
    method: 'post',
    data
  });
}

/**
 * 更新租户状态（冻结/解冻）
 */
export function updateTenantStatus(data: TenantUpdateStatusBo) {
  return request({
    url: '/hivision/system/tenant/update-status',
    method: 'post',
    data
  });
}

/**
 * 添加管理员
 */
export function addPM(data: TenantAddPMBo) {
  return request({
    url: '/hivision/system/tenant/add-pm',
    method: 'post',
    data
  });
}

/**
 * 删除管理员（降级为普通客户）
 */
export function deletePM(data: TenantDeleteAdminBo) {
  return request({
    url: '/hivision/system/tenant/delete-pm',
    method: 'post',
    data
  });
}

/**
 * 查询租户列表
 */
export function getTenantList(params?: TenantListQuery): AxiosPromise<SysTenantWalletVo[]> {
  return request({
    url: '/hivision/system/tenant/list',
    method: 'get',
    params
  });
}

/**
 * 分配点数
 */
export function allocatePoints(data: PointsAllocateRequestDto) {
  return request({
    url: '/hivision/wallet-recharge/allocate',
    method: 'post',
    data
  });
}

/**
 * 获取点数记录
 */
export function getRechargeList(params?: WalletRechargeListQuery): AxiosPromise<SysWalletRechargeVo[]> {
  return request({
    url: '/hivision/wallet-recharge/list',
    method: 'get',
    params
  });
}
