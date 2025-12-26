import usePermissionStore from '@/store/modules/permission';
import useSettingsStore from '@/store/modules/settings';
import useUserStore from '@/store/modules/user';
import { getToken } from '@/utils/auth';
import { isRelogin } from '@/utils/request';
import { isHttp } from '@/utils/validate';
import { to as tos } from 'await-to-js';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import router from './router';
NProgress.configure({ showSpinner: false });
const whiteList = ['', '/', '/home', '/login', '/update', '/register', '/social-callback'];

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  if (getToken()) {
    to.meta.title && useSettingsStore().setTitle(to.meta.title as string);
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' });
      NProgress.done();
    } else if (whiteList.indexOf(to.path) !== -1) {
      next();
    } else {
      if (useUserStore().nickname.length === 0) {
        isRelogin.show = true;
        // 判断当前用户是否已拉取完user_info信息
        const [err] = await tos(useUserStore().getInfo());
        if (err) {
          await useUserStore().logout();
          ElMessage.error(err);
          next({ path: '/' });
        } else {
          isRelogin.show = false;
          const accessRoutes = await usePermissionStore().generateRoutes();
          // 根据roles权限生成可访问的路由表
          accessRoutes.forEach((route) => {
            if (!isHttp(route.path)) {
              router.addRoute(route); // 动态添加可访问路由表
            }
          });

          // 特殊处理：当用户访问 /index 但没有首页权限时，重定向到第一个可访问路由
          // 注意：/home 是官网页面，无需权限检查，直接放行
          if ((to.path === '/' || to.path === '/index') && accessRoutes.length > 0) {
            // 检查用户是否有权限访问 /index
            const hasHomeAccess = accessRoutes.some((route) => {
              if (route.path === '/index') return true;
              if (route.children) {
                return route.children.some((child) => child.path === '/index');
              }
              return false;
            });

            // 如果没有首页访问权限，重定向到第一个可访问的路由
            if (!hasHomeAccess) {
              // 查找第一个可访问的非隐藏路由
              const firstAccessibleRoute = accessRoutes.find((route) => {
                if (route.children && route.children.length > 0) {
                  return route.children.find((child) => !child.hidden);
                }
                return !route.hidden;
              });

              if (firstAccessibleRoute) {
                // 如果有子路由，使用第一个非隐藏的子路由
                if (firstAccessibleRoute.children && firstAccessibleRoute.children.length > 0) {
                  const firstChild = firstAccessibleRoute.children.find((child) => !child.hidden);
                  if (firstChild && firstChild.path) {
                    next({ path: firstChild.path, replace: true });
                    return;
                  }
                }
                // 否则使用父路由的路径
                if (firstAccessibleRoute.path) {
                  next({ path: firstAccessibleRoute.path, replace: true });
                  return;
                }
              }
            }
          }

          next({ ...to, replace: true }); // hack方法 确保addRoutes已完成
        }
      } else {
        next();
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next();
    } else {
      next(`/home`); // 否则全部重定向到登录页
      // next(`/login?redirect=${to.fullPath}`); // 否则全部重定向到登录页
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
