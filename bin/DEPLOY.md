# 部署脚本使用说明

## 概述

本项目包含自动化部署脚本，用于将打包后的 `dist` 目录上传到内网服务器。

## 服务器配置

| 配置项    | 值                                   |
| --------- | ------------------------------------ |
| 服务器 IP | 172.28.104.54                        |
| 用户名    | ahui                                 |
| 密码      | ln2718281828                         |
| 部署路径  | /opt/1panel/www/sites/creaflow/index |

## 使用方法

### 方法一：使用 npm 命令（推荐）

```bash
# 仅部署（需要先手动打包）
npm run deploy

# 打包并部署（一键完成）
npm run deploy:prod
```

### 方法二：直接运行脚本

**Windows:**

```bash
# 使用 Node.js 脚本（推荐）
node bin/deploy.js

# 或使用批处理脚本
bin\deploy.bat
```

**Linux/Mac:**

```bash
# 添加执行权限
chmod +x bin/deploy.sh

# 运行脚本
./bin/deploy.sh
```

## 功能说明

1. **自动备份**: 每次部署前会自动备份服务器上的现有文件
2. **备份命名**: 备份目录使用时间戳命名，格式为 `index_backup_YYYYMMDDHHMMSS`
3. **权限设置**: 上传后自动设置文件权限为 755

## 首次使用提示

### Windows 用户

如果需要自动化输入密码（无需手动输入），建议安装 **Git Bash**，它包含 `sshpass` 工具：

1. 下载安装 [Git for Windows](https://git-scm.com/download/win)
2. 安装后使用 Git Bash 运行脚本

或手动输入密码即可正常使用。

### Linux/Mac 用户

安装 `sshpass` 实现自动化：

```bash
# Ubuntu/Debian
sudo apt-get install sshpass

# CentOS/RHEL
sudo yum install sshpass

# Mac
brew install sshpass
```

## 部署流程

```
1. 检查 dist 目录是否存在
2. 生成带时间戳的备份目录名
3. 在服务器上备份现有文件
4. 上传新的 dist 文件到服务器
5. 设置文件权限
6. 显示部署结果
```

## 故障排除

### 问题：找不到 SSH 客户端

- Windows 10+ 自带 OpenSSH 客户端，确保已启用
- 或安装 Git for Windows

### 问题：连接超时

- 确保在**内网环境**下访问
- 检查服务器 IP 是否正确：172.28.104.54

### 问题：权限不足

- 确保用户 ahui 有目标目录的写权限
- 联系管理员检查服务器权限配置

## 回滚操作

如需回滚到之前的版本：

```bash
# SSH 登录服务器
ssh ahui@172.28.104.54

# 查看备份目录
ls -la /opt/1panel/www/sites/creaflow/

# 恢复备份（将 BACKUP_DIR 替换为实际备份目录名）
cp -r /opt/1panel/www/sites/creaflow/index_backup_YYYYMMDDHHMMSS/* /opt/1panel/www/sites/creaflow/index/
```
