#!/bin/bash
set -e

APP_NAME="vhuinfoseclab"
DOMAIN="vhuinfosec.io.vn"
APP_PORT="3002"

echo "🔁 Pulling latest code..."
git pull origin main || true

echo "📦 Stopping Docker containers..."
sudo docker compose down

echo "📦 Building Docker containers..."
sudo docker compose build --no-cache

echo "🚀 Starting containers..."
sudo docker compose up -d

echo "🌐 Updating Nginx config..."
sudo bash -c "cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME
sudo nginx -t
sudo systemctl reload nginx

if [ ! -d /etc/letsencrypt/live/$DOMAIN ]; then
  echo "🔐 Getting SSL certificate..."
  sudo apt update
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
fi

echo "✅ Deploy completed! Visit: https://$DOMAIN"