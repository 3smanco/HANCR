# Expansionist — Production-Readiness Findings

## CRITICAL
1. **OTP leaked in response on SMS failure** — auth.service.ts:79 exposeDevOtp = isDev||!sms.success||isTestPhone. (corroborates Contrarian #5). Fix: only NODE_ENV==='development'.
2. **Payment webhook HMAC rejects ALL real webhooks** — wallet-webhook.controller.ts:54 passes Fastify-parsed @Body() into verifyAndParseWebhook; stripe.gateway.ts:131 computes HMAC over JSON.stringify(body). Stripe signs raw bytes → never matches. No rawBody:true in any main.ts. Riders pay, balance never credits. Fix: NestFactory.create(...,{rawBody:true}), raw-body parser for webhook route, verify against req.rawBody Buffer.
3. **No DB indexes on Order/Driver/Rider/Bid** — zero @Index. Login riderRepo.findOne({phone}) full scan; crons scan status every minute; lookups by driverId/riderId full scan. Fix: migration with order(status),(rider_id),(driver_id),(status,expected_timestamp), driver(phone) unique, rider(phone) unique, bid(status,expires_at).
4. **NEXT_PUBLIC_* not baked into admin-panel build** — Dockerfile.admin-panel has no ARG/ENV NEXT_PUBLIC_ADMIN_API_URL/GOOGLE_MAPS_KEY before build; only runtime env in compose:131. Next inlines at build. apollo.ts:15 falls back localhost:3002; live/page.tsx:46 empty maps key. Panel calls localhost in prod. Fix: ARG before npm run build → ENV, pass via build.args.

## HIGH
5. **Crons run on every pm2 instance, no distributed lock** — bid.service.ts:187, order.service.ts:1020,1133, commuter:103, flight:77, location:96, intelligence:133. pm2 -i max → N× duplicate processing/notifications. Fix: Redis SET NX EX lock or single scheduler worker (NX_CRON=1).
6. **cleanupExpiredBids loads ALL open bids to memory every 30s** — bid.service.ts:189 find({status:Open}) filter in JS. Fix: SQL where status:Open, expiresAt:LessThan(now) + index.
7. **Stripe/gateway fetch no timeout** — stripe.gateway.ts:65 fetch no AbortController (directions.service.ts:46 correctly uses 5s). Hung connection saturates event loop. Fix: 5-10s AbortController all gateways.
8. **Throttler in-memory → per-instance limits** — throttler.config.ts no storage adapter, no redis. OTP strict 3/60s (auth.resolver.ts:32) per process → N×3 effective. Fix: ThrottlerStorageRedis.
9. **No graceful shutdown** — no enableShutdownHooks/OnModuleDestroy in any main.ts. Deploy kills in-flight txns, leaks RedisPubSub. Fix: app.enableShutdownHooks(), close PubSub+pool onApplicationShutdown.
10. **Google Directions never cached** — directions.service.ts calls API every getRoute, no Redis cache. Maps cost explosion. Fix: cache keyed rounded lat/lng + waypoints, 5-10min TTL.

## MEDIUM
11. **No DB pool sizing** — rider-api.module.ts no extra.max/poolSize; N×10 vs postgres max_connections 100. Fix: explicit extra:{max,connectionTimeoutMillis,idleTimeoutMillis}, PgBouncer.
12. **Sentry no Fastify request/tracing instrumentation** — sentry.init.ts inits + exception filter, but no request handler/spans. Fix: wire @sentry/node Fastify integration + interceptor tags.
13. **Readiness probe missing Redis** — health.controller.ts readiness checks DB+memory only. Fix: add Redis ping indicator.
14. **No DataLoader, N+1** — bid.service.ts:215 loadOffersWithDrivers loops driverRepo.findOne per offer. Fix: per-request DataLoader / In([driverIds]).
15. **CI no deploy gate; deploy.yml commented out** — only echoes; ci.yml docker-build push:false. Fix: wire deploy behind needs:[lint,tests] + protected environment.
16. **No migrations for indexes & deploy never runs migration:run** — only 3 migration files; neither CI nor deploy runs it. Fix: add migration:run step gated before app start.
17. **envFilePath:'.env' hardcoded** — rider-api.module.ts; running outside compose falls back to dev defaults (localhost, hancr_dev_pass, 5433). Fix: ignoreEnvFile:true when NODE_ENV=production.

## LOW
18. **getAllOnlineDrivers HGETALL full hash per call** — driver-redis.service.ts limit 500 but HGETALL O(N) each admin refresh. Fix: maintain Online SADD/SREM set.
19. **GraphQL error stack not masked** — no formatError; resolver errors (entity/SQL fragments) leak to clients. Fix: formatError generic in prod.

## TOP BLOCKERS
1. Auth+payments silently broken: OTP echoed on Twilio fail; every webhook rejected (HMAC over reparsed JSON).
2. DB falls over at scale: no indexes + per-minute full-scan crons + duplicated per-instance crons.
3. Admin panel dead on arrival: NEXT_PUBLIC_* not baked → calls localhost, no map; no gated deploy.
