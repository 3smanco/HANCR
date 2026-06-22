#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const args = new Set(process.argv.slice(2));
const argv = process.argv.slice(2);
const envArgIndex = argv.indexOf('--env');
const envFile = envArgIndex >= 0 ? argv[envArgIndex + 1] : '.env';
const strict = args.has('--strict') && !args.has('--template');
const template = args.has('--template');

function readEnv(file) {
  const resolved = path.resolve(process.cwd(), file);
  if (!fs.existsSync(resolved)) {
    if (template || strict) {
      return { resolved, values: {}, exists: false };
    }
    return { resolved, values: process.env, exists: false };
  }
  return {
    resolved,
    values: dotenv.parse(fs.readFileSync(resolved, 'utf8')),
    exists: true,
  };
}

const source = readEnv(envFile);
const rows = [];

function hasKey(key) {
  return Object.prototype.hasOwnProperty.call(source.values, key);
}

function valueOf(key) {
  return hasKey(key) ? String(source.values[key] ?? '').trim() : '';
}

function isPlaceholder(value) {
  if (!value) return false;
  const v = value.trim();
  return /^(change_me|your_|YOUR_|YOUR-|YOUR\b|sk_live_YOUR|pk_live_YOUR|whsec_YOUR|firebase-adminsdk@hancr-prod|-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE)/i.test(
    v,
  );
}

function add(level, group, key, message) {
  rows.push({ level, group, key, message });
}

function requireKey(group, key, options = {}) {
  const value = valueOf(key);
  if (!hasKey(key) || !value) {
    add('fail', group, key, 'missing');
    return;
  }
  if (!template && isPlaceholder(value)) {
    add('fail', group, key, 'placeholder value');
    return;
  }
  if (!template && options.minLength && value.length < options.minLength) {
    add('fail', group, key, `too short; expected >= ${options.minLength}`);
    return;
  }
  if (!template && options.disallow?.includes(value)) {
    add('fail', group, key, `unsafe value: ${value}`);
    return;
  }
  add('pass', group, key, 'configured');
}

function warnKey(group, key, message = 'not configured') {
  const value = valueOf(key);
  if (!hasKey(key) || !value || (!template && isPlaceholder(value))) {
    add('warn', group, key, message);
  } else {
    add('pass', group, key, 'configured');
  }
}

function requireAny(group, keys, message) {
  const configured = keys.filter((key) => {
    const value = valueOf(key);
    return hasKey(key) && value && (template || !isPlaceholder(value));
  });
  if (configured.length === 0) {
    add('fail', group, keys.join(' | '), message);
  } else {
    add('pass', group, configured.join(' | '), 'configured');
  }
}

function warnAny(group, keys, message) {
  const configured = keys.filter((key) => {
    const value = valueOf(key);
    return hasKey(key) && value && (template || !isPlaceholder(value));
  });
  if (configured.length === 0) {
    add('warn', group, keys.join(' | '), message);
  } else {
    add('pass', group, configured.join(' | '), 'configured');
  }
}

if (!source.exists) {
  add('fail', 'env', envFile, `file not found: ${source.resolved}`);
}

requireKey('runtime', 'NODE_ENV');
if (!template && strict && valueOf('NODE_ENV') !== 'production') {
  add('fail', 'runtime', 'NODE_ENV', 'must be production for strict launch check');
}

for (const key of [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
]) {
  requireKey('data', key);
}
warnKey('data', 'REDIS_PASSWORD', 'recommended for production Redis');

for (const key of ['JWT_SECRET', 'JWT_DRIVER_SECRET', 'ADMIN_JWT_SECRET']) {
  requireKey('secrets', key, { minLength: 32 });
}

if (!template) {
  const jwtValues = ['JWT_SECRET', 'JWT_DRIVER_SECRET', 'ADMIN_JWT_SECRET'].map(
    valueOf,
  );
  if (new Set(jwtValues.filter(Boolean)).size !== jwtValues.filter(Boolean).length) {
    add('fail', 'secrets', 'JWT_*', 'JWT secrets must be unique');
  }
}

requireKey('security', 'CORS_ORIGINS');
requireKey('security', 'ADMIN_CORS_ORIGINS');
if (!template) {
  for (const key of ['CORS_ORIGINS', 'ADMIN_CORS_ORIGINS']) {
    if (valueOf(key).split(',').some((origin) => origin.trim() === '*')) {
      add('fail', 'security', key, 'wildcard origin is not allowed');
    }
  }
}

requireKey('security', 'ADMIN_DEFAULT_EMAIL');
requireKey('security', 'ADMIN_DEFAULT_PASSWORD', {
  minLength: 16,
  disallow: ['change_me_in_production', 'admin123456'],
});

const allowTestPhones = valueOf('ALLOW_TEST_PHONES');
if (allowTestPhones.toLowerCase() === 'true') {
  add('fail', 'security', 'ALLOW_TEST_PHONES', 'must not be true in production');
} else if (!hasKey('ALLOW_TEST_PHONES')) {
  add('warn', 'security', 'ALLOW_TEST_PHONES', 'set explicitly to false');
} else {
  add('pass', 'security', 'ALLOW_TEST_PHONES', 'disabled');
}

requireKey('maps', 'GOOGLE_MAPS_API_KEY');
warnKey('maps', 'NEXT_PUBLIC_GOOGLE_MAPS_KEY', 'admin live map needs a browser key');

requireKey('urls', 'PUBLIC_BASE_URL');
requireKey('urls', 'PUBLIC_API_URL');
requireKey('urls', 'PUBLIC_ADMIN_URL');
requireKey('urls', 'NEXT_PUBLIC_ADMIN_API_URL');

for (const key of [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
]) {
  requireKey('sms', key);
}

requireAny(
  'push',
  ['FIREBASE_PRIVATE_KEY_PATH', 'FIREBASE_PRIVATE_KEY'],
  'Firebase credentials missing',
);
if (valueOf('FIREBASE_PRIVATE_KEY')) {
  warnKey('push', 'FIREBASE_PROJECT_ID', 'needed when using FIREBASE_PRIVATE_KEY');
  warnKey('push', 'FIREBASE_CLIENT_EMAIL', 'needed when using FIREBASE_PRIVATE_KEY');
}

warnAny(
  'uploads',
  ['GCS_SERVICE_ACCOUNT_JSON', 'PUBLIC_UPLOADS_BASE'],
  'driver/rider uploads will fall back to local paths',
);
warnAny(
  'uploads',
  ['GCS_DRIVER_DOCS_BUCKET', 'GCS_RIDER_UPLOADS_BUCKET'],
  'no production upload bucket configured',
);

warnAny(
  'payments',
  ['HYPERPAY_ACCESS_TOKEN', 'MOYASAR_API_KEY', 'STRIPE_SECRET_KEY'],
  'no payment gateway configured',
);
warnAny(
  'payouts',
  ['HYPERPAY_PAYOUT_TOKEN', 'MOYASAR_PAYOUT_TOKEN', 'STRIPE_SECRET_KEY'],
  'no payout gateway configured',
);

for (const key of [
  'SENTRY_DSN_RIDER_API',
  'SENTRY_DSN_DRIVER_API',
  'SENTRY_DSN_ADMIN_API',
]) {
  if (strict) {
    requireKey('monitoring', key);
  } else {
    warnKey('monitoring', key, 'recommended before public launch');
  }
}
warnKey('monitoring', 'SENTRY_RELEASE', 'recommended for deploy traceability');

warnAny(
  'email',
  ['SMTP_HOST', 'EMAIL_FROM'],
  'transactional email is not configured',
);
warnKey('integrations', 'TRANSLATION_API_KEY', 'translation feature disabled');
warnKey('integrations', 'OPEN_EXCHANGE_RATES_APP_ID', 'live FX rates disabled');

const visible = rows.filter((row) => row.level !== 'pass' || args.has('--all'));
const counts = rows.reduce(
  (acc, row) => {
    acc[row.level] += 1;
    return acc;
  },
  { pass: 0, warn: 0, fail: 0 },
);

console.log('HANCR production readiness check');
console.log(`Source: ${source.exists ? source.resolved : 'process.env fallback'}`);
console.log(`Mode: ${template ? 'template' : strict ? 'strict' : 'audit'}`);
console.log('');

for (const row of visible) {
  const label = row.level.toUpperCase().padEnd(4);
  console.log(`${label} [${row.group}] ${row.key}: ${row.message}`);
}

console.log('');
console.log(
  `Summary: ${counts.pass} pass, ${counts.warn} warn, ${counts.fail} fail`,
);

if (counts.fail > 0) {
  process.exitCode = 1;
}
