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

echo "==> Ensure NEXT_PUBLIC_APP_URL=https://$DOMAIN (baked in at build time)..."
if grep -q '^NEXT_PUBLIC_APP_URL=' .env; then
  sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"https://$DOMAIN\"|" .env
else
  echo "NEXT_PUBLIC_APP_URL=\"https://$DOMAIN\"" >> .env
fi
sed -i \
  -e 's|lr\.ronohub\.com|'"$DOMAIN"'|g' \
  -e 's|lightblue-partridge[^"]*|'"$DOMAIN"'|g' \
  .env

if ! grep -q '^APP_ENV=' .env; then
  echo 'APP_ENV="production"' >> .env
fi
if ! grep -q '^OTP_SMS_ENABLED=' .env; then
  echo 'OTP_SMS_ENABLED="true"' >> .env
fi
if ! grep -q '^CONTACT_EMAIL_ENABLED=' .env; then
  echo 'CONTACT_EMAIL_ENABLED="true"' >> .env
fi
if ! grep -q '^CONTACT_NOTIFY_EMAIL=' .env; then
  echo 'CONTACT_NOTIFY_EMAIL="info@rayudugroup.in"' >> .env
fi

if grep -q '^SMTP_PASS=$' .env || grep -q '^SMTP_PASS=""' .env; then
  echo "WARNING: SMTP_PASS is empty — email OTP and contact form emails will not send until set in .env"
fi

echo "==> Install dependencies..."
"$NPM_BIN" install --legacy-peer-deps

echo "==> Database migrate..."
npx prisma migrate deploy || npx prisma db push

echo "==> Build..."
"$NPM_BIN" run build

echo "==> PM2 (port $PORT only)..."
pm2 delete rono-lr 2>/dev/null || true
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a
PORT="$PORT" pm2 start "$NPM_BIN" --name rono-lr --cwd "$APP_DIR" -- run start
pm2 save

echo "==> Deploy complete. rono-lr on 127.0.0.1:$PORT"
pm2 list | grep rono-lr || true
