# Wave F — Expansionist (production-readiness & scale)

## CRITICAL
- **Twilio is a TRIAL account → real users can't receive OTP → login broken (web+app)** — live probe `SMS failed (21608)` (= "trial accounts can't message unverified numbers") + `.env:45 TWILIO_FROM_NUMBER=+1618...` (US trial DID, wrong for MENA). Path real: auth.service.ts:93 → sms.service.ts:62 messages.create → 21608. SmsService "enabled" (SID=AC...). OTP NOT leaked (good) but success:true returned → UI advances to OTP screen → user stuck on a code never sent. **100% of real logins fail. #1 launch blocker.** Fix: upgrade Twilio off trial; Alphanumeric Sender ID / Messaging-Service SID registered for KSA/QA/UAE; use messagingServiceSid not raw US from; synthetic monitor alerting on sms.success=false. **[Cross-confirmed by Outsider]**
- **Unrestricted public Maps key → billing blowout** — landing/.env.production NEXT_PUBLIC_GOOGLE_MAPS_KEY baked client-side (AccountClient.tsx:30,37), world-readable. No default spend cap on Maps Platform. Fix (CONFIG): lock key to hancr.com referrers + Maps JS+Places only + daily quota + budget alert.

## HIGH
- **Places Autocomplete no debounce / no session token** — AccountClient.tsx:102-103 classic Autocomplete per-keystroke billing + fields:[geometry] → Place Details charge, no AutocompleteSessionToken → 5-10x Maps spend at scale. Fix: AutocompleteSessionToken + debounce (or PlaceAutocompleteElement).
- **Directions cache near-100% miss on web origins** — directions.service.ts:42 rounds 4dp(~11m); web raw GPS rarely repeats → most routePreview/createOrder bill Directions. No in-flight de-dup (:60-75). Fix: single-flight per key; coarser grid for preview.
- **Web token: no revocation; banned rider's JWT keeps working** — riderAuth.ts:12-29 localStorage; signToken stateless (no jti/allow-list); onLogout client-only. banRider (users.service.ts:205) doesn't block live tokens — banned rider rides until expiry. Fix: short TTL+refresh OR Redis jti allow-list in JwtAuthGuard; minimum re-check rider.banned in guard.

## MEDIUM
- **per-phone counter TTL race** — auth.service.ts:60-62 incr before cap, only first sets expire; flood faster than expire lands → key without TTL persists block. Fix: SET NX EX / Lua.
- **No observability on SMS failure** — sms.service.ts:71 logger.warn + success:true → never reaches Sentry (10% trace, exception filter exists). The Twilio outage pages NOBODY. Fix: captureException/metric on sms.success=false in prod; tag spans web vs app.
- **Landing build-env silent-fail fragile** — gitignored .env.production; rebuild forgetting it → Maps silently fails (swallowed catch :116). Fix: assert envs in next.config; visible UI error.

## Positives (no action)
- Admin pagination/N+1 clean (findAndCount + skip/take; getRiderDetail Promise.all bounded).
- routePreview/createOrder JWT-guarded; anon web only reaches throttled sendOtp/verifyOtp.
- CORS fail-closed + trustProxy correct. OTP not leaked on SMS failure.

### Top production blockers
1. Twilio trial (21608, US sender) → every real login dies at OTP. Launch-blocking.
2. Unrestricted Maps key + un-session-tokened Places → uncapped Google billing.
3. No token revocation + silent SMS-failure (no Sentry) → stolen/banned tokens live to expiry; #1 outage pages nobody.
