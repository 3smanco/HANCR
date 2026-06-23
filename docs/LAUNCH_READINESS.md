# HANCR Launch Readiness

Verify the live server state with `git rev-parse --short HEAD` in `/opt/hancr`
after each deploy.

For the current production audit summary, see `docs/PRODUCTION_AUDIT.md`.

## Security Baseline

- `ADMIN_DEFAULT_EMAIL` must be configured and valid before first production
  admin seeding.
- `ADMIN_DEFAULT_PASSWORD` must be non-placeholder and at least 16 characters
  before first production admin seeding.
- Admin panel session cookies are written through the shared Apollo helper and
  set `Secure` automatically on HTTPS.
- API Sentry captures unexpected errors and delegates HTTP response rendering
  back to Nest's base exception filter.
- GraphQL subscriptions pass WebSocket auth payloads into JWT guards, and live
  driver-location tracking is limited to the authenticated rider's active order.

## Green Checks

These checks are expected to pass before deploy:

```bash
npm run ci:verify
npm run readiness:template
npm run secrets:check
```

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
| Monitoring | mobile Sentry SDKs | Flutter app crash reporting is still disabled in `pubspec.yaml` | Re-enable `sentry_flutter` after the Kotlin/build issue is resolved |
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

Workflow files are prepared locally under `.github/workflows`, but GitHub rejected
both git push and connector writes with:

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

`npm run ci:verify` also runs the secret hygiene check, admin-panel i18n key
validation, admin-panel quality guard, admin-panel linting with
`--max-warnings=0`, and `flutter analyze --no-pub` for both mobile apps.
