export interface PreSignUrlReq {
  // 文件后缀
  fileSuffix: string;
  // 原文件名
  originalFileName: string;
  // 文件类型
  fileType: string;
  // 文件MD5（某些情况下需要）
  fileMd5?: string;
}
export interface PreSignUrlRes {
  // 文件名称
  fileName: string;
  // 授权url
  presignedUrl: string;
  // 原文件名
  originalFileName: string;
  // 服务商
  service: string;
  // 传输类型：4-文件已存在（秒传）
  transferType?: number;
  // 文件URL（秒传时返回）
  url?: string;
  // OSS URL（秒传时返回，优先使用）
  ossUrl?: string;
  // OSS ID（秒传时返回）
  ossId?: string;
}

export interface UploadByUrlReq {
  uploadUrl: string;
  file: any;
  // 将入参传的id原数据返回
  id?: string | number;
}

export interface ReportReq {
  // 原文件名 - getPreSignUrl 接口的出参
  originalFileName: string;
  // 文件名称 - getPreSignUrl 接口的出参
  fileName: string;
  // 服务商 - getPreSignUrl 接口的出参
  service: string;
  // 文件后缀 例如.zip
  fileSuffix: string;
  // 文件大小，单位kb
  size: number;
  // 时长，单位 毫秒,只有视频上传需要传
  time?: number;
  fileMd5?: string;
  // 所属资源类型：1-公共资源 2-用户资源 3-静态资源
  resourceType?: number;
  /**
   * 是否需要同步 1-是 0-否
   */
  needSync?: number;
}
export interface ReportRes {
  // URL地址
  url: string;
  // 文件名
  fileName: string;
  // 对象存储主键
  ossId: string;
  // 原文件名
  originalFileName: string;
  // 文件大小，单位kb
  size: number;
  // 时长，单位 毫秒,只有视频上传需要传
  time?: number;
  // 将入参传的id原数据返回
  id?: string | number;
  fileMd5?: string;
  // 上传视频的封面图
  poster?: string;
  // 文件后缀
  suffix?: string;
}

export interface UploadReq extends PreSignUrlReq {
  file: any;
  requiredTime?: boolean;
  // 是否需要获取封面图
  requiredPoster?: boolean;
  requiredMd5?: boolean;
  duration?: number;
  // 所属资源类型：1-公共资源 2-用户资源
  resourceType?: number;
  // 用来区分上传数据，上传方法出参也要返回这个参数
  id?: string | number;
  /**
   * 是否需要同步 1-是 0-否
   */
  needSync?: number;
  fileMd5?: string;
}

export enum UpStatus {
  ToUpload = 'ToUpload',
  Success = 'Success',
  Fail = 'Fail'
}
export interface UpListItem {
  status: UpStatus;
  name: string;
  size: number; // (单位mb),
  percent: number;
}
export interface UploadState {
  uploading: boolean;
  upList: UpListItem[];
}
