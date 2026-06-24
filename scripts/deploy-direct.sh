#!/usr/bin/env bash
# Direct PM2 deploy for the current production server.
#
# Defaults are intentionally conservative:
# - pulls main with --ff-only
# - installs dependencies
# - builds compiled API bundles
# - builds the admin-panel Next standalone output
# - refreshes PM2 from the tracked ecosystem.config.js
# - does not run migrations unless RUN_MIGRATIONS=1
set -euo pipefail

APP_ROOT="${HANCR_ROOT:-/opt/hancr}"
BRANCH="${HANCR_DEPLOY_BRANCH:-main}"
INSTALL_DEPS="${INSTALL_DEPS:-1}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-0}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"

export HANCR_ROOT="$APP_ROOT"

step() {
  printf '\n==> %s\n' "$*"
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local attempts="${4:-30}"
  local delay_seconds="${5:-2}"

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if [[ "$method" == "HEAD" ]]; then
      if curl -fsSI "$url" >/dev/null 2>&1; then
        echo "$label is ready"
        return 0
      fi
    elif curl -fsS "$url" >/dev/null 2>&1; then
      echo "$label is ready"
      return 0
    fi

    if [[ "$attempt" -lt "$attempts" ]]; then
      sleep "$delay_seconds"
    fi
  done

  echo "$label did not become ready: $url" >&2
  return 1
}

cd "$APP_ROOT"

step "Repository"
if [[ "$SKIP_GIT_PULL" != "1" ]]; then
  git pull --ff-only origin "$BRANCH"
else
  echo "Skipping git pull because SKIP_GIT_PULL=1"
fi
git status --short --branch
git rev-parse --short HEAD

if [[ "$INSTALL_DEPS" != "0" ]]; then
  step "Install dependencies"
  npm install --legacy-peer-deps --no-audit --no-fund
fi

if [[ "$RUN_MIGRATIONS" == "1" ]]; then
  step "Run database migrations"
  set -a
  # shellcheck disable=SC1091
  . ./.env.prod
  set +a
  DATABASE_HOST="${PM2_DATABASE_HOST:-127.0.0.1}" \
    REDIS_HOST="${PM2_REDIS_HOST:-127.0.0.1}" \
    TS_NODE_PROJECT=tsconfig.base.json \
    npx typeorm-ts-node-commonjs migration:run \
    -d libs/database/src/lib/data-source.ts
else
  step "Skip migrations"
  echo "Set RUN_MIGRATIONS=1 to run TypeORM migrations during deploy."
fi

step "Build API bundles"
npm run build:apis:prod

step "Build admin panel standalone output"
(cd apps/admin-panel && npm run build)

step "Refresh stale PM2 definitions"
node <<'NODE'
const childProcess = require('child_process');
const path = require('path');

const root = process.env.HANCR_ROOT || '/opt/hancr';
const expected = {
  'rider-api': path.join(root, 'dist/apps/rider-api/main.js'),
  'driver-api': path.join(root, 'dist/apps/driver-api/main.js'),
  'admin-api': path.join(root, 'dist/apps/admin-api/main.js'),
  'admin-panel': path.join(root, 'apps/admin-panel/.next/standalone/server.js'),
};

let processes = [];
try {
  processes = JSON.parse(childProcess.execSync('pm2 jlist', { encoding: 'utf8' }));
} catch (error) {
  console.log('PM2 process list is not available yet; continuing with startOrReload.');
}

for (const proc of processes) {
  const name = proc.name;
  const expectedPath = expected[name];
  if (!expectedPath) continue;

  const actualPath = proc.pm2_env?.pm_exec_path;
  if (actualPath && path.resolve(actualPath) !== path.resolve(expectedPath)) {
    console.log(`Deleting stale PM2 app ${name}: ${actualPath} -> ${expectedPath}`);
    childProcess.execFileSync('pm2', ['delete', name], { stdio: 'inherit' });
  }
}
NODE

step "Start or reload PM2 apps"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
pm2 status --no-color

step "Health checks"
wait_for_url "rider-api" http://127.0.0.1:3000/health/ready
wait_for_url "driver-api" http://127.0.0.1:3001/health/ready
wait_for_url "admin-api" http://127.0.0.1:3002/health/ready
wait_for_url "admin-panel" http://127.0.0.1:3003/login HEAD

echo "Deploy complete."
