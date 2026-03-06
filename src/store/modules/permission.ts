import { getRouters } from '@/api/menu';
import ParentView from '@/components/ParentView/index.vue';
import InnerLink from '@/layout/components/InnerLink/index.vue';
import Layout from '@/layout/index.vue';
import auth from '@/plugins/auth';
import router, { constantRoutes, dynamicRoutes } from '@/router';
import store from '@/store';
import { defineStore } from 'pinia';
import { RouteOption } from 'vue-router';
// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue');

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteOption[]>([]);
  const addRoutes = ref<RouteOption[]>([]);
  const defaultRoutes = ref<RouteOption[]>([]);
  const topbarRouters = ref<RouteOption[]>([]);
  const sidebarRouters = ref<RouteOption[]>([]);

  // 静态菜单配置 - 这些菜单将始终显示在侧边栏
  const staticMenus = ref<RouteOption[]>([
    {
      path: '',
      component: Layout,
      redirect: '/index',
      children: [
        {
          path: '/index',
          component: () => import('@/views/workbench/project-admin/index.vue'),
          name: 'Index',
          meta: { title: '首页', icon: 'dashboard', affix: true }
        }
      ]
    }
  ]);

  const setRoutes = (newRoutes: RouteOption[]): void => {
    addRoutes.value = newRoutes;
    routes.value = constantRoutes.concat(newRoutes);
  };
  const setDefaultRoutes = (routes: RouteOption[]): void => {
    defaultRoutes.value = constantRoutes.concat(routes);
  };
  const setTopbarRoutes = (routes: RouteOption[]): void => {
    topbarRouters.value = routes;
  };
  const setSidebarRouters = (routes: RouteOption[]): void => {
    // 合并静态菜单和动态菜单
    const mergedRoutes = [...staticMenus.value, ...routes];
    sidebarRouters.value = mergedRoutes;
  };

  const generateRoutes = async (): Promise<RouteOption[]> => {
    const res = await getRouters();
    const { data } = res;

    const sdata = JSON.parse(JSON.stringify(data));
    const rdata = JSON.parse(JSON.stringify(data));
    const defaultData = JSON.parse(JSON.stringify(data));

    const sidebarRoutes = filterAsyncRouter(sdata);

    const rewriteRoutes = filterAsyncRouter(rdata, undefined, true);

    const defaultRoutes = filterAsyncRouter(defaultData);
    const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
    asyncRoutes.forEach((route) => {
      router.addRoute(route);
    });

    // 合并静态菜单和动态路由
    const allRoutes = [...staticMenus.value, ...rewriteRoutes];

    // 将合并后的路由添加到 router（包含静态菜单和动态路由）
    allRoutes.forEach((route) => {
      router.addRoute(route);
    });

    setRoutes(allRoutes);
    // 合并静态菜单、常量路由和动态路由
    setSidebarRouters(constantRoutes.concat(sidebarRoutes));
    setDefaultRoutes(sidebarRoutes);
    setTopbarRoutes(defaultRoutes);
    return new Promise<RouteOption[]>((resolve) => resolve(allRoutes));
  };

  /**
   * 遍历后台传来的路由字符串，转换为组件对象
   * @param asyncRouterMap 后台传来的路由字符串
   * @param lastRouter 上一级路由
   * @param type 是否是重写路由
   */
  const filterAsyncRouter = (asyncRouterMap: RouteOption[], lastRouter?: RouteOption, type = false): RouteOption[] => {
    return asyncRouterMap.filter((route) => {
      if (type && route.children) {
        route.children = filterChildren(route.children, undefined);
      }
      if (route.component) {
        const originalComponent = route.component;
        // Layout ParentView 组件特殊处理
        if (route.component === 'Layout') {
          route.component = Layout;
        } else if (route.component === 'ParentView') {
          route.component = ParentView;
        } else if (route.component === 'InnerLink') {
          route.component = InnerLink;
        } else {
          route.component = loadView(route.component);
          if (!route.component) {
            console.error(`[filterAsyncRouter] 路由 ${route.path} 的组件 ${originalComponent} 加载失败`);
          }
        }
      } else {
        console.warn(`[filterAsyncRouter] 路由 ${route.path} 缺少 component 属性`);
      }
      if (route.children != null && route.children && route.children.length) {
        route.children = filterAsyncRouter(route.children, route, type);
      } else {
        delete route.children;
        delete route.redirect;
      }
      return true;
    });
  };
  const filterChildren = (childrenMap: RouteOption[], lastRouter?: RouteOption): RouteOption[] => {
    let children: RouteOption[] = [];
    childrenMap.forEach((el) => {
      if (el.children && el.children.length) {
        if (el.component === 'ParentView' && !lastRouter) {
          el.children.forEach((c) => {
            c.path = el.path + '/' + c.path;
            if (c.children && c.children.length) {
              children = children.concat(filterChildren(c.children, c));
              return;
            }
            children.push(c);
          });
          return;
        }
      }
      if (lastRouter) {
        el.path = lastRouter.path + '/' + el.path;
        if (el.children && el.children.length) {
          children = children.concat(filterChildren(el.children, el));
          return;
        }
      }
      children = children.concat(el);
    });
    return children;
  };
  // 初始化静态菜单
  const initStaticMenus = (): void => {
    setSidebarRouters([]);
  };

  return {
    routes,
    setRoutes,
    generateRoutes,
    setSidebarRouters,
    topbarRouters,
    sidebarRouters,
    defaultRoutes,
    staticMenus,
    initStaticMenus
  };
});

// 动态路由遍历，验证是否具备权限
export const filterDynamicRoutes = (routes: RouteOption[]) => {
  const res: RouteOption[] = [];
  routes.forEach((route) => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route);
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route);
      }
    }
  });
  return res;
};

export const loadView = (view: any) => {
  let res;

  // 标准化视图路径：移除开头的 'views/' 和结尾的 '.vue'
  let normalizedView = view;
  if (normalizedView.startsWith('views/')) {
    normalizedView = normalizedView.replace('views/', '');
  }
  if (normalizedView.endsWith('.vue')) {
    normalizedView = normalizedView.replace('.vue', '');
  }

  for (const path in modules) {
    // 从模块路径中提取相对于 views 目录的路径
    const dir = path.split('views/')[1]?.split('.vue')[0];
    if (dir === normalizedView) {
      res = () => modules[path]();
      break;
    }
  }

  // 如果找不到对应的组件，输出警告信息
  if (!res) {
    console.warn(`[loadView] 无法找到组件: ${view} (标准化后: ${normalizedView})`);
  }

  return res;
};

// 非setup
export const usePermissionStoreHook = () => {
  return usePermissionStore(store);
};

export default usePermissionStore;
