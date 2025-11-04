/**
 * 用户个人信息
 */
export interface UserProfileVO {
  nickName: string;
  deptDesc: string;
}

/**
 * 修改用户个人信息请求参数
 */
export interface UserProfileUpdateForm {
  nickName?: string;
  deptDesc?: string;
}
