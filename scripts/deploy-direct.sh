#!/bin/bash
# نشر مباشر بدون Docker — أسرع + أسهل debug
set -e
cd /opt/hancr

echo "═══════════════════════════════════════════════════"
echo "  HANCR — Direct Deploy (Node + pm2)"
echo "═══════════════════════════════════════════════════"

# ─── 1. تثبيت npm deps ───
echo "[1/7] npm install (5-10 min)..."
npm install --legacy-peer-deps --no-audit --no-fund 2>&1 | tail -5

# ─── 2. تثبيت pm2 globally ───
echo "[2/7] Installing pm2..."
sudo npm install -g pm2 2>&1 | tail -2

# ─── 3. تشغيل migrations ───
echo "[3/7] Loading .env.prod variables..."
set -a
source .env.prod
set +a

echo "[4/7] Running TypeORM migrations..."
TS_NODE_PROJECT=tsconfig.base.json \
  DATABASE_HOST=localhost DATABASE_PORT=5432 \
  npx typeorm-ts-node-commonjs migration:run \
  -d libs/database/src/lib/data-source.ts 2>&1 | tail -10

# ─── 5. تطبيق seed users ───
echo "[5/7] Seeding demo users..."
DATABASE_URL="postgresql://$DATABASE_USER:$DATABASE_PASSWORD@localhost:5432/$DATABASE_NAME"
docker exec -i hancr_postgres_prod psql -U $DATABASE_USER -d $DATABASE_NAME < scripts/seed-demo-users.sql 2>&1 | tail -10

# ─── 6. تشغيل APIs بـ pm2 ───
echo "[6/7] Starting APIs with pm2..."
cat > /tmp/ecosystem.config.js <<'PMEOF'
module.exports = {
  apps: [
    {
      name: 'rider-api',
      script: 'npx',
      args: 'ts-node --project apps/rider-api/tsconfig.app.json -r tsconfig-paths/register apps/rider-api/src/main.ts',
      env: {
        NODE_ENV: 'production',
        RIDER_API_PORT: '3000',
        TS_NODE_PROJECT: 'tsconfig.base.json',
      },
      cwd: '/opt/hancr',
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'driver-api',
      script: 'npx',
      args: 'ts-node --project apps/driver-api/tsconfig.app.json -r tsconfig-paths/register apps/driver-api/src/main.ts',
      env: {
        NODE_ENV: 'production',
        DRIVER_API_PORT: '3001',
        TS_NODE_PROJECT: 'tsconfig.base.json',
      },
      cwd: '/opt/hancr',
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'admin-api',
      script: 'npx',
      args: 'ts-node --project apps/admin-api/tsconfig.app.json -r tsconfig-paths/register apps/admin-api/src/main.ts',
      env: {
        NODE_ENV: 'production',
        ADMIN_API_PORT: '3002',
        TS_NODE_PROJECT: 'tsconfig.base.json',
      },
      cwd: '/opt/hancr',
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
PMEOF

# Load .env.prod into pm2 env
pm2 delete all 2>/dev/null || true
cd /opt/hancr && pm2 start /tmp/ecosystem.config.js --env production 2>&1 | tail -10
pm2 save 2>&1 | tail -2
pm2 startup systemd -u $USER --hp $HOME 2>&1 | grep "sudo" | head -1 | bash

echo "[7/7] ✓ APIs running"
sleep 3
pm2 status
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✓ Deployment complete!"
echo "  Logs: pm2 logs"
echo "  Status: pm2 status"
echo "═══════════════════════════════════════════════════"
