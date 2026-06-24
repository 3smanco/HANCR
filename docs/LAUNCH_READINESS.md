# HANCR Launch Readiness

Verify the live server state with `git rev-parse --short HEAD` in `/opt/hancr`
after each deploy.

For the current production audit summary, see `docs/PRODUCTION_AUDIT.md`.

## Security Baseline

- `ADMIN_DEFAULT_EMAIL` must be configured and valid before first production
  admin seeding.
- `ADMIN_DEFAULT_PASSWORD` must be non-placeholder and at least 16 characters
  before first production admin seeding.
- `ALLOW_TEST_PHONES` should be set to `false`; the APIs also ignore it when
  `NODE_ENV=production`.
- Admin panel session cookies are written through the shared Apollo helper and
  set `Secure` automatically on HTTPS.
- API Sentry captures unexpected errors and delegates HTTP response rendering
  back to Nest's base exception filter.
- Rider and driver Flutter apps initialize Sentry when release builds provide
  `--dart-define=SENTRY_DSN=...` and tag events with `ENV`/`SENTRY_RELEASE`.
- GraphQL subscriptions pass WebSocket auth payloads into JWT guards, and live
  driver-location tracking is limited to the authenticated rider's active order.
- Auth, SMS, and email logs mask phone numbers and email addresses before they
  leave the service. Disabled SMS/email dev logs do not print raw OTP bodies or
  OTP-bearing email subjects, and auth debug logs do not print OTP codes.
- Strict readiness rejects raw IP literals in public URLs and CORS origins, even
  when they use HTTPS. Production launch requires real DNS names.

## Green Checks

These checks are expected to pass before deploy:

```bash
npm run ci:verify
npm run build:apis:prod
(cd apps/admin-panel && npm run build)
npm run readiness:template
npm run secrets:check
```

The PM2 server deploy path is captured in:

```bash
./scripts/deploy-direct.sh
```

It refreshes stale PM2 definitions before `startOrReload`, which prevents old
`ts-node` or `next start` process definitions from surviving a deploy.

On the PM2 server:

```bash
npm run readiness:prod
curl -fsS http://127.0.0.1:3000/health/ready
curl -fsS http://127.0.0.1:3001/health/ready
curl -fsS http://127.0.0.1:3002/health/ready
curl -fsS -I http://127.0.0.1:3003
```

## Remaining Launch Blockers

These require external credentials or GitHub permissions:

| Area | Missing item | Impact | Owner action |
| --- | --- | --- | --- |
| Public URLs | HTTPS domain for `PUBLIC_BASE_URL` | App links and provider callbacks still point to raw HTTP IP | Configure DNS/TLS and update `/opt/hancr/.env.prod` |
| Public URLs | HTTPS domain for `PUBLIC_API_URL` | API references still point to raw HTTP IP | Configure `https://api.hancr.com` or the chosen production API domain |
| Public URLs | HTTPS domain for `PUBLIC_ADMIN_URL` | Admin links still point to raw HTTP IP | Configure `https://admin.hancr.com` or the chosen production admin domain |
| CORS | HTTPS-only `CORS_ORIGINS` | Browser clients include an HTTP server-IP origin | Remove `http://34.18.212.201` after production domains are live |
| CORS | HTTPS-only `ADMIN_CORS_ORIGINS` | Admin browser access includes an HTTP server-IP origin | Remove `http://34.18.212.201` after production domains are live |
| Monitoring | `SENTRY_DSN_RIDER_API` | No production error tracking for rider API | Create a Sentry project and add its DSN to `/opt/hancr/.env.prod` |
| Monitoring | `SENTRY_DSN_DRIVER_API` | No production error tracking for driver API | Create a Sentry project and add its DSN to `/opt/hancr/.env.prod` |
| Monitoring | `SENTRY_DSN_ADMIN_API` | No production error tracking for admin API | Create a Sentry project and add its DSN to `/opt/hancr/.env.prod` |
| Monitoring | mobile `SENTRY_DSN` build defines | Flutter SDK wiring is present, but release builds need DSNs to send crash reports | Add rider/driver app DSNs to release secrets and pass `--dart-define=SENTRY_DSN=...` |
| GitHub CI | workflow write permission | CI workflow files cannot be pushed by the current OAuth token | Re-authenticate GitHub with `workflow` scope or push `.github/workflows` manually |

## Production Warnings

These are not code failures, but they should be closed before broad public use:

| Area | Missing item | Current behavior |
| --- | --- | --- |
| Uploads | `GCS_SERVICE_ACCOUNT_JSON` or `PUBLIC_UPLOADS_BASE` | Driver/rider uploads fall back to local paths |
| Uploads | `GCS_DRIVER_DOCS_BUCKET` / `GCS_RIDER_UPLOADS_BUCKET` | No production upload bucket is configured |
| Payments | `HYPERPAY_ACCESS_TOKEN` / `MOYASAR_API_KEY` / `STRIPE_SECRET_KEY` | Payment gateways run in stub mode |
| Payouts | `HYPERPAY_PAYOUT_TOKEN` / `MOYASAR_PAYOUT_TOKEN` / `STRIPE_SECRET_KEY` | Payout gateways run in stub mode |
| Email | `SMTP_HOST` / `EMAIL_FROM` | Transactional email is logged only |
| Translation | `TRANSLATION_API_KEY` | Translation feature is disabled |
| FX rates | `OPEN_EXCHANGE_RATES_APP_ID` | Static fallback exchange rates are used |

## GitHub Actions Setup

A clean workflow file is prepared locally as `.github/workflows/ci.yml` in
commit `752ada4`, but GitHub rejected both git push and connector writes with:

```text
Resource not accessible by integration
```

To enable CI, sign in with a token that has `workflow` scope, then push the
prepared workflow files:

```bash
gh auth login
git add .github/workflows
git commit -m "ci: add readiness and build gates"
git push origin feat/nearby-drivers
```

The workflow should run the same gates as `npm run ci:verify`.

`npm run ci:verify` also runs the secret hygiene check, log redaction check,
admin-panel i18n key validation, admin-panel quality guard, admin-panel linting with
`--max-warnings=0`, Flutter dependency resolution, and `flutter analyze --no-pub`
for both mobile apps.
API production bundles are also built by `npm run ci:verify`, and PM2 uses
`dist/apps/*/main.js` instead of `ts-node` for the three API services. The
admin panel uses Next standalone output under PM2, so the admin-panel production
build must run before reload to copy `.next/static` into `.next/standalone`.
The deploy script performs both builds and checks for stale PM2 script paths.
Production GraphQL schema generation is in-memory; if `apps/*/schema.gql`
changes, it should come from development or CI generation and be reviewed as an
API contract change, not from PM2 reloads on the server.
