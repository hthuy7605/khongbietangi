#!/bin/bash

# Dừng script ngay nếu có bất kỳ lệnh nào bị lỗi
set -e

# Khai báo biến đường dẫn
BACKEND_CONTAINER_NAME="khongbietangi_backend"
PROJECT_DIR="/opt/server/khongbietangi"
SERVER_DIR="/opt/server"
FE_SRC_DIR="$PROJECT_DIR/frontend"
BE_SRC_DIR="$PROJECT_DIR/backend"

echo "============================================="
echo "HỆ THỐNG DEPLOY khongbietangi"
echo "Thời gian: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================="

# Hàm pull code từ repo (monorepo - pull từ root)
pull_code() {
    echo ""
    echo "[+] Đang pull code từ repository..."
    cd $PROJECT_DIR
    git pull origin main
    echo " -> Pull code thành công!"
}

# Hàm xử lý Frontend
deploy_fe() {
    echo ""
    echo "[+] Đang xử lý Frontend..."
    cd $FE_SRC_DIR
    pnpm install
    pnpm run build
    echo " -> Frontend build thành công! Các file tĩnh đã cập nhật."
}

# Hàm xử lý Backend
deploy_be() {
    echo ""
    echo "[+] Đang xử lý Backend..."
    echo " -> Backend đã được pull từ root!"
    
    echo "[+] Khởi động lại Docker Container Backend..."
    cd $SERVER_DIR
    docker compose build $BACKEND_CONTAINER_NAME

    echo "[+] Chạy migration database..."
    docker compose run --rm --no-deps $BACKEND_CONTAINER_NAME node dist/migrate.js up

    docker compose up -d $BACKEND_CONTAINER_NAME
}

# Hàm reload Caddy
reload_caddy() {
    echo ""
    echo "[+] Reload Caddy Server..."
    cd $SERVER_DIR
    docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
}

# In menu lựa chọn
echo "Chọn thành phần cần Deploy:"
echo "  1) Chỉ Frontend"
echo "  2) Chỉ Backend"
echo "  3) Tất cả (Frontend + Backend)"
read -p "Nhập số (1/2/3): " choice

# Xử lý theo lựa chọn
case $choice in
    1)
        pull_code
        deploy_fe
        reload_caddy
        ;;
    2)
        pull_code
        deploy_be
        ;;
    3)
        pull_code
        deploy_fe
        deploy_be
        reload_caddy
        ;;
    *)
        echo "Lựa chọn không hợp lệ. Hủy tiến trình."
        exit 1
        ;;
esac

echo ""
echo "============================================="
echo "DEPLOY HOÀN TẤT!"
echo "============================================="
