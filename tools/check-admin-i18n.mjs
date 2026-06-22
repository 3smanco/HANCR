#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = process.cwd();
const adminSrc = path.join(root, 'apps', 'admin-panel', 'src');
const messagesPath = path.join(adminSrc, 'i18n', 'messages.ts');

function loadMessages() {
  const source = fs.readFileSync(messagesPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      esModuleInterop: true,
    },
    fileName: messagesPath,
  }).outputText;

  const module = { exports: {} };
  const fn = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    transpiled,
  );
  fn(module.exports, require, module, messagesPath, path.dirname(messagesPath));
  return module.exports.messages;
}

function listSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function hasPath(obj, dottedPath) {
  return dottedPath.split('.').every((segment) => {
    if (obj && typeof obj === 'object' && segment in obj) {
      obj = obj[segment];
      return true;
    }
    return false;
  });
}

function flattenKeys(obj, prefix = '') {
  const keys = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      for (const child of flattenKeys(value, next)) {
        keys.add(child);
      }
    } else {
      keys.add(next);
    }
  }
  return keys;
}

const messages = loadMessages();
const locales = Object.keys(messages);
const [baseLocale] = locales;
const failures = [];

if (!baseLocale) {
  failures.push('No locales exported from admin-panel messages.');
}

if (baseLocale) {
  const baseKeys = flattenKeys(messages[baseLocale]);
  for (const locale of locales.slice(1)) {
    const localeKeys = flattenKeys(messages[locale]);
    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        failures.push(`Locale ${locale} is missing key ${key}`);
      }
    }
    for (const key of localeKeys) {
      if (!baseKeys.has(key)) {
        failures.push(`Locale ${locale} has extra key ${key}`);
      }
    }
  }
}

const literalCallPattern = /\bt\s*\(\s*(['"])((?:\\.|(?!\1).)+)\1/g;
const usedKeys = new Map();

for (const file of listSourceFiles(adminSrc)) {
  const source = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = literalCallPattern.exec(source)) != null) {
    const key = match[2];
    if (!key || key.includes('${')) continue;
    const rel = path.relative(root, file).replaceAll(path.sep, '/');
    if (!usedKeys.has(key)) usedKeys.set(key, new Set());
    usedKeys.get(key).add(rel);
  }
}

for (const [key, locations] of [...usedKeys.entries()].sort()) {
  for (const locale of locales) {
    if (!hasPath(messages[locale], key)) {
      failures.push(
        `Missing admin-panel i18n key "${key}" for locale ${locale} (${[
          ...locations,
        ].join(', ')})`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Admin panel i18n check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Admin panel i18n check passed (${usedKeys.size} literal keys).`);
