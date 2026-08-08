#!/usr/bin/env bash
# Safe deploy for lr-load on existing FASTPANEL VPS — does not touch other PM2 apps.
set -euo pipefail

APP_DIR="${APP_DIR:-/root/lr-load}"
PORT="${LR_PORT:-3010}"
DOMAIN="${LR_DOMAIN:-ronolr.com}"
NODE_VERSION="${NODE_VERSION:-20}"

export NVM_DIR="/root/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" --no-use

echo "==> Node $NODE_VERSION via nvm..."
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"
NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

echo "==> Uploads stored in MySQL (no disk storage needed)"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing .env in $APP_DIR" >&2
  exit 1
fi

echo "==> Install dependencies..."
"$NPM_BIN" install --legacy-peer-deps

echo "==> Database migrate..."
npx prisma migrate resolve --applied 20260627120000_driver_to_executive 2>/dev/null || true
npx prisma migrate resolve --applied 20260627140000_fix_empty_user_roles 2>/dev/null || true
npx prisma migrate resolve --applied 20260807000000_company_pending_and_email_otp 2>/dev/null || true
npx prisma migrate resolve --applied 20260807120000_contact_enquiry 2>/dev/null || true
npx prisma migrate deploy || npx prisma db push

echo "==> Build..."
"$NPM_BIN" run build

echo "==> PM2 (port $PORT only)..."
pm2 delete rono-lr 2>/dev/null || true
PORT="$PORT" pm2 start "$NPM_BIN" --name rono-lr --cwd "$APP_DIR" -- run start
pm2 save

echo "==> Deploy complete. rono-lr on 127.0.0.1:$PORT"
pm2 list | grep rono-lr || true
