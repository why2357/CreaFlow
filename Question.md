# 问题与解决记录

## 2026-02-13: 开发环境登录后显示404页面

### 问题描述
开发环境登录成功后显示404页面，而生产环境正常工作。

### 原因分析
查看后端返回数据发现：
- 开发环境和生产环境返回的数据结构相同
- 都有 `roles: ["SUPER-ADMIN"]` 但 `permissions: []` 为空

问题出在前端路由注册逻辑上。在 `src/store/modules/permission.ts` 的 `generateRoutes` 函数中：
- 静态菜单 `staticMenus` 只被合并到 `allRoutes` 并存储到 store 中
- 但只有后端返回的 `rewriteRoutes` 被通过 `router.addRoute()` 注册到 Vue Router
- **静态菜单从未被注册到路由器中**

在开发环境中，如果后端 `/hivision/getRouters` 返回空数组，加上静态菜单没有注册，导致没有任何可用路由，最终匹配到404 catch-all路由。

### 解决方案
修改 `src/store/modules/permission.ts:72-79`，将合并后的 `allRoutes`（包含静态菜单和动态路由）注册到 Vue Router：

```typescript
// 合并静态菜单和动态路由
const allRoutes = [...staticMenus.value, ...rewriteRoutes];

// 将合并后的路由添加到 router（包含静态菜单和动态路由）
allRoutes.forEach((route) => {
  router.addRoute(route);
});

setRoutes(allRoutes);
```

### 相关文件
- `src/store/modules/permission.ts` - 权限路由管理模块

---

## 2026-02-13: 创建部署脚本

### 问题描述
编写一个脚本，用于将打包好的 `dist` 目录中的文件上传到内网服务器的 `/opt/1panel/www/sites/creaflow/index`，并在部署前自动备份服务器上的现有文件。

### 服务器配置
- IP: 172.28.104.54
- 用户名: ahui
- 密码: ln2718281828
- 部署路径: /opt/1panel/www/sites/creaflow/index

### 解决方案
创建了三个部署脚本以支持不同平台：

1. **bin/deploy.js** - Node.js 跨平台脚本（推荐）
2. **bin/deploy.bat** - Windows 批处理脚本
3. **bin/deploy.sh** - Linux/Mac Shell 脚本

同时在 `package.json` 中添加了便捷命令：
```json
"deploy": "node bin/deploy.js",
"deploy:prod": "npm run build:prod && npm run deploy"
```

### 功能特性
- 自动备份：每次部署前使用时间戳备份现有文件（格式：`index_backup_YYYYMMDDHHMMSS`）
- 自动权限设置：上传后自动设置文件权限为 755
- 跨平台支持：Windows/Linux/Mac 均可使用
- 一键部署：支持打包+部署一键完成

### 使用方法
```bash
# 仅部署（需要先手动打包）
npm run deploy

# 打包并部署（一键完成）
npm run deploy:prod
```

### 相关文件
- `bin/deploy.js` - Node.js 部署脚本
- `bin/deploy.bat` - Windows 批处理脚本
- `bin/deploy.sh` - Linux/Mac Shell 脚本
- `bin/DEPLOY.md` - 部署说明文档
- `package.json` - 添加了 deploy 和 deploy:prod 命令

---

## 2026-02-13: 修复 Windows 部署脚本 bash 错误

### 问题描述
运行部署脚本时报错：`'bash' 不是内部或外部命令`

### 原因分析
Windows 系统默认没有安装 bash，脚本尝试使用 bash 执行命令导致失败。

### 解决方案
修改 `bin/deploy.js`，在 Windows 环境下直接使用内置的 SSH 客户端：
- 添加 `-o UserKnownHostsFile=NUL` 参数（Windows 使用 NUL 而非 /dev/null）
- 移除对 bash 的依赖，直接执行 ssh 和 scp 命令
- 分步骤执行：备份 → 上传 → 设置权限

### 相关文件
- `bin/deploy.js` - 更新 Windows 兼容性

---

## 2026-02-13: 修复部署脚本密码认证问题

### 问题描述
运行部署脚本时，每次都需要手动输入密码，而且输入后总是显示 "Permission denied"。

### 原因分析
Windows 命令行的 SSH 交互式密码输入可能存在兼容性问题，导致密码无法正确传递。

### 解决方案
改用 `node-ssh` Node.js 库来实现 SSH 连接和文件上传：
1. 安装依赖：`npm install node-ssh --save-dev`
2. 脚本使用 `node-ssh` 的 `putDirectory` 方法上传文件
3. 密码直接在配置中指定，无需手动输入

### 使用方法
```bash
# 先安装依赖
npm install node-ssh --save-dev

# 然后运行部署
npm run deploy
```

### 相关文件
- `bin/deploy.js` - 使用 node-ssh 库重写
- `package.json` - 添加 node-ssh 依赖

---

## 2026-02-13: 修复 node-ssh putDirectory Windows 兼容性问题

### 问题描述
使用 `node-ssh` 的 `putDirectory` 方法在 Windows 上上传文件时，所有文件都上传失败。

### 原因分析
`node-ssh` 的 `putDirectory` 方法在处理 Windows 路径（反斜杠）时存在兼容性问题。

### 解决方案
改用逐个文件上传的方式：
1. 使用 `getAllFiles` 递归获取所有文件
2. 使用 `putFile` 逐个上传文件
3. 路径转换：将 Windows 路径转换为 Unix 风格
4. 添加上传进度显示

### 相关文件
- `bin/deploy.js` - 改用逐个文件上传方式
