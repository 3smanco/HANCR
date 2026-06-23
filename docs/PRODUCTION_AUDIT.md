# HANCR Production Audit

Last reviewed: 2026-06-23

## Verified Cleanups

- Server repository `/opt/hancr` is clean on `main...origin/main`.
- Server was verified on the current `origin/main` commit during this audit.
- No untracked server files remain from the earlier PM2/schema cleanup pass.
- No `ecosystem.config.js.bak*`, `test.ts`, or other old backup files were
  found at the repository root or first two levels of `/opt/hancr`.
- Generated GraphQL schemas are clean in Git.
- Production GraphQL schema generation now runs in memory, so PM2 reloads do
  not rewrite `apps/*/schema.gql` on the server.
- `npm run secrets:check` passes on the server.
- `npm run admin:i18n:check` passes with 214 literal admin-panel translation keys.
- `npm run admin:quality:check` passes and rejects hidden hook disables or
  Apollo Client deprecated hook options.
- `npm run ci:verify` passes locally on the `main` worktree.
- Admin panel `next lint --max-warnings=0`, `tsc --noEmit`, and `next build`
  pass without warnings.
- Production admin bootstrap now rejects missing/invalid default email values
  and weak or placeholder `ADMIN_DEFAULT_PASSWORD` values before creating the
  first super admin.
- Admin panel session cookies are centralized in `lib/apollo.ts` and use
  `Secure` automatically when the panel is served over HTTPS.
- API Sentry exception handling now lets Nest render HTTP responses through the
  base HTTP exception filter while still reporting 5xx/unknown errors to Sentry
  and preserving GraphQL rethrow behavior.
- GraphQL WebSocket context now maps subscription `connectionParams`
  authorization into the request headers used by JWT guards.
- Rider live driver-location subscriptions now require an authenticated rider,
  `orderId`, matching `driverId`, and a live trackable order status before the
  stream opens. The duplicate driver-api location subscription is restricted to
  the authenticated driver's own stream.
- Auth, SMS, email, and Sentry failure contexts now mask phone numbers and email
  addresses in logs. Disabled SMS/email dev logs no longer print raw OTP message
  bodies or OTP-bearing email subjects.

## Runtime Health

Checked on the production host:

```text
rider-api   /health/ready -> 200
driver-api  /health/ready -> 200
admin-api   /health/ready -> 200
admin-panel /login        -> 200
```

PM2 reports `rider-api`, `driver-api`, `admin-api`, and `admin-panel` as
online.

## Remaining Launch Blockers

`npm run readiness:prod -- --compact` currently reports:

```text
Summary: 23 pass, 7 warn, 8 fail
```

The 8 failures are production launch gaps:

- `CORS_ORIGINS` still includes `http://34.18.212.201`
- `ADMIN_CORS_ORIGINS` still includes `http://34.18.212.201`
- `PUBLIC_BASE_URL` still uses `http://34.18.212.201`
- `PUBLIC_API_URL` still uses `http://34.18.212.201`
- `PUBLIC_ADMIN_URL` still uses `http://34.18.212.201/admin`

- `SENTRY_DSN_RIDER_API`
- `SENTRY_DSN_DRIVER_API`
- `SENTRY_DSN_ADMIN_API`

API Sentry wiring is present in all three API entrypoints; these failures are
missing production DSNs, not missing code initialization.

The 7 warnings require provider credentials or business decisions:

- Uploads: `GCS_SERVICE_ACCOUNT_JSON`, `PUBLIC_UPLOADS_BASE`,
  `GCS_DRIVER_DOCS_BUCKET`, `GCS_RIDER_UPLOADS_BUCKET`
- Payments: HyperPay, Moyasar, or Stripe production keys
- Payouts: payout provider token/secret
- Email: `SMTP_HOST`, `EMAIL_FROM`
- Translation: `TRANSLATION_API_KEY`
- FX rates: `OPEN_EXCHANGE_RATES_APP_ID`

## CI And GitHub

Local CI now prevents the admin-panel warning classes that were previously
reviewed:

- Admin-panel lint is part of `npm run ci:verify`.
- Admin-panel i18n literal key validation is part of `npm run ci:verify`.
- Admin-panel quality validation rejects hidden `react-hooks/exhaustive-deps`
  disables and Apollo Client deprecated query/lazy-query options.
- Generated GraphQL schemas must stay clean.
- Secret hygiene must pass.
- Flutter analyzers must pass for rider and driver apps.
- Admin bootstrap credential validation is covered by an admin-api unit test.
- Live tracking subscription authorization is covered by rider-api and
  driver-api unit tests, and the driver subscription guard is part of
  `npm run ci:verify`.

A clean GitHub workflow is prepared locally in commit `752ada4` as
`.github/workflows/ci.yml`, but GitHub rejected both `git push` and the Contents
API because the current integration does not have the `workflow` scope.

## Dependency Risk

Production dependency audit still needs a dedicated major-upgrade pass. A
non-breaking cleanup pass removed unused `@nestjs/platform-express`, upgraded
`nodemailer` to `^9.0.1`, and moved admin-panel to Next `^14.2.35`.

- Root production audit: 31 vulnerabilities total
  - 1 critical
  - 8 high
  - 22 moderate
- Admin panel production audit: 2 vulnerabilities total
  - 1 high
  - 1 moderate

Remaining fixes require breaking upgrades or a dedicated migration plan.
Notable packages to review first:

- `@fastify/middie` / `@nestjs/platform-fastify`
- `fastify`
- `@apollo/server` / `@nestjs/apollo`
- `next`

## Operational Follow-ups

- Move public URLs and CORS origins from the raw HTTP server IP to production
  HTTPS domains, then confirm readiness removes the five URL/CORS failures.
- Add the three API Sentry DSNs and confirm readiness has zero monitoring
  failures.
- Re-enable mobile Sentry for rider and driver Flutter apps after resolving the
  noted Kotlin/build issue in their `pubspec.yaml` comments.
- Decide and configure uploads, payments, payouts, email, translation, and FX.
- Re-authenticate GitHub with workflow scope and push `.github/workflows`.
- Review PM2 restart history; current services are online, but restart counters
  are high and should be understood before public launch.
- Move production runtime from `ts-node --transpile-only` to compiled build
  artifacts in a later deployment hardening pass.
