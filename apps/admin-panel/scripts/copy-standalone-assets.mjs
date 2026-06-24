#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standaloneDir = path.join(root, '.next', 'standalone');

function copyDirIfExists(source, target) {
  if (!fs.existsSync(source)) return;
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  console.log(`Copied ${path.relative(root, source)} -> ${path.relative(root, target)}`);
}

if (!fs.existsSync(standaloneDir)) {
  console.warn('Standalone output not found; skipping asset copy.');
  process.exit(0);
}

copyDirIfExists(
  path.join(root, '.next', 'static'),
  path.join(standaloneDir, '.next', 'static'),
);
copyDirIfExists(path.join(root, 'public'), path.join(standaloneDir, 'public'));
