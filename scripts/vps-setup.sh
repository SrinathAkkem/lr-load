#!/usr/bin/env bash
# Hostinger VPS bootstrap for Rono LR (Ubuntu 22.04+).
# Run as root on a fresh VPS, then edit /opt/rono/lr-load/.env and redeploy.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/rono/lr-load}"
UPLOAD_DIR="${UPLOAD_DIR:-/var/lib/rono/uploads}"
REPO_URL="${REPO_URL:-https://github.com/SrinathAkkem/lr-load.git}"
DOMAIN="${DOMAIN:-ronolr.com}"

echo "==> Installing Node 20, nginx, MySQL, PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update
apt-get install -y nodejs git nginx mysql-server
npm i -g pm2

echo "==> MySQL: create database and user (edit password in .env after)..."
mysql -uroot <<'SQL' || true
CREATE DATABASE IF NOT EXISTS rono_lr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rono'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG';
GRANT ALL ON rono_lr.* TO 'rono'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> Clone app..."
mkdir -p "$(dirname "$APP_DIR")"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "Repo already exists at $APP_DIR — skipping clone"
fi
cd "$APP_DIR"

echo "==> Upload storage..."
mkdir -p "$UPLOAD_DIR"/{photos,signatures,logos,stamps}
chown -R "$(logname 2>/dev/null || echo root):$(logname 2>/dev/null || echo root)" "$UPLOAD_DIR" || true
ln -sfn "$UPLOAD_DIR" public/uploads

if [ ! -f .env ]; then
  cp .env.production.example .env
  sed -i "s|lr.yourdomain.com|$DOMAIN|g" .env
  echo "Created .env — edit DATABASE_URL, AUTH_SECRET, Twilio before starting."
fi

echo "==> Install + migrate + build..."
npm install --legacy-peer-deps
npx prisma migrate deploy
npm run build

echo "==> PM2..."
pm2 delete rono-lr 2>/dev/null || true
pm2 start "npm run start" --name rono-lr --cwd "$APP_DIR"
pm2 save
pm2 startup systemd -u root --hp /root || true

echo "==> Nginx..."
cat > /etc/nginx/sites-available/rono-lr <<NGINX
server {
  listen 80;
  server_name $DOMAIN;

  client_max_body_size 20m;

  location /uploads/ {
    alias $UPLOAD_DIR/;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_read_timeout 120s;
  }
}
NGINX
ln -sf /etc/nginx/sites-available/rono-lr /etc/nginx/sites-enabled/rono-lr
nginx -t && systemctl reload nginx

echo ""
echo "Done. Next steps:"
echo "  1. Edit $APP_DIR/.env (DB password, AUTH_SECRET, NEXT_PUBLIC_APP_URL, Twilio)"
echo "  2. npm run db:seed   # first time only"
echo "  3. pm2 restart rono-lr"
echo "  4. certbot --nginx -d $DOMAIN"
echo "  5. Mobile: set EXPO_PUBLIC_API_URL=https://$DOMAIN"
