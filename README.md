# HANCR

> منصة التنقل الذكي الأولى في الخليج — Smart mobility platform for MENA region.

[![CI](https://github.com/YOUR_USERNAME/hancr/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/hancr/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-82%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-Proprietary-red)]()

---

## 🌐 Production URLs

| Service | URL |
|---------|-----|
| Marketing | https://hancr.com |
| Admin Panel | https://admin.hancr.com |
| Rider API | https://api.hancr.com/rider/graphql |
| Driver API | https://api.hancr.com/driver/graphql |
| Admin API | https://api.hancr.com/admin/graphql |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare CDN/WAF                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  api.hancr.com  │         │ admin.hancr.com │
    │     (Nginx)     │         │   (Next.js 14)  │
    └────────┬────────┘         └─────────────────┘
             │
   ┌─────────┼─────────┐
   ▼         ▼         ▼
┌──────┐ ┌──────┐ ┌───────┐
│rider │ │driver│ │ admin │   3 NestJS APIs
│-api  │ │-api  │ │ -api  │
└──┬───┘ └──┬───┘ └───┬───┘
   │        │         │
   └────────┼─────────┘
            │
   ┌────────┼────────┐
   ▼                 ▼
┌─────────┐   ┌──────────┐
│Postgres │   │  Redis   │
│ + PostGIS│   │ (pubsub) │
└─────────┘   └──────────┘
```

---

## 📁 Project Structure

```
hancr/
├── apps/
│   ├── rider-api/         NestJS — Rider GraphQL API
│   ├── driver-api/        NestJS — Driver GraphQL API
│   ├── admin-api/         NestJS — Admin GraphQL API
│   ├── admin-panel/       Next.js 14 — Admin Dashboard
│   ├── rider-app/         Flutter — Rider mobile app
│   └── driver-app/        Flutter — Driver mobile app
├── libs/
│   ├── database/          TypeORM entities + migrations
│   ├── redis/             Redis services (matching engine)
│   ├── notifications/     FCM + Twilio
│   ├── wallet/            Atomic ledger + payment gateways
│   ├── sos/               Emergency system + trip sharing
│   └── observability/     Sentry + Health + Throttler
├── docker/
│   ├── docker-compose.yml          → Dev environment
│   ├── docker-compose.prod.yml     → Production stack
│   └── nginx/                      → Reverse proxy config
├── docs/
│   ├── DNS_SETUP.md       → Cloudflare DNS records
│   └── DEPLOYMENT.md      → Step-by-step deployment
└── .github/workflows/
    ├── ci.yml             → Lint + Tests + Build
    └── deploy.yml         → Staging + Production deploy
```

---

## ✨ Features

### Core
- ✅ OTP + JWT authentication (rider + driver + admin)
- ✅ Real-time order matching (Redis GEORADIUS, 73-99% faster than SQL)
- ✅ Live driver tracking (GraphQL subscriptions via Redis pubsub)
- ✅ Multi-region support (currency + features per region)
- ✅ Bid mode (drivers offer custom prices)
- ✅ Loyalty system (Bronze → Platinum tiers + miles)

### Payments
- ✅ Wallet ledger with atomic SELECT FOR UPDATE
- ✅ 5 payment gateways: HyperPay, Moyasar, Stripe, ApplePay, GooglePay
- ✅ Auto-settlement on trip completion
- ✅ Driver withdrawals
- ✅ Webhook handling (idempotent)

### Safety
- ✅ SOS button (rider + driver)
- ✅ Emergency contacts CRUD
- ✅ Automatic SMS to emergency contacts on trigger
- ✅ Trip sharing (auto-send trip details to trusted contacts)
- ✅ Admin SOS dashboard (live monitoring)

### Production-ready
- ✅ Sentry error tracking (backend + Flutter)
- ✅ Rate limiting (default/strict/relaxed tiers)
- ✅ Helmet security headers
- ✅ CORS hardening (env-driven allowlist)
- ✅ Health endpoints (`/health/live`, `/health/ready`)
- ✅ Docker multi-stage builds
- ✅ GitHub Actions CI/CD

---

## 🚀 Quick Start (Development)

```bash
# Prerequisites: Node 20+, Docker, Flutter 3.27+

# 1. Clone
git clone https://github.com/YOUR_USERNAME/hancr.git
cd hancr

# 2. Install deps
npm install --legacy-peer-deps

# 3. Start infrastructure (Postgres + Redis)
docker compose -f docker/docker-compose.yml up -d

# 4. Setup env
cp .env.example .env
# عدِّل .env بمفاتيحك (Maps, Twilio, Firebase…)

# 5. Run migrations
TS_NODE_PROJECT=tsconfig.base.json \
  npx typeorm-ts-node-commonjs migration:run -d libs/database/src/lib/data-source.ts

# 6. Start APIs (in 3 terminals)
npx nx serve rider-api
npx nx serve driver-api
npx nx serve admin-api

# 7. Start admin panel
cd apps/admin-panel && npm run dev

# 8. (Optional) Run Flutter apps
cd apps/rider-app && flutter run
cd apps/driver-app && flutter run
```

---

## 🧪 Tests

```bash
# Critical libs (highest priority)
npx jest --config libs/wallet/jest.config.ts          # 34 tests
npx jest --config libs/sos/jest.config.ts             # 20 tests
npx jest --config apps/driver-api/jest.config.ts      # 25 tests

# E2E
npx jest --config apps/rider-api/test/jest-e2e.config.ts  # 3 tests

# Flutter
cd apps/rider-app && flutter analyze
cd apps/driver-app && flutter analyze
```

**Current status: 82/82 tests passing ✅**

---

## 📦 Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full production deployment guide.

Quick version:
1. Provision Ubuntu 22.04 server (4 vCPU, 8GB RAM)
2. Setup DNS records ([`docs/DNS_SETUP.md`](docs/DNS_SETUP.md))
3. `cp .env.prod.example .env.prod` + fill values
4. `docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d`

---

## 🛠️ Tech Stack

**Backend**
- NestJS 10 + Fastify
- TypeORM 0.3 + PostgreSQL 16 + PostGIS
- Redis 7 (matching + pubsub)
- GraphQL (code-first + subscriptions via graphql-ws)

**Frontend**
- Flutter 3.27 (rider + driver apps)
- Next.js 14 + Tailwind (admin panel)
- BLoC + Freezed (state management)

**Infrastructure**
- Docker + docker-compose
- Nginx reverse proxy
- Cloudflare (DNS + SSL + WAF + CDN)
- GitHub Actions (CI/CD)
- Sentry (error tracking)

**External Services**
- Twilio (SMS / OTP)
- Firebase (Push notifications)
- Google Maps + Mapbox
- HyperPay / Moyasar / Stripe (payments)

---

## 📜 License

Proprietary — © 2026 HANCR. All rights reserved.

---

## 🤝 Contributing

This is a private project. Contributions are limited to the HANCR team.

For internal team:
1. Create feature branch from `develop`
2. Open PR with description + test results
3. CI must pass (82 tests + lint + type-check)
4. Code review required
5. Merge to `develop` → auto-deploy to staging
6. Tag `vX.Y.Z` from `main` → auto-deploy to production
