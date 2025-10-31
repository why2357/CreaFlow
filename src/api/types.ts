/**
 * 注册
 */
export type RegisterForm = {
  tenantId: string;
  username: string;
  password: string;
  confirmPassword?: string;
  code?: string;
  uuid?: string;
  userType?: string;
};

/**
 * 登录请求
 */
export interface LoginData {
  companyName?: string;
  tenantId?: string;
  username?: string;
  password?: string;
  rememberMe?: boolean;
  socialCode?: string;
  socialState?: string;
  source?: string;
  code?: string;
  uuid?: string;
  clientId?: string;
  /**
   * wechat   微信登录
   * phonePassword  手机号密码登录(本次新增)
   */
  grantType?: string;
  /**
   * 手机号 (短信登录使用)
   */
  phonenumber?: string;
  /**
   * 手机号 (新接口标准字段)
   */
  phoneNumber?: string;
  /**
   * 短信code
   */
  smsCode?: string;
  xtoken?: string;
  phone?: string;
}

/**
 * 登录响应
 */
export interface LoginResult {
  token: string;
  user: any;
}

/**
 * 验证码返回
 */
export interface VerifyCodeResult {
  captchaEnabled: boolean;
  uuid?: string;
  img?: string;
}
export interface PresetsInfoRes {
  /**
   * 是否需要修改公司名称
   */
  companyFlag?: boolean;
  /**
   * 是否需要修改密码名称
   */
  passwordFlag?: boolean;
  /**
   * 租户编号
   */
  tenantId?: string;
  /**
   * 手机号
   */
  phoneNumber?: string;
  companyName?: string;
  userId?: string;
}
/**
 * 租户
 */
export interface TenantVO {
  companyName: string;
  domain: any;
  tenantId: string;
}

export interface TenantInfo {
  tenantEnabled: boolean;
  voList: TenantVO[];
}
