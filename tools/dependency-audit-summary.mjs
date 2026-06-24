#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const includeFixDryRun =
  process.argv.includes('--fix-dry-run') || process.argv.includes('--check-fix');

const targets = [
  { name: 'root APIs/workspace', cwd: root },
  { name: 'admin panel', cwd: path.join(root, 'apps', 'admin-panel') },
];

function runNpmJson(target, args, label) {
  const result = spawnSync(npmCommand, args, {
    cwd: target.cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = result.stdout?.trim();
  if (!output) {
    const detail = result.error?.message ?? result.stderr ?? `exit ${result.status}`;
    throw new Error(`${label} produced no JSON for ${target.name}: ${detail}`);
  }

  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Could not parse ${label} JSON for ${target.name}: ${error.message}`);
  }
}

function runAudit(target) {
  return runNpmJson(target, ['audit', '--omit=dev', '--json'], 'npm audit');
}

function runFixDryRun(target) {
  return runNpmJson(
    target,
    ['audit', 'fix', '--omit=dev', '--package-lock-only', '--dry-run', '--json'],
    'npm audit fix dry-run',
  );
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
  if (fixAvailable === true) return 'advisory fixAvailable=true';
  if (!fixAvailable) return 'no npm fix';
  if (fixAvailable.isSemVerMajor) {
    return `breaking: ${fixAvailable.name}@${fixAvailable.version}`;
  }
  return `non-breaking: ${fixAvailable.name}@${fixAvailable.version}`;
}

function summarizeDryRun(fixDryRun) {
  const changed = fixDryRun.changed ?? 0;
  const added = fixDryRun.added ?? 0;
  const removed = fixDryRun.removed ?? 0;
  return `changed ${changed}, added ${added}, removed ${removed}`;
}

function summarize(target, audit, fixDryRun = null) {
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

  if (fixDryRun) {
    console.log(`Safe fix dry-run: ${summarizeDryRun(fixDryRun)}`);
    const advisoryOnlyCount = fixGroups.get('advisory fixAvailable=true')?.length ?? 0;
    if (advisoryOnlyCount > 0 && (fixDryRun.changed ?? 0) === 0) {
      console.log(
        'Note: advisory fixAvailable=true entries did not resolve to a safe npm audit fix change.',
      );
    }
  }
}

console.log('HANCR production dependency audit summary');
console.log('Runs: npm audit --omit=dev --json');
if (includeFixDryRun) {
  console.log('Also runs: npm audit fix --omit=dev --package-lock-only --dry-run --json');
}

for (const target of targets) {
  summarize(target, runAudit(target), includeFixDryRun ? runFixDryRun(target) : null);
}
