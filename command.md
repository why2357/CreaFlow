# Test服务器操作命令清单

> 本文件用于记录对test服务器的操作命令，仅供学习参考

## 服务器信息
- **环境**: 测试环境
- **访问**: 仅内网访问
- **连接方式**: ssh-mpc-server

## 操作日志


### 需要的连接信息

要连接test服务器，请提供以下信息之一：
1. **SSH配置文件**: ~/.ssh/config 中的test服务器配置
2. **完整连接信息**: `ssh user@hostname -p port`
3. **MCP服务器配置**: ssh-mpc-server的实际配置方式

---

### 2025-02-25 - test服务器连接信息

根据配置文件，test服务器信息如下：
```json
{
  "name": "test",
  "host": "172.28.104.54",
  "port": 22,
  "username": "ahui",
  "password": "ln2718281828"
}
```

**尝试的连接方式**:

```bash
# 尝试使用sshpass（不可用）
sshpass -p "ln2718281828" ssh -o StrictHostKeyChecking=no ahui@172.28.104.54 -p 22 "ls"
# 结果: sshpass: command not found
```

```powershell
# 尝试使用PowerShell SSH模块
# 结果: 需要安装Posh-SSH模块或配置SSH密钥
```

**建议的解决方案**:

1. **配置SSH密钥对** (推荐)
```bash
# 在本地生成SSH密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/test_server_key

# 将公钥复制到test服务器
ssh-copy-id -i ~/.ssh/test_server_key.pub ahui@172.28.104.54
# 或手动复制
cat ~/.ssh/test_server_key.pub | ssh ahui@172.28.104.54 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

2. **安装sshpass** (Windows需通过WSL或第三方工具)
```bash
# WSL/Linux
sudo apt install sshpass

# 使用sshpass自动输入密码
sshpass -p "ln2718281828" ssh ahui@172.28.104.54 "ls"
```

3. **使用MCP SSH工具**
- 需要确保ssh-mpc-server正确加载并提供可用的工具

---

### 2025-02-25 - 通过MCP SSH Server成功连接test服务器

**MCP服务重启后工具可用**:
```bash
# 列出可用的SSH服务器
mcp__ssh-mpc-server__list-servers

# 结果:
# - aly (8.141.16.40:22, root)
# - test (172.28.104.54:22, ahui)
# - test11 (127.0.0.1:22, root)
```

**成功执行ls命令**:
```bash
# 通过MCP工具在test服务器执行ls -la
mcp__ssh-mpc-server__execute-command(cmdString="ls -la", connectionName="test")

# 结果: 成功！
```

**test服务器文件列表摘要**:
```
# 目录
1panel-v2.0.17-linux-amd64/     # 1Panel管理面板
25ge/                           # 工作目录
.ai_completion/                 # AI补全配置
.cache/                         # 缓存目录
.config/                        # 配置目录
.cursor/                        # Cursor编辑器配置
.cursor-server/                 # Cursor服务器
.docker/                        # Docker配置
.mongodb/                       # MongoDB数据
.local/                         # 本地数据
.modelscope/                    # ModelScope模型
.nv/                            # NVIDIA配置
.pki/                           # 证书目录
.portainer/                     # Portainer Docker管理
.ssh/                           # SSH密钥
.trae/                         # Trae配置
.trae-server/                   # Trae服务器
web_admin/                      # Web管理后台

# Docker相关目录
mysql-docker/                   # MySQL Docker配置
nacos-docker/                   # Nacos Docker配置
redis-docker/                   # Redis Docker配置
portainer/                      # Portainer Docker配置
xxl-job-docker/                 # XXL-Job Docker配置

# 重要文件
1panel-v2.0.17-linux-amd64.tar.gz  # 1Panel安装包
nacos-mysql.sql                 # Nacos MySQL初始化脚本
sskj-story-motion.sql           # 数据库脚本
tables_xxl_job.sql              # XXL-Job表结构
tables_xxl_job_sskj.sql         # XXL-Job SSKJ表结构
cuda-keyring_1.1-1_all.deb      # CUDA keyring包
```

**状态**: ✅ 成功 - MCP SSH服务器连接正常

---

### 2025-02-25 - 查询test服务器后端数据库管理员账号

**步骤1: 查看Docker容器状态**
```bash
# 查看所有运行中的Docker容器
docker ps -a

# 发现的关键容器:
# - mysql (端口3306) - MySQL数据库
# - web-admin-test (端口8000) - Web管理后台
# - nacos (端口8848) - Nacos配置中心
# - redis (端口6379) - Redis缓存
```

**步骤2: 获取MySQL密码**
```bash
# 查看MySQL容器环境变量
docker inspect mysql --format='{{range .Config.Env}}{{println .}}{{end}}' | grep -i mysql

# 结果:
# MYSQL_ROOT_PASSWORD=root123
# MYSQL_USER=developer
# MYSQL_PASSWORD=kl123456
```

**步骤3: 查询数据库列表**
```bash
# 使用root密码连接MySQL
docker exec mysql mysql -uroot -proot123 -e "SHOW DATABASES;"

# 发现的数据库:
# - sskj-forge-hivision (主业务数据库)
# - sskj_config (配置数据库)
# - sskj_job (XXL-Job数据库)
```

**步骤4: 查询管理员账号**
```bash
# 查询用户表和角色表关联数据
SELECT u.user_id, u.user_name, u.nick_name, u.password,
       u.phonenumber, r.role_name, r.role_key
FROM sys_user u
LEFT JOIN sys_user_role ur ON u.user_id = ur.user_id
LEFT JOIN sys_role r ON ur.role_id = r.role_id;
```

**管理员账号列表**:

| 用户名 | 手机号 | 角色 | 角色代码 | 密码哈希 |
|--------|--------|------|----------|----------|
| 16666666666 | 16666666666 | PM | SUPER-ADMIN | $2a$10$IJ7YQpKNXOQGXZFMLAs69. |
| 18888888888 | 18888888888 | PM | SUPER-ADMIN | $2a$10$IJ7YQpKNXOQGXZFMLAs69. |
| 13888888888 | 13888888888 | PM | ADMIN | $2a$10$IJ7YQpKNXOQGXZFMLAs69. |
| 18912679663 | 18912679663 | PM | ADMIN | $2a$10$IJ7YQpKNXOQGXZFMLAs69. |
| 18911111111 | 18911111111 | PM | ADMIN | $2a$10$Fu62xMb1M7rxoAF.b4cdyO. |

**注意**: 密码使用BCrypt加密，无法直接解密

**可能的测试密码** (根据常见的测试账号密码):
- 手机号本身 (如: 16666666666)
- 123456
- admin123
- password123

**状态**: ✅ 成功 - 已获取管理员账号列表

---

### 2025-02-25 - 查询test服务器后端路由权限问题

**问题描述**: 超级管理员(SUPER-ADMIN)只返回2个路由

**步骤1: 查询菜单总数**
```bash
# 查询sys_menu表中的菜单总数
SELECT COUNT(*) FROM sys_menu;

# 结果: 21个菜单
```

**步骤2: 查询各角色关联的菜单数量**
```bash
# 统计每个角色关联的菜单数量
SELECT r.role_name, r.role_key, COUNT(rm.menu_id) as menu_count
FROM sys_role r
LEFT JOIN sys_role_menu rm ON r.role_id = rm.role_id
GROUP BY r.role_id;

# 结果:
# SUPER-ADMIN  -> 2个菜单 ❌
# ADMIN       -> 19个菜单 ✅
# OPERATOR    -> 2个菜单
# CUSTOMER    -> 1个菜单
# DIRECTOR    -> 10个菜单
# COMMISSIONER-> 2个菜单
```

**步骤3: 查看SUPER-ADMIN关联的菜单**
```bash
# 查询SUPER-ADMIN角色关联的具体菜单
SELECT m.menu_id, m.menu_name, m.path
FROM sys_role_menu rm
LEFT JOIN sys_menu m ON rm.menu_id = m.menu_id
WHERE rm.role_id = 45664637167104;  -- SUPER-ADMIN的role_id

# 结果: 只有2个菜单
# 1. tenant  (租户管理)
# 2. model   (模型管理)
```

**步骤4: 对比ADMIN角色关联的菜单**
```bash
# 查询ADMIN角色关联的菜单
SELECT m.menu_id, m.menu_name, m.path
FROM sys_role_menu rm
LEFT JOIN sys_menu m ON rm.menu_id = m.menu_id
WHERE rm.role_id = 45664637167105;  -- ADMIN的role_id

# 结果: 有19个菜单
# - index     (首页/工作台)
# - property  (属性管理)
# - member    (成员管理)
# - projectData (项目数据)
# - pointRecord (积分记录)
# - 以及其他15个子菜单
```

---

## 🔍 问题原因

**SUPER-ADMIN角色的菜单权限配置不完整**

| 角色 | 关联菜单数 | 预期 | 实际 |
|------|-----------|------|------|
| SUPER-ADMIN | 2 | 应该最多 | ❌ 配置错误 |
| ADMIN | 19 | 较多 | ✅ 正常 |

**权限配置错误**: SUPER-ADMIN只关联了 `tenant` 和 `model` 两个菜单，缺少其他主要菜单如 `index`、`property`、`member` 等。

**建议解决方案**:
1. 将SUPER-ADMIN的菜单权限设置为全部菜单（或至少与ADMIN相同）
2. 检查 `sys_role_menu` 表中SUPER-ADMIN(role_id=45664637167104)的配置
3. 需要为SUPER-ADMIN添加缺失的菜单权限

---

## ⚠️ 重要操作原则

**test服务器操作规则**:
- ✅ **允许**: 查询操作 (SELECT / SHOW / DESC)
- ❌ **禁止**: 增加操作 (INSERT) - 除非获得明确命令
- ❌ **禁止**: 修改操作 (UPDATE) - 除非获得明确命令
- ❌ **禁止**: 删除操作 (DELETE / DROP) - 除非获得明确命令

**所有修改类操作必须**:
1. 先征得用户同意
2. 记录到此文件中
3. 标注操作时间和原因

---

## 注意事项
- 对此服务器的任何增加、修改、删除操作都会记录在此文件中
- 所有命令都会添加注释说明其用途
- 此文件主要用于学习和记录目的