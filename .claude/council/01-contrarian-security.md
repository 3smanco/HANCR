# Contrarian — Security Red-Team Findings

## CRITICAL
1. **Identical JWT secret across rider/driver/admin** — `.env:25-28` all = `OS.009988.os`. driver-api never reads JWT_DRIVER_SECRET (jwt.strategy.ts:26 loads JWT_SECRET). Only role separation is in-payload `payload.type` (jwt.strategy.ts:32). Forge `{type:'admin',role:'super'}` → full admin control. Fix: 3 distinct high-entropy secrets; admin-api uses ADMIN_JWT_SECRET, driver uses JWT_DRIVER_SECRET.
2. **Weak secret reused as ADMIN_DEFAULT_PASSWORD** — `.env:25` & `.env:73` same value seeds bootstrap super admin (auth.resolver.ts:49-59). Login admin@hancr.com / OS.009988.os. Fix: random secret + separate strong password + change-on-first-login.
3. **Free wallet top-up `startWalletRecharge`** — wallet.resolver.ts:128-147: when payments_card_enabled false (default), credits balance immediately (simulated:true), no charge. Throttle 10/min, cap 5000. → 50k/min free balance. Fix: gate simulated branch behind NODE_ENV!=='production'; require gateway webhook.
4. **`confirmWalletRecharge` rider self-confirm** — wallet.resolver.ts:189-233: rider (only JwtAuthGuard) promotes own Pending recharge to Completed credit, no signature check. Fix: delete/restrict to webhook only (wallet-webhook.controller.ts after HMAC).

## HIGH
5. **OTP returned in API response** — auth.service.ts:79,93 (rider) & 56,70 (driver): devOtp returned when `isDev || !sms.success || isTestPhone`. In prod, Twilio failure leaks live OTP. Fix: only NODE_ENV==='development'; drop !sms.success & isTestPhone.
6. **OTP logged plaintext** — auth.service.ts:73 (rider) & :53 (driver) `logger.log(OTP for ${phone}: ${code})`. Fix: remove value from logs.
7. **Admin authz gaps** — users.resolver.ts banRider(48) unbanRider(57) approveDriver(85) banDriver(93) unbanDriver(101) setDriverApproval(112) only AdminJwtGuard, no role guard. Any admin role can approve drivers/ban. Fix: add AdminRolesGuard + @RequireRole.
8. **Hardcoded fallback secrets** — driver auth.module.ts:19, rider jwt.strategy.ts:27, admin-jwt.strategy.ts:26, auth.resolver.ts:88 default to literal strings if env missing. Fix: fail-fast throw on startup if secret absent.
9. **Live 3rd-party creds in .env on disk** — Neon URL+pw(:16), Google Maps(:31), Mapbox(:32), Firebase(:36-41), Twilio SID+token(:45-47). Gitignored but plaintext & transmitted. Fix: rotate ALL; vault.

## MEDIUM
10. **Chat subscription IDOR** — chat.resolver.ts:50-55: orderMessageAdded filters by orderId only, no owner check (vs order.resolver.ts:155 which checks). Any rider streams another trip's chat. Fix: add riderId ownership check in filter.
11. **OTP brute-force weakened** — auth.service.ts:115-138: maxOtpAttempts/ttl from admin config; sendOtp resets attempts:0(:71); driver uses 4-digit OTP (order.service.ts:305), 10^4 space. Fix: hard server-side floor, 6 digits, per-phone rate limit on verify.
12. **CORS reflects any origin w/ credentials non-prod** — main.ts:53-63: NODE_ENV!=='production' → origin:true + credentials:true. .env:50 is development. Fix: never origin:true with credentials:true; allowlist always.
13. **Payment settlement failure swallowed** — driver order.service.ts:333-340: _settlePayment errors caught+logged, order still finishes. Wallet mode w/ insufficient balance = free ride. Fix: settle before finish; fail completion / payment_failed state.

## Most dangerous
1. Shared weak JWT secret → forge super admin → total compromise.
2. Wallet recharge credits real balance free + rider self-confirm → unlimited money creation.
3. OTP in response on SMS failure + logged plaintext → trivial account takeover.
