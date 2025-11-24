/**
 * 项目历史记录相关类型定义
 */

/**
 * 查询资产列表--请求参数 (AssetListBo)
 */
export interface AssetListRequest {
  /**
   * 剧集id（必填）
   */
  episodeId: number;
  /**
   * 历史id列表（无需传参）
   */
  historyIds?: number[];
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
   * 镜头类型 1-图片 2-视频
   */
  sceneType: number;
}

/**
 * 项目历史明细视图对象 (HivisionProjectHistoryDetailVo)
 * hivision_project_history_detail
 */
export interface ProjectHistoryDetailVo {
  /**
   * 基础镜头id
   */
  basicId?: number;
  /**
   * 剧集id
   */
  episodeId?: number;
  /**
   * 历史id
   */
  historyId?: number;
  /**
   * 主键
   */
  id?: number;
  /**
   * 媒体资源id
   */
  materialId?: number;
  /**
   * 原始素材oss url
   */
  originOssUrl?: string;
  /**
   * 预览oss url
   */
  previewOssUrl?: string;
  /**
   * 项目id
   */
  projectId?: number;
  /**
   * 镜头类型 1-图片 2-视频
   */
  sceneType?: number;
  /**
   * 选中状态 0-未选中 1-选中
   */
  selectStatus?: number;
  /**
   * 启用状态 0-启用 1-禁用
   */
  status?: number;
  /**
   * 用户id
   */
  userId?: number;
}
