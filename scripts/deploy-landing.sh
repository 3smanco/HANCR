#!/bin/bash
# نشر موقع hancr.com (static export) — pull + ضبط env + build + rsync.
set -e
cd /opt/hancr

echo "[1/4] git pull..."
git pull origin main 2>&1 | tail -2

cd /opt/hancr/apps/landing

echo "[2/4] ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.production..."
if ! grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID" .env.production 2>/dev/null; then
  echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=390136620892-bkt9ive9las4eqqft40dorpnva676l4l.apps.googleusercontent.com" >> .env.production
  echo "  added"
else
  echo "  already present"
fi

echo "[3/4] next build (static export → out/)..."
npx next build 2>&1 | tail -8

echo "[4/4] rsync out/ → /var/www/hancr-landing (keep downloads)..."
sudo rsync -a --delete --exclude downloads out/ /var/www/hancr-landing/
sudo chown -R www-data:www-data /var/www/hancr-landing
echo "DONE-LANDING"
