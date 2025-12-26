/**
 * 分页响应结构
 */
export interface PageResult<T> {
  /**
   * 数据列表
   */
  rows: T[];
  /**
   * 总数
   */
  total: number;
}

/**
 * 项目模型主表查询参数
 */
export interface ModelMainQueryParams {
  /**
   * 排序的方向desc或者asc
   */
  isAsc?: string;
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
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
}

/**
 * 项目模型视图对象 hivision_project_model
 */
export interface HivisionProjectModelVo {
  /**
   * 渠道 1-link 2-官方
   */
  channel?: number;
  /**
   * 创建时间
   */
  createTime?: Date;
  /**
   * 主键
   */
  id?: number;
  /**
   * 模型码
   */
  modelCode?: string;
  /**
   * 模型ID
   */
  modelId?: number;
  /**
   * 模型名称
   */
  modelName?: string;
  /**
   * PAI模型码
   */
  paiCode?: string;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
}

/**
 * 项目模型主表视图对象 hivision_project_model_main
 */
export interface HivisionProjectModelMainVo {
  /**
   * 创建时间
   */
  createTime?: Date;
  /**
   * 主键
   */
  id?: number;
  /**
   * 模型名称
   */
  modelName?: string;
  /**
   * 模型列表
   */
  modelVoList?: HivisionProjectModelVo[];
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
}

/**
 * 项目模型主表及配置更新业务对象
 */
export interface ModelMainUpdateParams {
  /**
   * 主表ID（必填）
   */
  id: number;
  /**
   * 模型配置id（必填）
   */
  modelConfigId: number;
  /**
   * 主表模型名称（必填）
   */
  modelName: string;
  /**
   * 配置表状态（必填）0-启用 1-禁用
   */
  status: number;
  /**
   * 渠道 1-link 2-官方（可选）
   */
  channel?: number;
}
