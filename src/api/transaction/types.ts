/**
 * 流水记录查询参数
 */
export interface TransactionQuery {
  /**
   * 结束时间 yyyy-MM-dd
   */
  endTime?: string;
  /**
   * 排序的方向desc或者asc
   */
  isAsc?: string;
  /**
   * 用户名昵称
   */
  nickName?: string;
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
   * 手机号
   */
  phoneNumber?: string;
  /**
   * 项目id 使用场景
   */
  projectIdList?: number[];
  /**
   * 项目名称（使用场景）用于搜索
   */
  projectName?: string;
  /**
   * 开始时间 yyyy-MM-dd
   */
  startTime?: string;
  /**
   * 流水名称
   */
  transName?: string;
  /**
   * 流水类型 1-支出 2-返还
   */
  transType?: number;
  /**
   * 使用人
   */
  transUserId?: number;
  /**
   * 流水id
   */
  walletTransactionId?: number;
}

/**
 * 流水记录响应数据
 */
export interface TransactionVO {
  /**
   * 创建时间
   */
  createTime?: string;
  /**
   * 集数id
   */
  episodeId?: number;
  /**
   * 使用人昵称
   */
  nickName?: string;
  /**
   * 扣点流水id
   */
  parentId?: number;
  /**
   * 使用人手机号
   */
  phoneNumber?: string;
  /**
   * 点数
   */
  pointsCost?: number;
  /**
   * 项目id
   */
  projectId?: number;
  /**
   * 使用场景
   */
  projectName?: string;
  /**
   * 流水名称
   */
  transName?: string;
  /**
   * 流水类型 1-支出 2-返还
   */
  transType?: number;
  /**
   * 使用人
   */
  transUserId?: number;
  /**
   * 钱包id
   */
  walletId?: number;
  /**
   * 流水id
   */
  walletTransactionId?: number;
}

/**
 * 钱包类型响应数据
 */
export interface WalletTypeVO {
  /**
   * 类型编码
   */
  code: number;
  /**
   * 模型编码
   */
  modelCode: string;
  /**
   * 描述
   */
  desc: string;
}
