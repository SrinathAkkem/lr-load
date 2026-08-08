#!/usr/bin/env bash
# Configure FASTPANEL nginx vhost for ronolr.com → PM2 app on LR_PORT (default 3010).
# Run on VPS as root after DNS A record points to this server.
set -euo pipefail

PORT="${LR_PORT:-3010}"
VHOST="/usr/local/fastpanel2-nginx/vhosts/ronolr.com.conf"
WEBROOT="/usr/local/fastpanel2-nginx/etc/html"
EMAIL="${CERTBOT_EMAIL:-rayudugroup01@gmail.com}"

write_http_vhost() {
  cat > "$VHOST" <<NGINX
server {
    listen 80;
    server_name ronolr.com www.ronolr.com;
    client_max_body_size 20m;
    location ^~ /.well-known/acme-challenge/ {
        root $WEBROOT;
        default_type text/plain;
        try_files \$uri =404;
    }
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
NGINX
}

write_https_vhost() {
  cat > "$VHOST" <<NGINX
server {
    listen 80;
    server_name ronolr.com www.ronolr.com;
    location ^~ /.well-known/acme-challenge/ {
        root $WEBROOT;
        default_type text/plain;
        try_files \$uri =404;
    }
    location / { return 301 https://\$host\$request_uri; }
}
server {
    listen 443 ssl;
    server_name ronolr.com www.ronolr.com;
    ssl_certificate /etc/letsencrypt/live/ronolr.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ronolr.com/privkey.pem;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
NGINX
}

echo "==> HTTP vhost at $VHOST"
write_http_vhost
nginx -t
systemctl reload fastpanel2-nginx

echo "==> Requesting Let's Encrypt cert (DNS must point here first)..."
if certbot certonly --webroot -w "$WEBROOT" \
  -d ronolr.com -d www.ronolr.com \
  --non-interactive --agree-tos -m "$EMAIL"; then
  echo "==> SSL obtained — enabling HTTPS vhost"
  write_https_vhost
  nginx -t
  systemctl reload fastpanel2-nginx
  echo "Done: https://ronolr.com"
else
  echo "Certbot failed — fix DNS first (A record ronolr.com → $(curl -s ifconfig.me)), then re-run this script."
  exit 1
fi
