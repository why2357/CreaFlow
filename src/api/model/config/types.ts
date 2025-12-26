/**
 * 项目模型查询参数
 */
export interface ModelConfigQueryParams {
  /**
   * 渠道 1-link 2-官方
   */
  channel?: number;
  /**
   * 排序的方向desc或者asc
   */
  isAsc?: string;
  /**
   * 模型码
   */
  modelCode?: string;
  /**
   * 模型名称
   */
  modelName?: string;
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
   * PAI模型码
   */
  paiCode?: string;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
  [property: string]: any;
}

/**
 * 项目模型视图对象 hivision_project_model
 */
export interface HivisionProjectModelVo {
  /**
   * 渠道 1-link 2-官方
   */
  channel: number;
  /**
   * 创建时间
   */
  createTime?: string;
  /**
   * 主键
   */
  id: number;
  /**
   * 模型码
   */
  modelCode: string;
  /**
   * 模型名称
   */
  modelName: string;
  /**
   * PAI模型码
   */
  paiCode: string;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status: number;
}

/**
 * 项目模型更新业务对象
 */
export interface ModelConfigUpdateParams {
  /**
   * 渠道 1-link 2-官方
   */
  channel?: number;
  /**
   * 主键
   */
  id: number;
  /**
   * 模型名称
   */
  modelName?: string;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
  [property: string]: any;
}
