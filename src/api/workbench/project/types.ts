/**
 * 协作者信息
 */
export interface TeamUserInfo {
  userId: number;
  roleId: number;
}

/**
 * 项目用户列表查询参数
 */
export interface ProjectUserQuery {
  /** 排序的方向desc或者asc */
  isAsc?: string;
  /** 昵称 */
  nickName?: string;
  /** 排序列 */
  orderByColumn?: string;
  /** 当前页数 */
  pageNum?: number;
  /** 分页大小 */
  pageSize?: number;
  /** 项目id */
  projectId?: number;
}

/**
 * 项目用户页面信息响应
 */
export interface ProjectUserPageInfo {
  /** 部门id */
  deptId?: number;
  /** 部门名称 */
  deptName?: string;
  /** 昵称 */
  nickName?: string;
  /** 团队角色id */
  teamRoleId?: number;
  /** 角色id */
  roleId?: number;
  /** 角色码 */
  roleKey?: string;
  /** 用户id */
  userId?: number;
}

/**
 * 项目成员
 */
export interface ProjectMember {
  deptId?: number | string;
  deptName?: string;
  nickName?: string;
  roleKey?: string; // 角色码
  userId?: number | string;
  roleId?: number | string;
  teamRoleId?: number;
}

/**
 * 项目分页信息响应（后端返回格式）
 */
export interface ProjectPageInfoResponseDto {
  projectId?: string | number; // 项目ID
  coverOssId?: number; // 封面OSSID
  coverUrl?: string; // 封面URL
  createTime?: Date | string; // 创建时间
  projectName?: string; // 项目名称
  roleId?: number; // 角色ID
  roleName?: string; // 角色名称
  updateTime?: Date | string; // 更新时间
}

/**
 * 项目基础信息响应（后端返回格式）
 */
export interface ProjectResponse {
  id?: string | number; // 项目ID
  pictureRatio?: number;
  projectName?: string; // 项目名称
  status?: number;
  userId?: string | number;
}

/**
 * 项目基础信息（列表响应）
 */
export interface Project {
  projectId: string | number;
  projectName: string; // 项目名称
  createTime?: Date | string; // 创建时间
  updateTime?: Date | string; // 更新时间
  roleId?: number; // 角色ID
  roleName?: string; // 角色名称
  coverOssId?: number; // 封面OSSID
  coverUrl?: string; // 封面URL

  members?: ProjectMember[];
  status?: 'active' | 'archived';
  coverImage?: string; // 等同于 coverUrl
  currentUserRole?: string; // 等同于 roleName
}

/**
 * 项目查询参数
 */
export interface ProjectQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
  status?: 'active' | 'archived';
}

/**
 * 项目创建请求参数
 */
export interface ProjectCreateRequest {
  projectName: string; // 项目名称
  pictureRatio: number; // 尺寸比例 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
  teamUserInfoList?: TeamUserInfo[]; // 协作者信息
}

/**
 * 项目重命名请求参数
 */
export interface ProjectRenameRequest {
  projectId: number; // 项目id
  projectName: string; // 新项目名称
}

/**
 * 项目表单（创建/更新）
 */
export interface ProjectForm {
  id?: string | number;
  projectName: string;
  pictureRatio: string;
}

/**
 * 项目详情
 */
export interface ProjectDetail extends Project {
  description?: string;
  coverImage?: string;
  videoCount?: number;
  totalDuration?: number;
}

/**
 * 角色码枚举
 */
export enum RoleKey {
  ADMIN = 'ADMIN', // 管理员（PM）
  OPERATOR = 'OPERATOR', // 运营
  CUSTOMER = 'CUSTOMER', // 普通客户
  DIRECTOR = 'DIRECTOR', // 导演
  COMMISSIONER = 'COMMISSIONER' // 专员
}

/**
 * 团队成员详情
 */
export interface TeamUserDetail {
  memberId?: number; // 成员id
  memberUserId?: number; // 用户id (新字段)
  userId?: number; // 用户id (旧字段,保留兼容)
  nickName?: string; // 昵称
  roleId?: number; // 角色id
  roleKey?: string; // 角色码: ADMIN/OPERATOR/CUSTOMER/DIRECTOR/COMMISSIONER
}

/**
 * 素材统计信息
 */
export interface MaterialStaticsInfo {
  imgFinishCount: number; // 图片完成数量
  imgTotalCount: number; // 图片总数量
  videoFinishCount: number; // 视频完成数量
  videoTotalCount: number; // 视频总数量
}

/**
 * 成员进度信息 (UserProcessInfo)
 */
export interface UserProcessInfo {
  memberId?: number; // 成员id
  memberName?: string; // 成员名称
  memberRoleId?: number; // 角色id
  memberRoleKey?: string; // 角色码（新增字段）
  validImgCount?: number; // 有效分镜图
  imgTaskCount?: number; // 生产图片次数
  validVideoCount?: number; // 有效视频次数
  videoTaskCount?: number; // 生成视频次数
  pointsCount?: number; // 消耗积分
}

/**
 * 项目进度信息 (ProjectProcessInfo)
 */
export interface ProjectProcessInfo {
  progressPercent?: string; // 项目进度百分比
  hasScript?: boolean; // 剧本是否完成
  approvalImgCount?: number; // 图片审核完成数量
  totalImgCount?: number; // 图片总数量
  approvalVideoCount?: number; // 视频审核完成数量
  totalVideoCount?: number; // 视频总数量
}

/**
 * 剧集信息 (EpisodeInfo)
 */
export interface EpisodeInfo {
  episodeId?: number; // 剧集id
  episodePercent?: string; // 单剧集进度百分比
  episodeName?: string; // 剧集名称
  storyText?: string; // 剧集文本
  modelCode?: string; // 模型码
  taskStatus?: number; // 文生文任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败
  userProcessInfoList?: UserProcessInfo[]; // 剧集成员进度信息
  projectProcessInfo?: ProjectProcessInfo; // 剧集项目进度
}

/**
 * AI模型信息
 */
export interface AiModelInfoDto {
  /** 模型码 */
  modelCode?: string;
  /** 模型名称 */
  modelName?: string;
  /** 模型消耗积分 */
  points?: number;
}

/**
 * 项目详细信息响应
 */
export interface ProjectInfoResponse {
  projectId: number; // 主键
  projectName: string; // 项目名称
  pictureRatio: number; // 尺寸比例 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
  allEpisodePercent: string; // 剧集进度百分比
  episodeInfoList: EpisodeInfo[]; // 剧集信息
  materialStaticsInfo: MaterialStaticsInfo; // 素材统计信息
  teamUserInfoList: TeamUserDetail[]; // 团队信息
  /** 图生视频模型 */
  i2vModelInfoList?: AiModelInfoDto[];
  /** 文生图模型 */
  t2iModelInfoList?: AiModelInfoDto[];
  /** 文生文模型 */
  t2tModelInfoList?: AiModelInfoDto[];
}

/**
 * 剧集信息
 */
export interface Episode {
  id: string | number;
  projectId: string | number;
  name: string; // EP01, EP02, etc.
  currentStep: number; // 当前停留的步骤 (1-7)，对应WorkflowPage枚举
  progress: number; // 完成进度百分比 (0-100)
  scriptContent?: string; // 剧本内容
  createTime?: string;
  updateTime?: string;
  taskStatus?: number; // 文生文任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败
}

/**
 * 剧集表单（创建/更新）
 */
export interface EpisodeForm {
  id?: string | number;
  projectId: string | number;
  name: string;
}

/**
 * 剧集创建请求参数（剧情文本模式）
 */
export interface EpisodeCreateRequest {
  /** 集名 */
  episodeName: string;
  /** 模型码 */
  modelCode: string;
  /** 项目id */
  projectId: number;
  /** 剧情 */
  storyText: string;
}

/**
 * 剧集模板上传请求参数（上传拆分剧本模式）
 */
export interface EpisodeTemplateUploadRequest {
  /** 集名 */
  episodeName: string;
  /** 文件 */
  file: File;
  /** 项目id */
  projectId: number;
}

/**
 * 角色/服装信息
 */
export interface Character {
  id: string | number;
  projectId: string | number;
  episodeId?: string | number;
  groupId?: string | number; // 角色分组ID
  name: string; // 服装A, 服装B, etc.
  alias?: string; // 别名
  images: string[]; // 图片URL列表
  episodes: string[]; // 关联的剧集标签 ['EP01', 'EP02']
  tags?: string[]; // 其他标签
  createTime?: string;
  updateTime?: string;
}

/**
 * 角色表单
 */
export interface CharacterForm {
  id?: string | number;
  projectId: string | number;
  episodeId?: string | number;
  groupId?: string | number; // 角色分组ID
  name?: string;
  alias?: string;
  images?: string[];
  episodes?: string[];
  tags?: string[];
}

/**
 * 场景信息
 */
export interface Scene {
  id: string | number;
  projectId: string | number;
  episodeId?: string | number;
  category: string; // 场景类别名称
  images: string[]; // 场景图片列表
  episodes: string[]; // 关联的剧集标签 ['EP01', 'EP02']
  createTime?: string;
  updateTime?: string;
}

/**
 * 场景表单
 */
export interface SceneForm {
  id?: string | number;
  projectId: string | number;
  episodeId?: string | number;
  category: string;
  images?: string[];
  episodes?: string[];
}

/**
 * 项目进度统计
 */
export interface ProjectProgress {
  projectId: string | number;
  totalEpisodes: number; // 总剧集数
  completedEpisodes: number; // 已完成剧集数
  totalCharacters: number; // 总角色数
  totalScenes: number; // 总场景数
  imageProgress: number; // 图片进度 (已上传/总数)
  videoProgress: number; // 视频进度 (已完成/总数)
  overallProgress: number; // 总体进度百分比
}

/**
 * 生产数据统计
 */
export interface ProductionStats {
  memberCount: number; // 成员数量
  shotCount: number; // 分镜数/图片数
  videoCount: number; // 视频次数
  score: number; // 积分
}

/**
 * 媒体资源视图对象 (与 HivisionProjectMaterialVo 对应)
 */
export interface MaterialInfoVo {
  id?: number;
  originOssId?: number;
  originOssUrl?: string;
  previewOssId?: number;
  previewOssUrl?: string;
  projectId?: number;
  status?: number;
  userId?: number;
}

/**
 * 分镜信息
 */
export interface Shot {
  id: string | number;
  episodeId: string | number;
  shotNumber: number; // 镜号
  basicId?: number; // 场景基础信息ID（用于编辑接口）
  sceneImage?: string; // 画面图片（当前显示的图片）
  materialInfoVoList?: MaterialInfoVo[]; // 所有生成的图片列表
  sceneDescription: string; // 画面描述（完整描述，用于编辑）
  sceneDesc?: string; // 特写镜头描述
  sceneHint?: string; // 场景描述
  sceneLocationImage?: string; // 场景图片
  envMaterialInfoVo?: MaterialInfoVo; // 环境素材信息
  dialogue: string; // 台词
  characters: any[]; // 人物列表（CharacterClothingInfo[]）
  sceneLocation: string; // 场景
  historyDetailId?: number; // 历史明细ID（用于判断是否本地上传）
  isCollect: boolean; // 是否收藏
  imageLoading?: boolean; // 图片加载状态
  taskStatus?: number; // 文生图任务状态 0-待执行 1-执行中 2-执行成功 3-执行失败
  reviewStatus?: number; // 评审状态 1-通过 2-待修改
  comment?: string; // 评论内容
  commentCount?: number; // 总评论数量
  commentInfo?: any; // 最新一条评论信息（SceneCommentVo类型）
  imgStatus?: number; // 图片状态 0-白色 1-橙色 2-绿色 3-红色
  createTime?: string;
  updateTime?: string;
}

/**
 * 分镜头单
 */
export interface ShotForm {
  id?: string | number;
  episodeId: string | number;
  shotNumber?: number;
  sceneImage?: string;
  sceneDescription?: string;
  dialogue?: string;
  characters?: string[];
  sceneLocation?: string;
}

/**
 * 生成分镜头单
 */
export interface GenerateStoryboardForm {
  episodeId: string | number;
  projectId: string | number;
  episodeName: string; // 剧集名称
  scriptContent?: string; // 剧情内容
  scriptFile?: File; // 上传的剧本文件
  model?: string; // 选择的模型 (jimeng, gemini, etc.)
}

/**
 * 分镜类型：故事板 | 瀑布流
 */
export type StoryboardViewType = 'storyboard' | 'grid' | 'waterfall';

// ==================== 资源库相关类型 ====================

/**
 * 资源库类型枚举
 */
export enum LibraryType {
  CHARACTER = 1, // 角色
  SCENE = 2 // 场景
}

/**
 * 创建资源库请求
 */
export interface CreateLibraryRequest {
  libraryId?: number; // 主键
  projectId: number; // 项目id
  libraryType: LibraryType; // 库类型 1-角色 2-场景
  name: string; // 名称
}

/**
 * 重命名资源库请求
 */
export interface RenameLibraryRequest {
  libraryId: number; // 资源库id
  projectId: number; // 项目id
  libraryType: LibraryType; // 库类型
  name: string; // 新名称
}

/**
 * 资源库查询参数
 */
export interface LibraryQueryParams {
  projectId?: number; // 项目id
  episodeId?: number; // 剧集id
}

/**
 * 资源库明细子项 (LibrarySubInfo)
 */
export interface LibrarySubInfo {
  libraryDetailId?: number; // 角色或场景子项id
  detailName?: string; // 角色或场景子项名称
  ossId?: number; // 图片 ossid
  ossUrl?: string; // 图片 url
  episodeList?: EpisodeInfo[]; // 剧集标签
  materialVo: {
    id: number;
  };
}

/**
 * 资源库项信息 (LibraryItemInfo)
 */
export interface LibraryItemInfo {
  libraryId?: number; // 角色或场景id
  name?: string; // 角色或场景名称
  librarySubInfoList?: LibrarySubInfo[]; // 角色或场景子项列表
  episodeList?: EpisodeInfo[]; // 剧集关联信息
  totalImageCount?: number; // 该角色/场景在所有剧集中的总图片数
}

/**
 * 角色列表详情响应 (LibraryInfoResponseDto)
 */
export interface CharacterDetailResponse {
  episodeInfoList?: EpisodeInfo[]; // 剧集信息
  libraryItemInfoList?: LibraryItemInfo[]; // 角色或场景列表
}

/**
 * 场景列表详情响应（与角色列表相同结构 LibraryInfoResponseDto）
 */
export type SceneDetailResponse = CharacterDetailResponse;

/**
 * 角色/场景详情查询参数
 */
export interface LibraryDetailQuery {
  projectId: number; // 项目id
  episodeId?: number; // 剧集id（可选）
}

/**
 * 创建资源库明细请求
 */
export interface CreateLibraryDetailRequest {
  detailId?: number; // 明细id（主键，创建时可选）
  libraryId: number; // 资源库id
  name: string; // 明细名称
  ossId: number; // 媒体资源id（必填）
  ossUrl: string; // 媒体资源url（必填）
}

/**
 * 重命名资源库明细请求
 */
export interface RenameLibraryDetailRequest {
  detailId: number; // 明细id
  libraryId: number; // 资源库id
  name: string; // 新名称
  ossId?: number; // OSS文件id
  ossUrl?: string; // OSS文件URL
}

// ==================== 工作流记录相关类型 ====================

/**
 * 工作流节点枚举
 */
export enum WorkflowPage {
  SCRIPT = 1, // 剧本
  CHARACTER = 2, // 角色
  SCENE = 3, // 场景
  STORYBOARD = 4, // 分镜头
  STORY_BOARD = 5, // 故事板
  WATERFALL = 6, // 瀑布流
  VIDEO = 7 // 视频
}

/**
 * 创建工作流记录请求
 */
export interface ProcessRecordCreateRequest {
  projectId: number; // 项目id
  episodeId?: number; // 剧集id（可选）
  currentPage: number; // 当前工作流节点 1-剧本 2-角色 3-场景 4-分镜头 5-故事板 6-瀑布流 7-视频
}

/**
 * 获取跳转页面请求
 */
export interface ProcessReferPageRequest {
  projectId: number; // 项目id
}

/**
 * 项目工作流记录视图对象
 */
export interface ProjectProcessRecordVo {
  id?: number; // 主键
  projectId?: number; // 项目id
  episodeId?: number; // 剧集id
  teamUserId?: number; // 协作者用户id
  currentPage?: number; // 当前工作流节点 1-剧本 2-角色 3-场景 4-分镜头 5-故事板 6-瀑布流 7-视频
  status?: number; // 启用状态 0-启用 1-禁用
}

/**
 * 资源库绑定剧集请求参数
 */
export interface LibraryBindEpisodeRequest {
  /** 剧集id列表 */
  episodeIdList: number[];
  /** 1：服装（角色） 2：场景 */
  libraryType: number;
  /** 服装关联剧集时给libraryDetailId，场景关联剧集时给libraryId */
  relationId: number;
}
