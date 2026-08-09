#!/usr/bin/env bash
# Redirect lr.ronohub.com → https://ronolr.com (keeps SSL cert for legacy URL).
set -euo pipefail

VHOST="/usr/local/fastpanel2-nginx/vhosts/lr.ronohub.com.conf"
TARGET="${REDIRECT_TO:-https://ronolr.com}"

cat > "$VHOST" <<NGINX
server {
    listen 80;
    server_name lr.ronohub.com;
    location ^~ /.well-known/acme-challenge/ {
        root /usr/local/fastpanel2-nginx/etc/html;
        default_type text/plain;
        try_files \$uri =404;
    }
    location / { return 301 ${TARGET}\$request_uri; }
}
server {
    listen 443 ssl;
    server_name lr.ronohub.com;
    ssl_certificate /etc/letsencrypt/live/lr.ronohub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lr.ronohub.com/privkey.pem;
    location / { return 301 ${TARGET}\$request_uri; }
}
NGINX

nginx -t
systemctl reload fastpanel2-nginx
echo "lr.ronohub.com now redirects to ${TARGET}"
