/**
 * 参考图/提及功能类型定义
 */

/**
 * 参考图片数据
 */
export interface ReferenceImage {
  /** 唯一标识 */
  id: string;
  /** 图片地址 (本地 blob URL 或服务器 URL) */
  src: string;
  /** 缩略图地址 */
  thumbnail?: string;
  /** 显示标签 (如: 图片1、图片2) */
  label: string;
  /** 原始文件对象 (用于上传到服务器) */
  file?: File;
  /** 上传状态 */
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  /** 上传进度 */
  uploadProgress?: number;
  /** 服务器返回的图片ID */
  serverId?: string;
}

/**
 * 提及类型枚举
 */
export enum MentionType {
  REFERENCE = 'reference', // 参考图
  CHARACTER = 'character', // 角色
  SCENE = 'scene' // 场景
}

/**
 * 提及节点属性
 */
export interface MentionNodeAttrs {
  /** 提及类型 */
  type: MentionType;
  /** 唯一标识 */
  id: string;
  /** 图片地址 */
  src?: string;
  /** 显示标签 */
  label: string;
  /** 角色别名 (仅角色类型) */
  alias?: string;
  /** 场景类别 (仅场景类型) */
  category?: string;
}

/**
 * 拖拽数据格式
 */
export interface DragData {
  /** 拖拽类型 */
  type: MentionType | 'image-mention';
  /** 唯一标识 */
  id: string;
  /** 图片地址 */
  src: string;
  /** 显示标签 */
  label: string;
  /** 角色别名 (可选) */
  alias?: string;
  /** 场景类别 (可选) */
  category?: string;
}

/**
 * 提及选项（用于弹窗选择）
 */
export interface MentionOption {
  /** 唯一标识 */
  id: string;
  /** 提及类型 */
  type: MentionType;
  /** 图片地址 */
  src?: string;
  /** 显示标签 */
  label: string;
  /** 副标题 */
  subtitle?: string;
  /** 角色别名 (仅角色类型) */
  alias?: string;
  /** 场景类别 (仅场景类型) */
  category?: string;
}

/**
 * 提及弹窗状态
 */
export interface MentionPopupState {
  /** 是否显示 */
  visible: boolean;
  /** 触发位置 */
  position: { x: number; y: number };
  /** 搜索关键词 */
  query: string;
  /** 当前激活的索引 */
  activeIndex: number;
  /** 当前选中的分类 */
  activeTab: MentionType;
}

/**
 * 参考图栏状态
 */
export interface ReferenceBarState {
  /** 参考图列表 */
  images: ReferenceImage[];
  /** 当前最大索引 (用于生成标签) */
  maxIndex: number;
  /** 是否显示上传按钮 */
  showUploadButton: boolean;
}

/**
 * 参考图栏操作
 */
export interface ReferenceBarActions {
  /** 添加参考图 */
  addImage: (file: File) => Promise<ReferenceImage>;
  /** 删除参考图 */
  removeImage: (id: string) => void;
  /** 获取参考图 */
  getImage: (id: string) => ReferenceImage | undefined;
  /** 清空所有参考图 */
  clearAll: () => void;
  /** 更新上传状态 */
  updateUploadStatus: (id: string, status: ReferenceImage['uploadStatus'], progress?: number) => void;
}
