# HANCR Launch Readiness

Last verified server state: `/opt/hancr` on `main` commit `a421105`.

## Green Checks

These checks are expected to pass before deploy:

```bash
npm run ci:verify
npm run readiness:template
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
| Monitoring | `SENTRY_DSN_RIDER_API` | No production error tracking for rider API | Create a Sentry project and add its DSN to `/opt/hancr/.env.prod` |
| Monitoring | `SENTRY_DSN_DRIVER_API` | No production error tracking for driver API | Create a Sentry project and add its DSN to `/opt/hancr/.env.prod` |
| Monitoring | `SENTRY_DSN_ADMIN_API` | No production error tracking for admin API | Create a Sentry project and add its DSN to `/opt/hancr/.env.prod` |
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
