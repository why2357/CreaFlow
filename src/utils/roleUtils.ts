import { RoleKey } from '@/api/workbench/project/types';

/**
 * 角色显示信息映射
 */
interface RoleDisplayInfo {
  name: string; // 角色全称
  shortName: string; // 角色简称（用于头像）
  color: string; // 角色颜色
  bgColor?: string; // 背景颜色
  textColor?: string; // 文字颜色
}

/**
 * 角色ID到角色码(RoleKey)的映射
 * 需要与后端的角色ID保持一致
 */
const ROLE_ID_TO_KEY_MAP: Record<number, string> = {
  1: RoleKey.ADMIN, // 管理员
  2: RoleKey.OPERATOR, // 运营
  3: RoleKey.CUSTOMER, // 客户
  4: RoleKey.DIRECTOR, // 导演
  5: RoleKey.COMMISSIONER // 专员
};

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
    color: 'linear-gradient(180deg, #E8E9FF 0%, #F5F6FF 100%)',
    bgColor: 'linear-gradient(180deg, #E8E9FF 0%, #F5F6FF 100%)',
    textColor: '#5252FF'
  },
  [RoleKey.COMMISSIONER]: {
    name: '专员',
    shortName: '专',
    color: 'linear-gradient(180deg, #D5E8FF 0%, #F7F9FD 100%)',
    bgColor: 'linear-gradient(180deg, #D5E8FF 0%, #F7F9FD 100%)',
    textColor: '#4086FF'
  }
};

/**
 * 默认角色信息（降级方案）
 */
const DEFAULT_ROLE_INFO: RoleDisplayInfo = {
  name: '成员',
  shortName: '成',
  color: '#74b9ff',
  bgColor: '#F7F8FA',
  textColor: '#4E5969'
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

/**
 * 根据 roleKey 获取角色背景颜色
 * @param roleKey 角色码
 * @returns 背景颜色
 */
export function getRoleBgColor(roleKey?: string): string {
  if (!roleKey) return DEFAULT_ROLE_INFO.bgColor || '#F7F8FA';
  return ROLE_DISPLAY_MAP[roleKey]?.bgColor || DEFAULT_ROLE_INFO.bgColor || '#F7F8FA';
}

/**
 * 根据 roleKey 获取角色文字颜色
 * @param roleKey 角色码
 * @returns 文字颜色
 */
export function getRoleTextColor(roleKey?: string): string {
  if (!roleKey) return DEFAULT_ROLE_INFO.textColor || '#4E5969';
  return ROLE_DISPLAY_MAP[roleKey]?.textColor || DEFAULT_ROLE_INFO.textColor || '#4E5969';
}

// ==================== 基于 roleId 的工具函数 ====================

/**
 * 根据 roleId 获取角色码 (roleKey)
 * @param roleId 角色ID
 * @returns 角色码
 */
export function getRoleKeyById(roleId?: number | string): string | undefined {
  if (!roleId) return undefined;
  const id = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
  return ROLE_ID_TO_KEY_MAP[id];
}

/**
 * 根据 roleId 获取角色全称
 * @param roleId 角色ID
 * @returns 角色名称
 */
export function getRoleNameById(roleId?: number | string): string {
  const roleKey = getRoleKeyById(roleId);
  return getRoleName(roleKey);
}

/**
 * 根据 roleId 获取角色简称（用于头像显示）
 * @param roleId 角色ID
 * @returns 角色简称
 */
export function getRoleShortNameById(roleId?: number | string): string {
  const roleKey = getRoleKeyById(roleId);
  return getRoleShortName(roleKey);
}

/**
 * 根据 roleId 获取角色颜色
 * @param roleId 角色ID
 * @returns 角色颜色
 */
export function getRoleColorById(roleId?: number | string): string {
  const roleKey = getRoleKeyById(roleId);
  return getRoleColor(roleKey);
}

/**
 * 根据 roleId 获取角色背景颜色
 * @param roleId 角色ID
 * @returns 背景颜色
 */
export function getRoleBgColorById(roleId?: number | string): string {
  const roleKey = getRoleKeyById(roleId);
  return getRoleBgColor(roleKey);
}

/**
 * 根据 roleId 获取角色文字颜色
 * @param roleId 角色ID
 * @returns 文字颜色
 */
export function getRoleTextColorById(roleId?: number | string): string {
  const roleKey = getRoleKeyById(roleId);
  return getRoleTextColor(roleKey);
}

/**
 * 根据 roleId 获取完整的角色显示信息
 * @param roleId 角色ID
 * @returns 角色显示信息
 */
export function getRoleDisplayInfoById(roleId?: number | string): RoleDisplayInfo {
  const roleKey = getRoleKeyById(roleId);
  return getRoleDisplayInfo(roleKey);
}

/**
 * 根据 roleId 获取角色的 CSS 类名
 * @param roleId 角色ID
 * @returns CSS类名
 */
export function getRoleClassById(roleId?: number | string): string {
  const roleKey = getRoleKeyById(roleId);
  if (!roleKey) return '';

  const roleClassMap: Record<string, string> = {
    [RoleKey.DIRECTOR]: 'role-director',
    [RoleKey.COMMISSIONER]: 'role-specialist',
    [RoleKey.ADMIN]: 'role-admin',
    [RoleKey.OPERATOR]: 'role-operator',
    [RoleKey.CUSTOMER]: 'role-customer'
  };

  return roleClassMap[roleKey] || '';
}
