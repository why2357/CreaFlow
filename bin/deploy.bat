@echo off
REM ========================================
REM 创流 (Forge HiVision) 部署脚本
REM 用于将 dist 目录上传到内网服务器
REM ========================================

SETLOCAL EnableDelayedExpansion

REM 服务器配置
set SERVER_HOST=172.28.104.54
set SERVER_USER=ahui
set SERVER_PASS=ln2718281828
set SERVER_PATH=/opt/1panel/www/sites/creaflow/index

REM 本地路径
set LOCAL_DIST=%~dp0..\dist

echo ========================================
echo 创流 (Forge HiVision) 部署脚本
echo ========================================
echo.

REM 检查 dist 目录是否存在
if not exist "%LOCAL_DIST%" (
    echo [错误] dist 目录不存在！
    echo 请先运行打包命令: npm run build:prod
    pause
    exit /b 1
)

echo [1/4] 检查 dist 目录... 存在

REM 生成备份目录名称（使用时间戳）
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_DIR=index_backup_%datetime:~0,14%

echo [2/4] 备份服务器现有文件...

REM 使用 sshpass 或 ssh 进行备份操作
REM Windows 10+ 内置 SSH 客户端
echo 正在备份服务器文件到: %SERVER_PATH%/../%BACKUP_DIR%
echo 正在上传新文件到: %SERVER_PATH%

REM 构建 SSH 命令
set SSH_CMD=ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null %SERVER_USER%@%SERVER_HOST%
set SCP_CMD=scp -o StrictHostKeyChecking=no -o UserKnownHostsFile/NUL -r

REM 由于 Windows 原生不支持 sshpass，使用 expect 或手动输入密码
REM 这里使用一个临时脚本来处理密码输入

(
echo #!/usr/bin/expect -f
echo set timeout 300
echo set password [lindex $argv 0]
echo set server_host [lindex $argv 1]
echo set server_user [lindex $argv 2]
echo set server_path [lindex $argv 3]
echo set backup_dir [lindex $argv 4]
echo set local_dist [lindex $argv 5]
echo.
echo # 备份现有文件
echo spawn ssh $server_user@$server_host
echo expect {
echo     "password:" {
echo         send "$password\r"
echo         expect "$"
echo         send "cd $server_path/..\r"
echo         expect "$"
echo         send "mkdir -p $backup_dir\r"
echo         expect "$"
echo         send "cp -r index/* $backup_dir/ 2>/dev/null || echo '首次部署，无需备份'\r"
echo         expect "$"
echo         send "exit\r"
echo     }
echo     "are you sure" {
echo         send "yes\r"
echo         exp_continue
echo     }
echo }
echo.
echo # 上传新文件
echo spawn scp -r -o StrictHostKeyChecking=no $local_dist/* $server_user@$server_host:$server_path/
echo expect {
echo     "password:" {
echo         send "$password\r"
echo         expect eof
echo     }
echo     "are you sure" {
echo         send "yes\r"
echo         exp_continue
echo     }
echo }
echo.
echo # 设置权限
echo spawn ssh $server_user@$server_host
echo expect "password:"
echo send "$password\r"
echo expect "$"
echo send "chmod -R 755 $server_path\r"
echo expect "$"
echo send "exit\r"
echo.
echo puts "部署完成！"
) > "%TEMP%\deploy_expect.exp"

REM 使用 plink (来自 PuTTY) 或 OpenSSH
echo.
echo [3/4] 开始上传文件...
echo.

REM 检查是否有 sshpass 可用（如果安装了 Git Bash 或 WSL）
where sshpass >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 使用 sshpass 进行自动化部署...
    sshpass -p %SERVER_PASS% ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH%/.. && mkdir -p %BACKUP_DIR% && cp -r index/* %BACKUP_DIR%/ 2>/dev/null || echo '首次部署，无需备份'"
    sshpass -p %SERVER_PASS% scp -o StrictHostKeyChecking=no -r "%LOCAL_DIST%"/* %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/
) else (
    echo 未检测到 sshpass，请手动输入密码或将密码复制粘贴...
    echo 如果频繁部署，建议安装 Git Bash 或使用 sshpass
    echo.
    ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH%/.. && mkdir -p %BACKUP_DIR% && cp -r index/* %BACKUP_DIR%/ 2>/dev/null || echo '首次部署，无需备份'"
    scp -o StrictHostKeyChecking=no -r "%LOCAL_DIST%"/* %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/
)

echo.
echo [4/4] 部署完成！
echo.
echo 备份位置: %SERVER_PATH%/../%BACKUP_DIR%
echo 部署位置: %SERVER_PATH%
echo.

REM 清理临时文件
if exist "%TEMP%\deploy_expect.exp" del "%TEMP%\deploy_expect.exp"

pause
