const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const root = process.env.HANCR_ROOT || '/opt/hancr';
const nodeEnv = process.env.NODE_ENV || 'production';
const loadedEnv = {};

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return;

  const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] == null) {
      process.env[key] = value;
    }
    if (loadedEnv[key] == null) {
      loadedEnv[key] = process.env[key];
    }
  }
}

loadEnvFile('.env.prod');
loadEnvFile('.env.production');
loadEnvFile('.env');

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

const commonApiEnv = {
  ...loadedEnv,
  NODE_ENV: nodeEnv,
  DATABASE_HOST: process.env.PM2_DATABASE_HOST || 'localhost',
  REDIS_HOST: process.env.PM2_REDIS_HOST || 'localhost',
  SENTRY_RELEASE: process.env.SENTRY_RELEASE || gitSha(),
};

const apiScript = (appName) => `${root}/dist/apps/${appName}/main.js`;

module.exports = {
  apps: [
    {
      name: 'rider-api',
      cwd: root,
      script: apiScript('rider-api'),
      env: {
        ...commonApiEnv,
        RIDER_API_PORT: '3000',
      },
      autorestart: true,
      max_memory_restart: '800M',
    },
    {
      name: 'driver-api',
      cwd: root,
      script: apiScript('driver-api'),
      env: {
        ...commonApiEnv,
        DRIVER_API_PORT: '3001',
      },
      autorestart: true,
      max_memory_restart: '800M',
    },
    {
      name: 'admin-api',
      cwd: root,
      script: apiScript('admin-api'),
      env: {
        ...commonApiEnv,
        ADMIN_API_PORT: '3002',
      },
      autorestart: true,
      max_memory_restart: '800M',
    },
    {
      name: 'admin-panel',
      cwd: `${root}/apps/admin-panel`,
      script: `${root}/apps/admin-panel/.next/standalone/server.js`,
      env: {
        ...loadedEnv,
        NODE_ENV: nodeEnv,
        HOSTNAME: process.env.ADMIN_PANEL_HOSTNAME || '0.0.0.0',
        PORT: process.env.ADMIN_PANEL_PORT || '3003',
        NEXT_PUBLIC_ADMIN_API_URL:
          process.env.NEXT_PUBLIC_ADMIN_API_URL ||
          'http://127.0.0.1:3002/graphql',
        NEXT_PUBLIC_GOOGLE_MAPS_KEY:
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
      },
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
