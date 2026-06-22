const { execSync } = require('child_process');

const root = process.env.HANCR_ROOT || '/opt/hancr';
const nodeEnv = process.env.NODE_ENV || 'production';

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
  NODE_ENV: nodeEnv,
  TS_NODE_PROJECT: `${root}/tsconfig.base.json`,
  SENTRY_RELEASE: process.env.SENTRY_RELEASE || gitSha(),
};

const tsNode = `${root}/node_modules/.bin/ts-node`;
const tsNodeArgs = (entry) => [
  '--transpile-only',
  '-r',
  'tsconfig-paths/register',
  entry,
];

module.exports = {
  apps: [
    {
      name: 'rider-api',
      cwd: root,
      script: tsNode,
      args: tsNodeArgs('apps/rider-api/src/main.ts'),
      env: {
        ...commonApiEnv,
        RIDER_API_PORT: process.env.RIDER_API_PORT || '3000',
      },
      autorestart: true,
      max_memory_restart: '800M',
    },
    {
      name: 'driver-api',
      cwd: root,
      script: tsNode,
      args: tsNodeArgs('apps/driver-api/src/main.ts'),
      env: {
        ...commonApiEnv,
        DRIVER_API_PORT: process.env.DRIVER_API_PORT || '3001',
      },
      autorestart: true,
      max_memory_restart: '800M',
    },
    {
      name: 'admin-api',
      cwd: root,
      script: tsNode,
      args: tsNodeArgs('apps/admin-api/src/main.ts'),
      env: {
        ...commonApiEnv,
        ADMIN_API_PORT: process.env.ADMIN_API_PORT || '3002',
      },
      autorestart: true,
      max_memory_restart: '800M',
    },
    {
      name: 'admin-panel',
      cwd: `${root}/apps/admin-panel`,
      script: '/usr/bin/bash',
      args: ['-c', 'npx next start -p 3003'],
      interpreter: 'none',
      env: {
        NODE_ENV: nodeEnv,
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
