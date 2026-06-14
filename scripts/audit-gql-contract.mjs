import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// 1) Extract operation root fields invoked by the admin-panel
const gql = readFileSync(
  join(ROOT, 'apps/admin-panel/src/lib/gql.ts'),
  'utf8',
);
const panelFields = new Set();
// match: query Name(...) {  <newline>  rootField
const opRe = /\b(query|mutation|subscription)\s+\w+\s*(\([^)]*\))?\s*\{\s*([A-Za-z_]\w*)/g;
let m;
while ((m = opRe.exec(gql))) panelFields.add(m[3]);

// also catch inline page-level gql in components (rare) — scan app/components for gql`
function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|ts)$/.test(f)) acc.push(p);
  }
  return acc;
}
for (const file of walk(join(ROOT, 'apps/admin-panel/src'))) {
  const txt = readFileSync(file, 'utf8');
  if (!txt.includes('gql`')) continue;
  let mm;
  const re = new RegExp(opRe.source, 'g');
  while ((mm = re.exec(txt))) panelFields.add(mm[3]);
}

// 2) Extract @Query/@Mutation field names from admin-api resolvers
const apiFields = new Set();
for (const file of walk(join(ROOT, 'apps/admin-api/src'))) {
  if (!/resolver\.ts$/.test(file)) continue;
  const txt = readFileSync(file, 'utf8');
  // @Query(() => Type, { name: 'x' }) OR @Query('x') -> explicit name
  const explicit = /@(?:Query|Mutation|Subscription)\([^)]*['"]name['"]\s*:\s*['"]([A-Za-z_]\w*)['"]/g;
  let e;
  while ((e = explicit.exec(txt))) apiFields.add(e[1]);
  const explicit2 = /@(?:Query|Mutation|Subscription)\(\s*['"]([A-Za-z_]\w*)['"]/g;
  while ((e = explicit2.exec(txt))) apiFields.add(e[1]);
  // decorator followed (after optional other decorators) by methodName(
  const lines = txt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/@(Query|Mutation|Subscription)\(/.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const mt = lines[j].match(/^\s*(?:async\s+)?([A-Za-z_]\w*)\s*\(/);
        if (mt && !/^(if|for|while|return|const|await)$/.test(mt[1])) {
          apiFields.add(mt[1]);
          break;
        }
      }
    }
  }
}

// 3) Diff
const missing = [...panelFields].filter((f) => !apiFields.has(f)).sort();
console.log(`Panel operation fields: ${panelFields.size}`);
console.log(`API resolver fields:    ${apiFields.size}`);
console.log('');
if (missing.length === 0) {
  console.log('✅ Every panel query/mutation maps to an admin-api resolver.');
} else {
  console.log(`⚠ ${missing.length} panel field(s) with NO matching resolver:`);
  for (const f of missing) console.log('   - ' + f);
}
