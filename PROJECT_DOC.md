# 创流 (Creaflow) 项目文档

---

## 一、项目概览

**创流 (Creaflow)** 是一个基于 Vue 3 + TypeScript + Element Plus + Vite 的 AI 视频创作工作台前端应用，负责用户交互、AI 内容生成操作与项目历史记录管理。

### 核心功能
- **多租户 SaaS 平台**：支持租户管理与权限控制
- **AI 视频创作流程**：脚本生成 → 分镜设计 → 图像生成 → 视频合成
- **用户认证**：OAuth 2.0 + JWT Token 认证
- **项目管理**：项目列表、成员协作、版本管理
- **素材管理**：角色参考图、场景参考图上传与管理
- **富文本编辑**：集成 TipTap 编辑器，支持提及（@）功能
- **实时通信**：SSE（Server-Sent Events）实时推送 AI 生成进度

### 技术栈
| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3.2.45 |
| 开发语言 | TypeScript 4.9.5 |
| UI 组件库 | Element Plus 2.2.27 |
| 构建工具 | Vite 4.3.1 |
| 状态管理 | Pinia 2.0.22 |
| 路由管理 | Vue Router 4.1.4 |
| 国际化 | Vue I18n 9.2.2 |
| HTTP 客户端 | Axios 1.3.4 |
| 图表库 | ECharts 5.4.0 |
| 富文本编辑 | TipTap 3.20.0, Quill 1.2.0 |
| 工具库 | @vueuse/core, crypto-js, js-cookie |
| 代码规范 | ESLint + Prettier + Husky |

### 业务流向
```
输入端：用户输入创作提示词（Prompt）
    ↓
处理端：前端调用后端 AI API（脚本/图像/视频生成）
    ↓
交互端：实时进度推送（SSE）+ 结果展示与编辑
    ↓
输出端：视频文件下载 + 项目数据持久化
```

---

## 二、开发环境配置（Development Environment）

### 2.1 基础软件
| 软件 | 推荐版本 |
|------|----------|
| Node.js | v16 |
| npm | 8.x+ / pnpm 8.x+ |
| Git | 2.x+ |
| VS Code | 最新版（推荐） |
| 浏览器 | Chrome（推荐） |

### 2.2 Node.js 环境
为保证构建稳定性，开发与部署环境统一 Node 版本：
```bash
# 推荐 Node 版本
node -v  # 应显示 v16.x.x

# 如需切换版本（使用 nvm）
nvm install 16
nvm use 16
```

### 2.3 前端依赖安装
在项目根目录执行：
```bash
# 使用国内镜像加速安装
npm install --registry=https://registry.npmmirror.com

# 如出现依赖异常，清理缓存重装
npm cache clean --force
rm -rf node_modules package-lock.json  # Windows: rmdir /s /q node_modules
npm install
```

### 2.4 本地开发启动
```bash
npm run dev
```
- 默认访问地址：`http://localhost:80`
- 后端代理地址：`http://172.28.104.54:16020`（可在 `vite.config.mts` 中修改）
- 浏览器：Chrome（推荐）
- 支持热更新（HMR）

### 2.5 开发环境变量
创建文件 `.env.development.local`（可选）：
```bash
# 页面标题
VITE_APP_TITLE = 创流

# 开发环境
VITE_APP_ENV = 'development'

# 后端 API 地址（代理地址）
VITE_APP_BASE_API = '/dev-api'

# 应用访问路径
VITE_APP_CONTEXT_PATH = '/'

# 开发服务器端口
VITE_APP_PORT = 80

# WebSocket 开关（开发环境默认关闭，vite bug）
VITE_APP_WEBSOCKET = false
```
> ⚠️ 该文件不应提交至 Git 仓库

### 2.6 其他开发命令
```bash
# 代码格式检查与修复
npm run lint

# 代码格式化
npm run prettier

# 生产构建预览
npm run preview
```

---

## 三、部署环境配置（Production Environment）

### 3.1 生产构建
```bash
npm run build:prod
```

**构建过程说明：**
- 执行 TypeScript 类型检查（`vue-tsc --noEmit`）
- 使用 Vite 进行生产打包
- 输出目录：`dist/`

**构建产物特性：**
- 开启 gzip 压缩（`vite-plugin-compression`）
- 自动分包（`vendor` 独立 chunk）
- 静态资源独立引用（`assetsInlineLimit: 0`）

### 3.2 自动化部署
```bash
# 构建并部署（使用 SSH 自动上传）
npm run deploy:prod
```
部署脚本位于 `bin/deploy.js`，使用 `node-ssh` 自动上传至服务器。

### 3.3 Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /prod-api/ {
        proxy_pass http://backend:16020/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SSE 支持
    location /prod-api/sse/ {
        proxy_pass http://backend:16020/sse/;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
```

### 3.4 部署验证清单
- [ ] 页面正常加载
- [ ] 静态资源无 404
- [ ] `/prod-api/` API 请求成功
- [ ] SSE 实时推送正常
- [ ] 浏览器控制台无明显错误

---

## 四、开发环境 vs 部署环境对照

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| **环境标识** | `development` | `production` |
| **API 前缀** | `/dev-api` | `/prod-api` |
| **默认端口** | 80 | 80 |
| **WebSocket** | 关闭（vite 兼容性） | 开启 |
| **监控地址** | `http://localhost:9090/admin/applications` | `/admin/applications` |
| **压缩** | 关闭 | gzip |
| **Sourcemap** | 开启 | 关闭 |

---

## 五、代码管理方式（Code Management）

### 5.1 代码仓库
- 仓库地址：内部 Git 仓库
- 项目名称：创流 (Creaflow)

### 5.2 代码管理原则
为保证代码质量与生产环境稳定性，项目采用 Git 作为唯一代码管理工具：
- ✅ 所有源代码必须纳入 Git 版本控制
- ❌ 禁止在服务器或生产环境直接修改代码
- ❌ 禁止在未提交代码的情况下进行部署
- ✅ 所有变更必须经过 本地开发 → 提交 → 构建 → 部署 流程

### 5.3 分支管理策略
项目采用简化 Git Flow 模型：

```
main        # 生产稳定分支（线上环境）
├── develop     # 开发主分支（集成测试）
├── feature/*   # 功能开发分支
└── hotfix/*    # 线上紧急修复分支
```

**各分支职责说明：**
| 分支类型 | 命名规范 | 用途 | 合并目标 |
|----------|----------|------|----------|
| `main` | - | 生产环境稳定分支 | 仅接受 `develop` 或 `hotfix/*` 合并 |
| `develop` | - | 开发主分支，日常开发 | 合并至 `main` |
| `feature/*` | `feature/功能描述` | 新功能开发 | 合并至 `develop` |
| `hotfix/*` | `hotfix/问题描述` | 线上紧急修复 | 同时合并至 `main` 和 `develop` |

**示例：**
```bash
# 创建功能分支
git checkout -b feature/tiptap-mention-support

# 创建修复分支
git checkout -b hotfix/sse-connection-leak
```

### 5.4 功能开发流程（推荐）
```
1. 从 develop 分支创建 feature 分支
   ↓
2. 在 feature 分支完成开发与自测
   ↓
3. 提交代码并推送远程仓库
   ↓
4. 合并至 develop 分支进行联调
   ↓
5. 验证通过后合并至 main 分支
```

### 5.5 Git 提交规范
为保证提交记录清晰、可追溯，建议使用如下提交类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加 TipTap 编辑器提及功能` |
| `fix` | 修复 Bug | `fix: SSE 连接断开重连问题` |
| `docs` | 文档更新 | `docs: 更新部署文档` |
| `style` | 代码格式调整 | `style: 格式化组件代码` |
| `refactor` | 重构代码 | `refactor: 重构 API 层结构` |
| `perf` | 性能优化 | `perf: 优化大列表渲染性能` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具链 | `chore: 更新依赖版本` |

**示例命令：**
```bash
git commit -m "feat: 支持 SSE 实时推送脚本生成进度"
```

### 5.6 版本发布与部署管理
**发布原则：**
- 仅 `main` 分支允许用于生产部署
- 每次生产发布必须对应一个明确的 Git 提交
- 推荐在发布时打 Git Tag 以便回滚

**示例：**
```bash
# 打标签
git tag v1.0.0
git push origin v1.0.0

# 回滚到指定版本
git checkout v1.0.0
npm run build:prod
```

### 5.7 忽略文件管理（.gitignore）
以下文件或目录 **禁止提交**：
```gitignore
node_modules/
dist/
.DS_Store
*.local
.env.local
```

`dist/` 为构建产物，仅用于部署，不纳入版本控制。

### 5.8 代码管理注意事项
- ✅ 功能未完成时禁止合并 main
- ✅ 合并前必须确保本地构建通过（`npm run build:prod`）
- ❌ 禁止使用 `git push -f` 覆盖主分支
- ✅ 生产问题优先使用 `hotfix/*` 分支处理
- ✅ 提交前通过 `npm run lint` 检查代码规范

---

## 六、项目结构说明

```
src/
├── api/               # API 接口层（按领域划分）
│   ├── workbench/     # 工作台相关接口
│   ├── system/        # 系统管理接口
│   └── monitor/       # 监控相关接口
├── assets/            # 静态资源
├── components/        # 公共组件
├── composables/       # Vue 3 组合式函数
├── directive/         # 自定义指令
├── enums/             # TypeScript 枚举
├── lang/              # 国际化文件
├── layout/            # 布局组件
├── plugins/           # Vue 插件
├── router/            # 路由配置
├── store/             # Pinia 状态管理
├── utils/             # 工具函数
└── views/             # 页面组件
    ├── workbench/     # 工作台
    │   └── project-creation/  # 五步创作流程
    ├── system/        # 系统管理
    └── monitor/       # 监控
```

---

## 七、常见问题

### Q1: 依赖安装失败
**A:** 清理缓存后重新安装
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --registry=https://registry.npmmirror.com
```

### Q2: 开发环境 SSE 连接失败
**A:** 开发环境默认关闭 WebSocket，需在 `.env.development.local` 中设置 `VITE_APP_WEBSOCKET = true`

### Q3: 构建后页面空白
**A:** 检查 `VITE_APP_CONTEXT_PATH` 配置，确保与 Nginx 配置一致

---

*文档更新日期：2026-02-27*
