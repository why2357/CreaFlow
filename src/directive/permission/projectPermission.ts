import { Directive, DirectiveBinding } from 'vue';
import { useProjectStore } from '@/store/modules/project';

/**
 * 检查项目权限
 */
function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const { projectPermissions } = useProjectStore();
  const { value } = binding;

  if (value && value instanceof Array && value.length > 0) {
    // 检查是否拥有任意一个权限
    const hasPermission = projectPermissions.some((permi) => {
      return value.includes(permi);
    });

    if (!hasPermission) {
      // 没有权限，隐藏元素（使用 display: none 而不是移除）
      el.style.display = 'none';
    } else {
      // 有权限，显示元素
      el.style.display = '';
    }
  } else {
    throw new Error("check project perms! Like v-has-project-permi=\"['member-add','member-delete']\"");
  }
}

/**
 * 项目级权限处理指令
 * 用于控制项目内的按钮、元素权限
 *
 * 使用方式：
 * v-has-project-permi="['member-add']"
 * v-has-project-permi="['member-add', 'member-delete']"
 */
export const hasProjectPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding);
  }
};
