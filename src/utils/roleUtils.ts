import { RoleKey } from '@/api/workbench/project/types';

/**
 * 角色显示信息映射
 */
interface RoleDisplayInfo {
  name: string; // 角色全称
  shortName: string; // 角色简称（用于头像）
  color: string; // 角色颜色
}

/**
 * 角色码到显示信息的映射
 */
const ROLE_DISPLAY_MAP: Record<string, RoleDisplayInfo> = {
  [RoleKey.ADMIN]: {
    name: '管理员',
    shortName: '管',
    color: '#667eea'
  },
  [RoleKey.OPERATOR]: {
    name: '运营',
    shortName: '运',
    color: '#f093fb'
  },
  [RoleKey.CUSTOMER]: {
    name: '客户',
    shortName: '客',
    color: '#4facfe'
  },
  [RoleKey.DIRECTOR]: {
    name: '导演',
    shortName: '导',
    color: '#6c5ce7'
  },
  [RoleKey.COMMISSIONER]: {
    name: '专员',
    shortName: '专',
    color: '#7c6ef0'
  }
};

/**
 * 默认角色信息（降级方案）
 */
const DEFAULT_ROLE_INFO: RoleDisplayInfo = {
  name: '成员',
  shortName: '成',
  color: '#74b9ff'
};

/**
 * 根据 roleKey 获取角色全称
 * @param roleKey 角色码
 * @returns 角色名称
 */
export function getRoleName(roleKey?: string): string {
  if (!roleKey) return DEFAULT_ROLE_INFO.name;
  return ROLE_DISPLAY_MAP[roleKey]?.name || DEFAULT_ROLE_INFO.name;
}

/**
 * 根据 roleKey 获取角色简称（用于头像显示）
 * @param roleKey 角色码
 * @returns 角色简称
 */
export function getRoleShortName(roleKey?: string): string {
  if (!roleKey) return DEFAULT_ROLE_INFO.shortName;
  return ROLE_DISPLAY_MAP[roleKey]?.shortName || DEFAULT_ROLE_INFO.shortName;
}

/**
 * 根据 roleKey 获取角色颜色
 * @param roleKey 角色码
 * @returns 角色颜色
 */
export function getRoleColor(roleKey?: string): string {
  if (!roleKey) return DEFAULT_ROLE_INFO.color;
  return ROLE_DISPLAY_MAP[roleKey]?.color || DEFAULT_ROLE_INFO.color;
}

/**
 * 根据 roleKey 获取完整的角色显示信息
 * @param roleKey 角色码
 * @returns 角色显示信息
 */
export function getRoleDisplayInfo(roleKey?: string): RoleDisplayInfo {
  if (!roleKey) return DEFAULT_ROLE_INFO;
  return ROLE_DISPLAY_MAP[roleKey] || DEFAULT_ROLE_INFO;
}
