#!/bin/bash
# Deploy script — runs on server during CI/CD
set -e

APP_DIR="/var/www/ielts-app"

echo "--- git pull ---"
cd "$APP_DIR"
git pull origin main

echo "--- frontend build ---"
cd "$APP_DIR/frontend"
npm install --prefer-offline
npm run build

echo "--- restart backend ---"
systemctl restart ielts-app

echo "--- done ---"
systemctl status ielts-app --no-pager -l | head -20
