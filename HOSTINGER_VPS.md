# Hostinger VPS — Rono LR

Deploy the Next.js API + web app on Ubuntu with **local disk uploads**, MySQL, nginx, and PM2.

## Requirements

- Hostinger KVM VPS, Ubuntu 22.04+, ≥2 GB RAM
- Domain pointing to the VPS IP (e.g. `lr.yourdomain.com`)

## Quick setup

```bash
ssh root@YOUR_VPS_IP
export REPO_URL="https://github.com/SrinathAkkem/lr-load-v2.git"
export DOMAIN="lr.yourdomain.com"
bash -c "$(curl -fsSL https://raw.githubusercontent.com/SrinathAkkem/lr-load-v2/main/scripts/vps-setup.sh)"
```

Or clone and run locally:

```bash
git clone https://github.com/SrinathAkkem/lr-load-v2.git /root/lr-load-v2
chmod +x scripts/vps-setup.sh
DOMAIN=ronolr.com ./scripts/vps-setup.sh
```

## Environment (`.env`)

Copy `.env.production.example` → `.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL on `127.0.0.1` |
| `NEXT_PUBLIC_APP_URL` | `https://lr.yourdomain.com` |
| `AUTH_SECRET` | Session signing (48+ random bytes) |
| `UPLOAD_DIR` | `/var/lib/rono/uploads` |
| `APP_ENV` | `production` |
| `TWILIO_*` | SMS OTP in production |

## Uploads & PDFs

- Photos, signatures, logos, stamps → `UPLOAD_DIR` on disk
- URLs stored as `/uploads/{kind}/{file}` — served by nginx (`alias`) or Next.js
- PDF generation reads images from the same `UPLOAD_DIR` via `resolveUploadFilePath()`
- nginx `client_max_body_size 20m` allows photo uploads

Symlink (created by setup script):

```bash
mkdir -p /var/lib/rono/uploads/{photos,signatures,logos,stamps}
ln -sfn /var/lib/rono/uploads /root/lr-load-v2/public/uploads
```

## Redeploy

```bash
cd /root/lr-load-v2
git pull
npm install --legacy-peer-deps
npx prisma migrate deploy
npm run build
pm2 restart rono-lr
```

## Mobile app

Set API URL to your VPS domain:

```bash
# lr-mobile/.env
EXPO_PUBLIC_API_URL=https://lr.yourdomain.com
```

Rebuild the Expo app after changing the URL.

## Health check

```bash
curl https://lr.yourdomain.com/api/health
```

## Twilio (production OTP)

1. Create a Twilio account and buy an SMS-capable number
2. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` to `.env`
3. Set `APP_ENV=production`
4. `pm2 restart rono-lr`

In development (`APP_ENV=development`), OTP is logged server-side and `123456` always works.
