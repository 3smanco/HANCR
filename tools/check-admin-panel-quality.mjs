#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const root = process.cwd();
const adminSrc = path.join(root, 'apps', 'admin-panel', 'src');
const failures = [];

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

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function lineFor(source, position) {
  return source.slice(0, position).split(/\r?\n/).length;
}

function propNames(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  return node.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      return [];
    }
    const name = property.name;
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
      return [name.text];
    }
    return [];
  });
}

const deprecatedHookOptions = {
  useQuery: new Set([
    'canonizeResults',
    'defaultOptions',
    'onCompleted',
    'onError',
    'partialRefetch',
  ]),
  useLazyQuery: new Set([
    'canonizeResults',
    'context',
    'defaultOptions',
    'initialFetchPolicy',
    'onCompleted',
    'onError',
    'partialRefetch',
    'variables',
  ]),
  useMutation: new Set(['ignoreResults']),
};

const deprecatedApolloClientOptions = new Set([
  'connectToDevTools',
  'credentials',
  'headers',
  'name',
  'typeDefs',
  'uri',
  'version',
]);

for (const file of listSourceFiles(adminSrc)) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  if (/eslint-disable(?:-next-line)?\s+react-hooks\/exhaustive-deps/.test(source)) {
    failures.push(`${rel(file)}: remove react-hooks/exhaustive-deps disable`);
  }

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && expression.text in deprecatedHookOptions) {
        const banned = deprecatedHookOptions[expression.text];
        const options = propNames(node.arguments[1]);
        for (const option of options) {
          if (banned.has(option)) {
            failures.push(
              `${rel(file)}:${lineFor(source, node.getStart(sourceFile))} ` +
                `${expression.text} option "${option}" is deprecated by Apollo Client`,
            );
          }
        }
      }

    }

    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'ApolloClient'
    ) {
      const options = propNames(node.arguments?.[0]);
      for (const option of options) {
        if (deprecatedApolloClientOptions.has(option)) {
          failures.push(
            `${rel(file)}:${lineFor(source, node.getStart(sourceFile))} ` +
              `ApolloClient option "${option}" is deprecated`,
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

if (failures.length > 0) {
  console.error('Admin panel quality check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Admin panel quality check passed.');
