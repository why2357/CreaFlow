import { getInfo as getUserInfo, login as loginApi, logout as logoutApi } from '@/api/login';
import { LoginData } from '@/api/types';
import { getWalletPoints } from '@/api/system/userCenter';
import defAva from '@/assets/images/profile.jpg';
import store from '@/store';
import { getToken, removeToken, setToken } from '@/utils/auth';
import { to } from 'await-to-js';

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken());
  const name = ref('');
  const nickname = ref('');
  const userId = ref<string | number>('');
  const avatar = ref('');
  const roles = ref<Array<string>>([]); // 用户角色编码集合 → 判断路由权限
  const permissions = ref<Array<string>>([]); // 用户权限编码集合 → 判断按钮权限
  const walletPoints = ref<number>(0); // 用户钱包积分

  /**
   * 登录
   * @param userInfo
   * @returns
   */
  const login = async (userInfo: LoginData): Promise<void> => {
    const [err, res] = await to(loginApi(userInfo));
    if (res) {
      const data = res.data;
      setToken(data.token);
      token.value = data.token;
      return Promise.resolve();
    }
    return Promise.reject(err);
  };

  // 获取用户信息
  const getInfo = async (): Promise<void> => {
    const [err, res] = await to(getUserInfo());
    if (res) {
      console.log('res', res);

      const data = res.data;
      const user = data.user;
      const profile = user.avatar == '' || user.avatar == null ? defAva : user.avatar;

      // 处理角色和权限
      // 如果后端返回的 roles 为空数组或不存在，设置默认角色
      if (user.roles && user.roles.length > 0) {
        roles.value = user.roles;
      } else {
        // 设置默认角色，确保用户可以正常访问系统
        roles.value = ['ROLE_DEFAULT'];
      }

      // 处理权限
      if (data.permissions && data.permissions.length > 0) {
        permissions.value = data.permissions;
      } else {
        // 如果没有权限，设置为空数组
        permissions.value = [];
      }

      name.value = user.userName;
      nickname.value = user.nickName;
      avatar.value = profile;
      userId.value = user.userId;
      return Promise.resolve();
    }
    return Promise.reject(err);
  };

  // 注销
  const logout = async (): Promise<void> => {
    await logoutApi();
    token.value = '';
    roles.value = [];
    permissions.value = [];
    removeToken();
  };

  const setAvatar = (value: string) => {
    avatar.value = value;
  };

  // 更新钱包积分
  const updateWalletPoints = async (): Promise<void> => {
    try {
      const res = await getWalletPoints();
      walletPoints.value = res.data || 0;
    } catch (error) {
      console.error('获取钱包积分失败:', error);
    }
  };

  return {
    userId,
    token,
    nickname,
    avatar,
    roles,
    permissions,
    walletPoints,
    login,
    getInfo,
    logout,
    setAvatar,
    updateWalletPoints
  };
});

export default useUserStore;
// 非setup
export function useUserStoreHook() {
  return useUserStore(store);
}
