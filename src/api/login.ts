import { UserInfo } from '@/api/system/user/types';
import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { LoginData, LoginResult, TenantInfo, VerifyCodeResult } from './types';

// pc端固定客户端授权id
const clientId = import.meta.env.VITE_APP_CLIENT_ID;

/**
 * @param data {LoginData}
 * @returns
 */
export function login(data: LoginData): AxiosPromise<LoginResult> {
  return request({
    url: '/hivision/login',
    headers: {
      isToken: false
      // isEncrypt: true
    },
    method: 'post',
    data
  });
}

// 注册方法
export function register(data: any) {
  const params = {
    ...data,
    clientId: clientId,
    grantType: 'password'
  };
  return request({
    url: '/auth/register',
    headers: {
      isToken: false,
      isEncrypt: true
    },
    method: 'post',
    data: params
  });
}

/**
 * 注销
 */
export function logout() {
  return request({
    url: '/hivision/logout',
    method: 'post'
  });
}

/**
 * 获取验证码
 */
export function getCodeImg(): AxiosPromise<VerifyCodeResult> {
  return request({
    url: '/auth/code',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  });
}
/**
 * 获取短信验证码
 */
export function sendPhoneCode(params: { phoneNumber: string }): AxiosPromise<{
  code: number;
  msg: string;
  data: any;
}> {
  return request({
    url: `/hivision/code`,
    params,
    method: 'get'
  });
}

/**
 * 第三方登录
 */
export function callback(data: LoginData): AxiosPromise<any> {
  const LoginData = {
    ...data,
    clientId: clientId,
    grantType: 'social'
  };
  return request({
    url: '/auth/social/callback',
    method: 'post',
    data: LoginData
  });
}

// 获取用户详细信息
export function getInfo(): AxiosPromise<UserInfo> {
  return request({
    url: '/hivision/getInfo',
    method: 'get'
  });
}

// 获取租户列表
export function getTenantList(): AxiosPromise<TenantInfo> {
  return request({
    url: '/auth/tenant/list',
    headers: {
      isToken: false
    },
    method: 'get'
  });
}

/**
 * 获取平台服务版本号
 */
export function getVersion() {
  return request({
    url: '/auth/version',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  });
}

/**
 * 生成二维码登录key
 */
export function generateQrcodeKey(): AxiosPromise<{
  code: number;
  msg: string;
  data: {
    qrcodeKey: string;
    qrcodeUrl: string;
    expireTime: number;
  };
}> {
  return request({
    url: '/hivision/qrcode/generate',
    headers: {
      isToken: false
    },
    method: 'post'
  });
}

/**
 * 检查二维码扫码状态
 */
export function checkQrcodeStatus(qrcodeKey: string): AxiosPromise<{
  code: number;
  msg: string;
  data: {
    status: 'waiting' | 'scanned' | 'confirmed' | 'expired';
    needBindPhone?: boolean;
    token?: string;
    userInfo?: any;
  };
}> {
  return request({
    url: '/hivision/qrcode/check',
    headers: {
      isToken: false
    },
    method: 'get',
    params: { qrcodeKey }
  });
}

/**
 * 绑定手机号（首次扫码登录）
 */
export function bindPhoneForQrcode(data: {
  qrcodeKey: string;
  phoneNumber: string;
  smsCode: string;
}): AxiosPromise<LoginResult> {
  return request({
    url: '/hivision/qrcode/bind-phone',
    headers: {
      isToken: false
    },
    method: 'post',
    data
  });
}
