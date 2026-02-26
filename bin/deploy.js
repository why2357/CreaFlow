#!/usr/bin/env node

/**
 * ========================================
 * 创流 (Forge HiVision) 部署脚本
 * 用于将 dist 目录上传到内网服务器
 * ========================================
 *
 * 使用方法:
 *   node bin/deploy.js
 *
 * 或安装为 npm script:
 *   npm run deploy
 */

const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

// ============ 配置 ============
const CONFIG = {
    server: {
        host: '172.28.104.54',
        username: 'ahui',
        password: 'ln2718281828',
        path: '/opt/1panel/www/sites/creaflow/index'
    },
    local: {
        distPath: path.join(__dirname, '..', 'dist')
    }
};

// ============ 工具函数 ============

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        step: '🔄'
    };
    console.log(`${icons[type] || ''} ${timestamp} ${message}`);
}

function generateBackupName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `index_backup_${year}${month}${day}${hour}${minute}${second}`;
}

// ============ 部署函数 ============

async function checkRequirements() {
    log('检查环境依赖...', 'step');

    // 检查 dist 目录
    if (!fs.existsSync(CONFIG.local.distPath)) {
        log('dist 目录不存在！请先运行 npm run build:prod', 'error');
        process.exit(1);
    }

    // 检查 node-ssh 是否安装
    try {
        require('node-ssh');
    } catch (error) {
        log('未找到 node-ssh 模块，正在安装...', 'warning');
        log('请运行: npm install node-ssh --save-dev', 'info');
        process.exit(1);
    }

    log('环境检查通过', 'success');
}

async function deploy() {
    console.log('\n========================================');
    console.log('   创流 (Forge HiVision) 部署脚本');
    console.log('========================================\n');

    // 1. 检查环境
    await checkRequirements();

    // 2. 生成备份目录名
    const backupDir = generateBackupName();
    log(`备份目录: ${backupDir}`);

    const { host, username, password, path: serverPath } = CONFIG.server;
    const localDist = CONFIG.local.distPath;

    // 3. 创建 SSH 连接
    log('连接服务器...', 'step');

    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host,
            username,
            password,
            port: 22,
            readyTimeout: 30000,
            keepaliveInterval: 10000
        });

        log('服务器连接成功', 'success');

        // 4. 备份现有文件
        log('备份现有文件...', 'step');

        const backupResult = await ssh.execCommand(
            `cd ${serverPath}/.. && mkdir -p ${backupDir} && cp -r index/* ${backupDir}/ 2>/dev/null && echo "备份成功" || echo "首次部署，无需备份"`
        );

        if (backupResult.stdout.includes('备份成功')) {
            log('备份完成', 'success');
        } else {
            log('首次部署，无需备份', 'info');
        }

        // 5. 清空目标目录
        log('清空目标目录...', 'step');
        await ssh.execCommand(`rm -rf ${serverPath}/*`);

        // 6. 上传文件 - 使用逐个文件上传的方式
        log('上传文件到服务器...', 'step');

        // 确保目标目录存在
        await ssh.execCommand(`mkdir -p ${serverPath}`);

        // 获取所有需要上传的文件
        const files = getAllFiles(localDist);
        let uploadedCount = 0;
        let totalCount = files.length;

        for (const file of files) {
            const relativePath = path.relative(localDist, file);
            const remotePath = path.posix.join(serverPath, relativePath.replace(/\\/g, '/'));
            const remoteDir = path.dirname(remotePath);

            try {
                // 确保远程目录存在
                await ssh.execCommand(`mkdir -p '${remoteDir}'`);

                // 检查是文件还是目录
                const stat = fs.statSync(file);

                if (stat.isFile()) {
                    // 上传文件
                    await ssh.putFile(file, remotePath);
                } else if (stat.isDirectory()) {
                    // 创建目录
                    await ssh.execCommand(`mkdir -p '${remotePath}'`);
                }

                uploadedCount++;
                if (uploadedCount % 50 === 0 || uploadedCount === totalCount) {
                    log(`进度: ${uploadedCount}/${totalCount} (${Math.round(uploadedCount / totalCount * 100)}%)`, 'info');
                }
            } catch (error) {
                log(`上传失败: ${relativePath} - ${error.message}`, 'error');
            }
        }

        log(`文件上传完成: ${uploadedCount}/${totalCount}`, 'success');

        // 7. 设置权限
        log('设置文件权限...', 'step');

        const chmodResult = await ssh.execCommand(`chmod -R 755 ${serverPath}`);

        if (chmodResult.stderr) {
            log(`权限设置警告: ${chmodResult.stderr}`, 'warning');
        } else {
            log('权限设置完成', 'success');
        }

        // 8. 显示上传的文件信息
        log('检查部署结果...', 'step');

        const checkResult = await ssh.execCommand(`ls -la ${serverPath} | head -20`);
        log(`服务器文件列表:\n${checkResult.stdout}`, 'info');

        // 关闭连接
        ssh.dispose();

        log('部署完成！', 'success');
        console.log('\n========================================');
        console.log(`备份位置: ${serverPath}/../${backupDir}`);
        console.log(`部署位置: ${serverPath}`);
        console.log(`服务器: ${host}`);
        console.log('========================================\n');

    } catch (error) {
        ssh.dispose();

        if (error.message.includes('All configured authentication')) {
            log('认证失败: 用户名或密码不正确', 'error');
            log('请检查 CONFIG.server 中的配置', 'info');
        } else if (error.message.includes('ECONNREFUSED')) {
            log('连接失败: 无法连接到服务器', 'error');
            log('请检查服务器 IP 和网络连接', 'info');
        } else if (error.message.includes('timeout')) {
            log('连接超时: 服务器响应时间过长', 'error');
            log('请检查网络连接和服务器状态', 'info');
        } else {
            log(`部署失败: ${error.message}`, 'error');
            console.error(error);
        }

        process.exit(1);
    }
}

// 递归获取所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    // 也添加目录本身
    arrayOfFiles.push(dirPath);
    return arrayOfFiles;
}

// ============ 主程序 ============

if (require.main === module) {
    deploy().catch(error => {
        log(`部署失败: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { deploy, CONFIG };
