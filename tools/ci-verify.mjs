#!/usr/bin/env node

import { spawn } from 'child_process';

const steps = [
  ['Production readiness template', 'npm', ['run', 'readiness:template']],
  ['Type-check rider-api', 'npx', ['tsc', '--noEmit', '-p', 'apps/rider-api/tsconfig.app.json']],
  ['Type-check driver-api', 'npx', ['tsc', '--noEmit', '-p', 'apps/driver-api/tsconfig.app.json']],
  ['Type-check admin-api', 'npx', ['tsc', '--noEmit', '-p', 'apps/admin-api/tsconfig.app.json']],
  ['Type-check admin-panel', 'npm', ['run', 'type-check'], 'apps/admin-panel'],
  ['Build admin-panel', 'npm', ['run', 'build'], 'apps/admin-panel'],
  ['Test rider-api', 'npx', ['nx', 'test', 'rider-api', '--skip-nx-cache', '--runInBand']],
  ['Test admin-api', 'npx', ['nx', 'test', 'admin-api', '--skip-nx-cache', '--runInBand']],
  [
    'Test driver order service',
    'npx',
    [
      'jest',
      'apps/driver-api/src/app/order/order.service.spec.ts',
      '--config',
      'apps/driver-api/jest.config.ts',
      '--runInBand',
    ],
  ],
  ['Whitespace check', 'git', ['diff', '--check']],
  [
    'Generated GraphQL schema check',
    'git',
    [
      'diff',
      '--exit-code',
      '--',
      'apps/rider-api/schema.gql',
      'apps/driver-api/schema.gql',
      'apps/admin-api/schema.gql',
    ],
  ],
];

function runStep([label, command, args, cwd]) {
  return new Promise((resolve, reject) => {
    console.log(`\n==> ${label}`);
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

for (const step of steps) {
  await runStep(step);
}

console.log('\nAll CI verification gates passed.');
