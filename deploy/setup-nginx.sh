#!/bin/bash
# Nginx config setup: HTTPS if cert exists, HTTP fallback
set -e

DOMAIN="ieltsshokhspeaking.uz"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
APP_DIR="/var/www/ielts-app"
NGINX_CONF="/etc/nginx/sites-available/ielts-app"

if [ -d "$CERT_DIR" ] && [ -f "$CERT_DIR/fullchain.pem" ]; then
    echo "SSL cert found → configuring HTTPS"

    SSL_OPTS=""
    [ -f /etc/letsencrypt/options-ssl-nginx.conf ] && SSL_OPTS="include /etc/letsencrypt/options-ssl-nginx.conf;"
    DHPARAM=""
    [ -f /etc/letsencrypt/ssl-dhparams.pem ] && DHPARAM="ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"

    cat > "$NGINX_CONF" << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    $SSL_OPTS
    $DHPARAM

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /speaking/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # index.html — never cache (always fresh so new JS is loaded)
    location = /index.html {
        root $APP_DIR/frontend/dist;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Hashed assets (JS/CSS/images) — cache 7 days, immutable
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $APP_DIR/frontend/dist;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

else
    echo "No SSL cert → using HTTP only"
    cp "$APP_DIR/deploy/nginx.conf" "$NGINX_CONF"
fi

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ielts-app

echo "=== nginx test ==="
nginx -t

echo "=== restarting nginx ==="
systemctl restart nginx
systemctl is-active nginx && echo "nginx: OK" || echo "nginx: FAILED"

echo "=== ports ==="
ss -tlnp | grep -E ':80|:443' || echo "WARNING: no ports listening"
