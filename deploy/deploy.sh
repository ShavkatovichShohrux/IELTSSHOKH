#!/bin/bash
# Deploy script — runs on server during CI/CD
set -e

APP_DIR="/var/www/ielts-app"

echo "--- git pull ---"
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main

echo "--- restart backend ---"
systemctl restart ielts-app

echo "--- restart nginx ---"
systemctl restart nginx || true

echo "--- done ---"
systemctl is-active ielts-app && echo "backend: OK" || echo "backend: FAILED"
systemctl is-active nginx && echo "nginx: OK" || echo "nginx: FAILED"
