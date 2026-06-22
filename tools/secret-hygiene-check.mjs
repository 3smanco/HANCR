#!/usr/bin/env node

import { execFileSync } from 'child_process';

const allowedMatches = [
  {
    path: 'apps/rider-app/android/app/google-services.json',
    reason: 'Firebase Android client config',
  },
  {
    path: 'apps/driver-app/android/app/google-services.json',
    reason: 'Firebase Android client config',
  },
];

const patterns = [
  {
    label: 'Google API key',
    regex: String.raw`AIza[0-9A-Za-z_-]{20,}`,
  },
  {
    label: 'Stripe secret key',
    regex: String.raw`sk_(live|test)_[0-9A-Za-z]{12,}`,
  },
  {
    label: 'Stripe webhook secret',
    regex: String.raw`whsec_[0-9A-Za-z]{12,}`,
  },
  {
    label: 'AWS access key',
    regex: String.raw`AKIA[0-9A-Z]{16}`,
  },
  {
    label: 'SendGrid API key',
    regex: String.raw`SG\.[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}`,
  },
  {
    label: 'Private key block',
    regex: String.raw`-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----`,
  },
  {
    label: 'Known weak historical secret',
    regex: String.raw`OS\.009988\.os`,
  },
];

const excludePathspecs = [
  ':(exclude).env.example',
  ':(exclude).env.prod.example',
  ':(exclude)docs/RELEASE_BUILDS.md',
  ':(exclude)libs/wallet/src/lib/gateways/stripe.gateway.ts',
  ':(exclude)libs/wallet/src/lib/gateways/moyasar.gateway.ts',
  ':(exclude)tools/production-readiness-check.mjs',
  ':(exclude)tools/secret-hygiene-check.mjs',
];

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function isAllowed(line) {
  return allowedMatches.some(({ path }) => line.startsWith(`${path}:`));
}

const findings = [];

for (const pattern of patterns) {
  let output = '';
  try {
    output = git([
      'grep',
      '-n',
      '-I',
      '-E',
      '-e',
      pattern.regex,
      '--',
      '.',
      ...excludePathspecs,
    ]);
  } catch (error) {
    if (error.status === 1) {
      continue;
    }
    throw error;
  }

  for (const line of output.split('\n').filter(Boolean)) {
    if (!isAllowed(line)) {
      findings.push(`${pattern.label}: ${line}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Secret hygiene check failed. Review these tracked matches:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Secret hygiene check passed.');
