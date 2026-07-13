#!/bin/bash
# Initial server setup — run ONCE on a fresh VPS
set -e

REPO="https://github.com/ShavkatovichShohrux/IELTSSHOKH.git"
APP_DIR="/var/www/ielts-app"
DOMAIN="ieltsshokhspeaking.uz"

echo "=== 1. System update ==="
apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx python3 python3-pip python3-venv curl

echo "=== 2. Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== 3. Clone repo ==="
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "=== 4. Backend Python venv ==="
cd "$APP_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "=== 5. Backend .env ==="
if [ ! -f "$APP_DIR/backend/.env" ]; then
  SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  cat > "$APP_DIR/backend/.env" <<EOF
SECRET_KEY=$SECRET
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
EOF
  echo ".env created with new SECRET_KEY"
else
  echo ".env already exists, skipping"
fi

echo "=== 6. Create data directories ==="
mkdir -p "$APP_DIR/backend/uploads/audio"
mkdir -p "$APP_DIR/backend/topic_files"
mkdir -p "$APP_DIR/backend/speaking_files"
mkdir -p "$APP_DIR/backend/vocab_files"

echo "=== 7. Build frontend ==="
cd "$APP_DIR/frontend"
npm install
npm run build

echo "=== 8. Systemd service ==="
cp "$APP_DIR/deploy/ielts-app.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable ielts-app
systemctl restart ielts-app
systemctl status ielts-app --no-pager

echo "=== 9. Nginx config ==="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/ielts-app
ln -sf /etc/nginx/sites-available/ielts-app /etc/nginx/sites-enabled/ielts-app
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== 10. SSL (Let's Encrypt) ==="
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos \
  --email admin@ieltsshokhspeaking.uz \
  --redirect

echo ""
echo "========================================="
echo " Setup complete!"
echo " Site: https://$DOMAIN"
echo "========================================="
echo ""
echo "NEXT: Upload your data files from local machine:"
echo "  rsync -avz backend/topic_files/   root@45.138.159.130:$APP_DIR/backend/topic_files/"
echo "  rsync -avz backend/speaking_files/ root@45.138.159.130:$APP_DIR/backend/speaking_files/"
echo "  rsync -avz backend/vocab_files/   root@45.138.159.130:$APP_DIR/backend/vocab_files/"
echo "  rsync -avz backend/uploads/       root@45.138.159.130:$APP_DIR/backend/uploads/"
