#!/bin/bash
# نشر الموجة G1 — دخول الإيميل/Google (خلفي): pull + deps + migration + restart
set -e
cd /opt/hancr

echo "[1/4] git pull..."
git pull origin main 2>&1 | tail -3

echo "[2/4] npm install (new deps: nodemailer, google-auth-library)..."
npm install --legacy-peer-deps --no-audit --no-fund 2>&1 | tail -4

echo "[3/4] migration:run..."
set -a
source .env.prod
set +a
TS_NODE_PROJECT=tsconfig.base.json \
  DATABASE_HOST=127.0.0.1 DATABASE_PORT=5432 \
  npx typeorm-ts-node-commonjs migration:run \
  -d libs/database/src/lib/data-source.ts 2>&1 | tail -20

echo "[4/4] pm2 restart APIs..."
pm2 restart rider-api driver-api admin-api 2>&1 | tail -6
sleep 8
pm2 list 2>&1 | grep -E 'rider-api|driver-api|admin-api'
echo "DONE-G1"
