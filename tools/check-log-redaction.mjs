#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const failures = [];

const sensitiveFiles = [
  'apps/rider-api/src/app/auth/auth.service.ts',
  'apps/driver-api/src/app/auth/auth.service.ts',
  'libs/notifications/src/lib/sms.service.ts',
  'libs/notifications/src/lib/email.service.ts',
];

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

for (const relativePath of sensitiveFiles) {
  const file = path.join(root, relativePath);
  const source = fs.readFileSync(file, 'utf8');
  const relative = rel(file);
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/(?:logger|console)\.(?:log|warn|error|debug|verbose)\(/.test(line)) {
      continue;
    }

    const window = lines.slice(index, index + 5).join('\n');
    const rawTemplateMatch = window.match(
      /\$\{\s*(phone|email|rawEmail|to|body|subject|code)\s*\}/,
    );

    if (rawTemplateMatch) {
      failures.push(
        `${relative}:${index + 1} log interpolates raw "${rawTemplateMatch[1]}"`,
      );
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.includes('captureException(')) continue;

    const window = lines
      .slice(index, index + 8)
      .join('\n')
      .replaceAll(/\$\{\s*(phone|email)\s*\}/g, '');
    const rawContextMatch = window.match(/\{\s*(phone|email)\s*[,}]/);

    if (rawContextMatch) {
      failures.push(
        `${relative}:${index + 1} Sentry context uses raw "${rawContextMatch[1]}"`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Log redaction check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Log redaction check passed.');
