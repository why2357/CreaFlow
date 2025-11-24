import { useProjectStore } from '@/store/modules/project';

/**
 * 检查是否拥有指定的项目权限（满足任意一个即可）
 * @param permissions 权限数组
 * @returns 是否拥有权限
 */
export function hasProjectPermission(permissions: string[]): boolean {
  const projectStore = useProjectStore();
  const projectPermissions = projectStore.projectPermissions;

  if (!permissions || permissions.length === 0) {
    return false;
  }

  return projectPermissions.some((permi) => permissions.includes(permi));
}

/**
 * 检查是否拥有指定的所有项目权限
 * @param permissions 权限数组
 * @returns 是否拥有所有权限
 */
export function hasAllProjectPermissions(permissions: string[]): boolean {
  const projectStore = useProjectStore();
  const projectPermissions = projectStore.projectPermissions;

  if (!permissions || permissions.length === 0) {
    return false;
  }

  return permissions.every((permi) => projectPermissions.includes(permi));
}

/**
 * 检查是否拥有项目权限（OR 逻辑，满足任意一个即可）
 * @param permissions 权限数组
 * @returns 是否拥有权限
 */
export function hasProjectPermiOr(permissions: string[]): boolean {
  return hasProjectPermission(permissions);
}

/**
 * 检查是否拥有项目权限（AND 逻辑，必须满足所有）
 * @param permissions 权限数组
 * @returns 是否拥有所有权限
 */
export function hasProjectPermiAnd(permissions: string[]): boolean {
  return hasAllProjectPermissions(permissions);
}
