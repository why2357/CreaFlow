/**
 * 项目数据查询参数
 */
export interface ProjectDataQuery {
  /**
   * 剧集id
   */
  episodeId: number;
  /**
   * 排序的方向desc或者asc
   */
  isAsc?: string;
  /**
   * 排序列
   */
  orderByColumn?: string;
  /**
   * 当前页数
   */
  pageNum?: number;
  /**
   * 分页大小
   */
  pageSize?: number;
  /**
   * 项目id
   */
  projectId: number;
  /**
   * 项目人员id
   */
  userId?: number;
}

/**
 * 项目数据进度查询参数
 */
export interface ProjectDataProgressQuery {
  /**
   * 剧集id
   */
  episodeId: number;
  /**
   * 项目id
   */
  projectId: number;
  /**
   * 项目人员id
   */
  userId?: number;
}

/**
 * 项目数据响应数据
 */
export interface ProjectDataVO {
  /**
   * 累计消耗点数
   */
  consumePoint?: number;
  /**
   * 消耗时间
   */
  consumeTime?: string;
  /**
   * 生成图片次数
   */
  genImgCnt?: number;
  /**
   * 生成视频次数
   */
  genVideoCnt?: number;
  /**
   * 用户昵称
   */
  nickName?: string;
  /**
   * 手机号码
   */
  phonenumber?: string;
  /**
   * 用户ID
   */
  userId?: number;
  /**
   * 用户账号
   */
  userName?: string;
  /**
   * 有效图片数量
   */
  validImgCnt?: number;
  /**
   * 有效视频数量
   */
  validVideoCnt?: number;
}

/**
 * 项目数据进度响应数据
 */
export interface ProjectDataProgressVO {
  /**
   * 图片审核完成数量
   */
  approvalImgCount?: number;
  /**
   * 视频审核完成数量
   */
  approvalVideoCount?: number;
  /**
   * 本集消耗点数
   */
  episodeConsumePoints?: number;
  /**
   * 剧本是否完成
   */
  hasScript?: boolean;
  /**
   * 累计消耗点数（项目级别）
   */
  projectConsumePoints?: number;
  /**
   * 图片总数量
   */
  totalImgCount?: number;
  /**
   * 视频总数量
   */
  totalVideoCount?: number;
}
