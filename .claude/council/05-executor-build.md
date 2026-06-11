# Executor — Build / CI Ground Truth (2026-06-11)

## BUILD STATUS — ALL COMPILE/BUILD GATES GREEN
| App | Command | Result | Errors |
|-----|---------|--------|--------|
| rider-api | tsc --noEmit | PASS | 0 |
| driver-api | tsc --noEmit | PASS | 0 |
| admin-api | tsc --noEmit | PASS | 0 |
| admin-panel | tsc --noEmit | PASS | 0 |
| admin-panel | next build (clean) | PASS | 0 |
| admin-panel | next lint | FAIL | 7 err 1 warn (non-blocking) |
| landing | tsc + next build | PASS | 0 |
| rider-app | flutter analyze | PASS | 0 err / 4 warn / 102 info |
| driver-app | flutter analyze | PASS | 0 err / 1 warn / 13 info |

## KNOWN ISSUE RESOLVED
live/page.tsx GoogleMap-vs-React error ALREADY FIXED — live/page.tsx:36 casts `GoogleMap as unknown as FC<GoogleMapProps & {children?}>`. tsc 0 errors. Close it.

## NON-CRITICAL
- [LOW] admin-panel next build first attempt failed on stale .next manifest lock (Windows FS). Fix: rm -rf .next before prod build.
- [LOW] admin-panel lint 7 errors: unused imports features/page.tsx:11, operators/page.tsx:6, orders/[id]/page.tsx:17,358, users/riders/[id]/page.tsx:12,19; AND wallets/[type]/page.tsx:77 useQuery called conditionally (rules-of-hooks — latent runtime bug). NOT build-blocking (next.config.js ignoreDuringBuilds + ignoreBuildErrors true). Fix: remove imports; hoist useQuery above early-return.
- [LOW] landing no ESLint config (next lint hangs interactive). Fix: add .eslintrc.json.

## CI ASSESSMENT
CI gates: backend tsc(3) ✓, backend jest (wallet/sos/order/e2e w/ PG+Redis), flutter analyze (matrix). CI does NOT typecheck/lint/build admin-panel or landing. deploy.yml entirely commented stubs.
**Would CI be red?** backend-lint GREEN. flutter-analyze AT RISK/likely RED: (1) CI pins FLUTTER_VERSION 3.27.0 vs local 3.41.7; (2) bare flutter analyze exit 1 on warnings (rider 4, driver 1). backend-tests unverified.

## FIX FIRST FOR GREEN BUILD
1. CI FLUTTER_VERSION 3.27.0→3.41.x + --no-fatal-warnings (or clear 5 warnings).
2. rm -rf .next before next build on Windows.
3. Hygiene: drop 6 unused imports + fix conditional useQuery wallets/[type]/page.tsx:77; add landing eslintrc.

## NOTE
next.config.js sets typescript.ignoreBuildErrors:true AND eslint.ignoreDuringBuilds:true — TS/lint errors are SILENCED at build. Real type safety not enforced in admin-panel build.
