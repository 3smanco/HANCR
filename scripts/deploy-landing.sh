#!/bin/bash
# نشر موقع hancr.com (static export) — pull + ضبط env + build + rsync.
set -e
cd /opt/hancr

echo "[1/4] git pull..."
git pull origin main 2>&1 | tail -2

cd /opt/hancr/apps/landing

echo "[2/4] write .env.production (مشروع Google Cloud الجديد hancr-500516)..."
# .env.production مُتجاهَل في git، لذا يُكتب هنا بشكل قاطع (يضمن المفاتيح الجديدة عند كل نشر).
cat > .env.production <<'ENVEOF'
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyAQ00g8v0BEo4m7V2R8RmoVwJiq-1I5RrQ
NEXT_PUBLIC_RIDER_API_URL=https://api.hancr.com/rider/graphql
NEXT_PUBLIC_GOOGLE_CLIENT_ID=997014889761-64eq7g8i3fnidrdcnhnkpds47ru8r3ap.apps.googleusercontent.com
ENVEOF
echo "  written"

echo "[3/4] next build (static export → out/)..."
npx next build 2>&1 | tail -8

echo "[4/4] rsync out/ → /var/www/hancr-landing (keep downloads)..."
sudo rsync -a --delete --exclude downloads out/ /var/www/hancr-landing/
sudo chown -R www-data:www-data /var/www/hancr-landing
echo "DONE-LANDING"
