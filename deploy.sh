#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="vhuinfoseclab"
DOMAIN="vhuinfosec.io.vn"
APP_PORT="3002"
EMAIL="[dinhvaren8@gmail.com](mailto:dinhvaren8@gmail.com)"

echo "🔁 Pulling latest code..."
git pull origin main || true

echo "🚀 Building and starting containers..."
docker compose up -d --build

echo "⏳ Waiting for app to listen on port ${APP_PORT}..."
sleep 3

echo "🌐 Writing Nginx config..."

if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
cat > "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
listen 80;
listen [::]:80;

```
server_name ${DOMAIN} www.${DOMAIN};

return 301 https://\$host\$request_uri;
```

}

server {
listen 443 ssl http2;
listen [::]:443 ssl http2;

```
server_name ${DOMAIN} www.${DOMAIN};

ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

location / {
    proxy_pass http://127.0.0.1:${APP_PORT};
    proxy_http_version 1.1;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cache_bypass \$http_upgrade;
}
```

}
EOF
else
cat > "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
listen 80;
listen [::]:80;

```
server_name ${DOMAIN} www.${DOMAIN};

location / {
    proxy_pass http://127.0.0.1:${APP_PORT};
    proxy_http_version 1.1;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cache_bypass \$http_upgrade;
}
```

}
EOF
fi

ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"

nginx -t
systemctl reload nginx

if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
echo "🔐 Getting SSL certificate..."
apt update
apt install -y certbot python3-certbot-nginx

certbot --nginx 
-d "${DOMAIN}" 
-d "[www.${DOMAIN](http://www.${DOMAIN)}" 
--email "${EMAIL}" 
--agree-tos 
--no-eff-email 
--redirect
fi

nginx -t
systemctl reload nginx

echo "✅ Deploy completed!"
echo "🌍 Visit: https://${DOMAIN}"
