# HANCR Production Audit

Last reviewed: 2026-06-23

## Verified Cleanups

- Server repository `/opt/hancr` is clean on `main...origin/main`.
- Server was verified on the current `origin/main` commit during this audit.
- No untracked server files remain from the earlier PM2/schema cleanup pass.
- Generated GraphQL schemas are clean in Git.
- `npm run secrets:check` passes on the server.
- `npm run admin:i18n:check` passes with 214 literal admin-panel translation keys.
- `npm run ci:verify` passes locally on the `main` worktree.
- Admin panel `next lint`, `tsc --noEmit`, and `next build` pass without warnings.

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
Summary: 28 pass, 7 warn, 3 fail
```

The 3 failures are all production monitoring gaps:

- `SENTRY_DSN_RIDER_API`
- `SENTRY_DSN_DRIVER_API`
- `SENTRY_DSN_ADMIN_API`

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
- Generated GraphQL schemas must stay clean.
- Secret hygiene must pass.
- Flutter analyzers must pass for rider and driver apps.

GitHub workflow files are still prepared locally under `.github/workflows`, but
they are not tracked because pushing workflow files requires a GitHub token with
the `workflow` scope.

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

- Add the three API Sentry DSNs and confirm readiness has zero failures.
- Decide and configure uploads, payments, payouts, email, translation, and FX.
- Re-authenticate GitHub with workflow scope and push `.github/workflows`.
- Review PM2 restart history; current services are online, but restart counters
  are high and should be understood before public launch.
- Move production runtime from `ts-node --transpile-only` to compiled build
  artifacts in a later deployment hardening pass.
