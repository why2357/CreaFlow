#!/bin/bash

# ========================================
# 创流 (Forge HiVision) 部署脚本
# 用于将 dist 目录上传到内网服务器
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============ 配置 ============
SERVER_HOST="172.28.104.54"
SERVER_USER="ahui"
SERVER_PASS="ln2718281828"
SERVER_PATH="/opt/1panel/www/sites/creaflow/index"
LOCAL_DIST="$(cd "$(dirname "$0")/.." && pwd)/dist"

# ============ 工具函数 ============

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# ============ 部署函数 ============

check_requirements() {
    log_step "检查环境依赖..."

    # 检查 dist 目录
    if [ ! -d "$LOCAL_DIST" ]; then
        log_error "dist 目录不存在！请先运行 npm run build:prod"
        exit 1
    fi

    # 检查 SSH 客户端
    if ! command -v ssh &> /dev/null; then
        log_error "未找到 SSH 客户端"
        exit 1
    fi

    log_success "环境检查通过"
}

generate_backup_name() {
    date +"%Y%m%d%H%M%S"
}

deploy() {
    echo ""
    echo "========================================"
    echo "   创流 (Forge HiVision) 部署脚本"
    echo "========================================"
    echo ""

    # 1. 检查环境
    check_requirements

    # 2. 生成备份目录名
    BACKUP_DIR="index_backup_$(generate_backup_name)"
    log_info "备份目录: $BACKUP_DIR"

    # 3. 检查 sshpass
    if command -v sshpass &> /dev/null; then
        log_step "使用 sshpass 自动化部署..."

        # 备份现有文件
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} \
            "cd ${SERVER_PATH}/.. && mkdir -p ${BACKUP_DIR} && cp -r index/* ${BACKUP_DIR}/ 2>/dev/null || echo '首次部署，无需备份'"

        # 上传新文件
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r ${LOCAL_DIST}/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

        # 设置权限
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} \
            "chmod -R 755 ${SERVER_PATH}"

    else
        log_warning "未安装 sshpass，将手动输入密码"
        log_info "提示: 安装 sshpass 可实现自动化部署"
        log_info "  Ubuntu/Debian: sudo apt-get install sshpass"
        log_info "  CentOS/RHEL: sudo yum install sshpass"
        log_info "  Mac: brew install sshpass"
        echo ""

        # 备份现有文件
        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} \
            "cd ${SERVER_PATH}/.. && mkdir -p ${BACKUP_DIR} && cp -r index/* ${BACKUP_DIR}/ 2>/dev/null || echo '首次部署，无需备份'"

        # 上传新文件
        scp -o StrictHostKeyChecking=no -r ${LOCAL_DIST}/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

        # 设置权限
        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} \
            "chmod -R 755 ${SERVER_PATH}"
    fi

    log_success "部署完成！"
    echo ""
    echo "========================================"
    echo "备份位置: ${SERVER_PATH}/../${BACKUP_DIR}"
    echo "部署位置: ${SERVER_PATH}"
    echo "服务器: ${SERVER_HOST}"
    echo "========================================"
    echo ""
}

# ============ 主程序 ============

deploy
