#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const targets = [
  { name: 'root APIs/workspace', cwd: root },
  { name: 'admin panel', cwd: path.join(root, 'apps', 'admin-panel') },
];

function runAudit(target) {
  const result = spawnSync(npmCommand, ['audit', '--omit=dev', '--json'], {
    cwd: target.cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = result.stdout?.trim();
  if (!output) {
    const detail = result.error?.message ?? result.stderr ?? `exit ${result.status}`;
    throw new Error(`npm audit produced no JSON for ${target.name}: ${detail}`);
  }

  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Could not parse npm audit JSON for ${target.name}: ${error.message}`);
  }
}

function severityLabel(metadata = {}) {
  const vulns = metadata.vulnerabilities ?? {};
  return [
    `critical ${vulns.critical ?? 0}`,
    `high ${vulns.high ?? 0}`,
    `moderate ${vulns.moderate ?? 0}`,
    `low ${vulns.low ?? 0}`,
    `total ${vulns.total ?? 0}`,
  ].join(', ');
}

function fixKind(fixAvailable) {
  if (fixAvailable === true) return 'non-breaking available';
  if (!fixAvailable) return 'no npm fix';
  if (fixAvailable.isSemVerMajor) {
    return `breaking: ${fixAvailable.name}@${fixAvailable.version}`;
  }
  return `non-breaking: ${fixAvailable.name}@${fixAvailable.version}`;
}

function summarize(target, audit) {
  const vulnerabilities = Object.values(audit.vulnerabilities ?? {});
  const direct = vulnerabilities
    .filter((item) => item.isDirect)
    .sort((a, b) => a.name.localeCompare(b.name));

  const fixGroups = new Map();
  for (const item of vulnerabilities) {
    const kind = fixKind(item.fixAvailable);
    const items = fixGroups.get(kind) ?? [];
    items.push(item);
    fixGroups.set(kind, items);
  }

  console.log(`\n${target.name}`);
  console.log('-'.repeat(target.name.length));
  console.log(`Severity: ${severityLabel(audit.metadata)}`);

  if (direct.length) {
    console.log(
      `Direct vulnerable packages: ${direct
        .map((item) => `${item.name} (${item.severity})`)
        .join(', ')}`,
    );
  } else {
    console.log('Direct vulnerable packages: none');
  }

  console.log('Fix availability:');
  for (const [kind, items] of [...fixGroups.entries()].sort()) {
    const names = [...new Set(items.map((item) => item.name))].sort();
    console.log(`  ${items.length} x ${kind}`);
    console.log(`    ${names.join(', ')}`);
  }
}

console.log('HANCR production dependency audit summary');
console.log('Runs: npm audit --omit=dev --json');

for (const target of targets) {
  summarize(target, runAudit(target));
}
