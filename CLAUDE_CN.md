# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

这是**创流 (Forge HiVision)** - 一个基于 Vue 3 + TypeScript + Element Plus + Vite 构建的视频制作工作台。这是一个多租户
SaaS 平台，通过结构化的工作流程（包括脚本、分镜、图像生成和视频合成）来创建 AI 生成的视频内容。

## 开发命令

```bash
# 安装依赖
npm install --registry=https://registry.npmmirror.com

# 启动开发服务器（默认端口 80，代理到后端 :16020）
npm run dev

# 生产环境构建
npm run build:prod

# 代码检查和修复
npm run lint

# 代码格式化
npm run prettier
```

**Node 版本要求**: v16

## 架构概览

### 目录结构

```
src/
├── api/               # 按业务领域组织的 API 接口（system、workbench、monitor 等）
│   └── [domain]/      # 每个领域包含 index.ts（请求）和 types.ts（类型定义）
├── assets/            # 静态资源（样式、图片、SVG 图标）
├── components/         # 可复用的 UI 组件（DictTag、FileUpload、ImageUpload 等）
├── composables/       # Vue 3 组合式函数（useSSEListener、useAutoScroll）
├── directive/         # 自定义 Vue 指令（权限控制、复制文本）
├── enums/            # TypeScript 枚举（MenuTypeEnum、RespEnum 等）
├── lang/             # 国际化翻译（zh_CN、en_US）
├── layout/           # 布局组件（侧边栏、头部、标签页视图）
├── plugins/          # Vue 插件（认证、缓存、下载、弹窗、SVG 图标）
├── router/           # Vue Router 配置（常量路由 + 动态路由）
├── store/            # Pinia 状态管理（模块：app、user、permission、project 等）
├── utils/            # 工具函数（请求、SSE、WebSocket、认证、加密、字典）
└── views/            # 按功能组织的页面组件
    ├── workbench/    # 主工作台区域
    │   ├── project-admin/      # 项目列表/管理
    │   └── project-creation/  # 核心 5 步工作流程
    │       └── steps/
    │           ├── StepCharacter/   # 角色上传
    │           ├── StepScene/       # 场景上传
    │           ├── StepScript/      # 脚本生成
    │           ├── StepShotList/    # 分镜列表/故事板
    │           ├── StepGridView/    # 网格视图预览
    │           └── StepVideo/      # 视频生成
    ├── system/       # 系统管理（用户、角色、菜单等）
    └── monitor/      # 监控功能
```

### 核心架构模式

**API 层模式**: 每个 API 领域包含两个文件：

- `index.ts` - 使用 `@/utils/request` 中的 axios 实例的 API 请求函数
- `types.ts` - 请求和响应的 TypeScript 类型/接口定义

**Store 模式**: `src/store/modules/` 中的 Pinia stores 按功能组织（app、user、permission、project、dict 等）。

**路由结构**:

- **常量路由** - 公共页面（登录、首页、404 等）
- **动态路由** - 根据后端返回的用户权限动态加载
- 路由支持 meta 属性用于权限控制、缓存和导航控制

**项目创建工作流程**: 核心功能是 `src/views/workbench/project-creation/` 中的 5 步工作流程：

1. StepCharacter - 上传角色参考图
2. StepScene - 上传场景参考图
3. StepScript - 从提示词生成脚本
4. StepShotList - 查看/编辑分镜镜头
5. StepGridView - 生成图像的网格预览
6. StepVideo - 从分镜生成最终视频

### 实时通信

**SSE (Server-Sent Events)**: 用于 AI 内容生成过程中的实时更新

- 管理器: `src/utils/sse.ts` - SSE 连接管理，支持自动重连
- 标签页协调: `src/utils/sseTabCoordinator.ts` - 跨浏览器标签页的 SSE 协调
- 组合式函数: `src/composables/useSSEListener.ts` - Vue 3 SSE 事件监听钩子
- 消息类型:
  - `messageType=1`: 脚本生成完成
  - `messageType=2`: 图像生成更新
  - `messageType=3`: 视频生成更新

**自定义事件**: SSE 消息作为 window 事件派发：

- `sse-script-update`
- `sse-image-update`
- `sse-video-update`

### 自动导入配置

**Vue API**: 自动从 `vue`、`vue-router`、`pinia`、`@vueuse/core` 导入（在 `vite/plugins/auto-import.ts` 中配置）

**Element Plus 组件**: 通过 `unplugin-vue-components` 和 ElementPlusResolver 自动导入

**Element Plus API**: ElMessage、ElMessageBox 等会自动导入

**图标**: `src/assets/icons/svg/` 中的 SVG 图标已注册，可通过 SvgIcon 组件使用

### 请求/响应处理

**Axios 配置** (`src/utils/request.ts`):

- 基础 URL 来自 `VITE_APP_BASE_API` 环境变量
- JWT token 通过 `Authorization: Bearer ${token}` 传递
- 支持请求加密（AES + RSA 混合加密）
- 自动处理 401 状态并提示重新登录
- 防止重复请求（500ms 间隔）

**响应处理**:

- 成功: `code === 200`
- 自定义错误码在 `src/utils/errorCode.ts` 中定义
- 下载时的加载状态

### 权限系统

**路由权限**: 根据后端权限过滤动态路由 **指令权限**: `v-hasPermi` 指令用于元素级别的权限控制 **项目权限**: 用于基于项目
访问控制的额外权限系统

### 国际化支持

- 翻译文件位于 `src/lang/`（zh_CN、en_US）
- 在组合式函数中使用 `useI18n()` 或在模板中使用 `$t()`
- 语言设置以 `language` 为键存储在 localStorage 中

### 环境变量

- `VITE_APP_BASE_API` - 后端 API 基础路径
- `VITE_APP_CLIENT_ID` - OAuth 客户端 ID
- `VITE_APP_CONTEXT_PATH` - 部署上下文路径
- `VITE_APP_PORT` - 开发服务器端口（默认 80）

### 组件命名规范

- 组件名称必须由多个单词组成
- `.vue` 文件使用 PascalCase 命名
- 组件从 `src/components/` 路径自动导入

### 代理配置

开发服务器将 API 请求代理到后端（默认：`http://172.28.44.150:16020`）

### 测试

已配置 Vitest 用于单元测试（package.json 中的 `.vitest` 配置）
