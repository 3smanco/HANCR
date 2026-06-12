# 🏛️ Wave F — Council Verdict (adversarial audit of new code)

## ✅ Where the council agrees (high confidence — ≥2 agents independently)
- 🔴 **createOrder trusts client regionId + serviceId without validation** — Contrarian + First Principles BOTH found independently. No region-existence check; service fetched by id alone (no region/enabled binding). → bogus-region base-rate pricing, cheaper foreign-service pricing, region-locked coupon unlock. **TOP FIX.**

## Confirmed SAFE (council cleared)
- IDOR: all rider queries/mutations key on `@CurrentUser().riderId` from JWT — client can't supply riderId; ownership enforced. ✓
- Coords bounds (lat/lng validated), points ArrayMinSize2/MaxSize5. ✓
- Admin new mutations RBAC: all 4 + DispatcherDrawer guarded (AdminJwtGuard+AdminRolesGuard+RequireRole('ops')). ✓
- No SQL injection (TypeORM parameterized throughout). ✓
- providerShare applies correctly to web orders (earlier fix holds). ✓
- Throttler STORAGE Redis-backed/global (storage fix holds). ✓
- Build green: rider/driver/admin-api + landing tsc=0; 27/27 jest. ✓

## 🎯 Prioritized fix list
**CRITICAL**
1. `createOrder` + `routePreview`: validate `regionId` exists/active AND resolve service with `{id, regionId, enabled:true}` (404 else). (order.service.ts:110-113,158 / previewRoute:591)

**HIGH**
2. **devOtp test-phone backdoor in prod** — `+966500000001/2` return static OTP `123456` via schema-exposed `devOtp`. Hard-disable TEST_PHONES when NODE_ENV=production. (auth.service.ts:47-50 rider+driver)
3. **Throttling broken behind proxy** — enable `FastifyAdapter({trustProxy:true})` + per-PHONE rate limit on sendOtp (Redis), not just per-IP. (main.ts, auth.service.ts)
4. **CORS** — fail closed: if prod + CORS_ORIGINS empty don't default origin:true+credentials. Set CORS_ORIGINS on server to include hancr.com/admin.hancr.com. (main.ts)

**MEDIUM**
5. New admin DTOs: add class-validator (@Matches phone, @IsEmail, @MaxLength). (user.types.ts)
6. `addresses[]`: @ArrayMaxSize(5) + length===points + @MaxLength. (create-order.input.ts)
7. Web token: server-side logout revocation + landing CSP (config) + short TTL. (deferred-config)

**LOW**
8. referral_code add unique:true + migration. proposedPrice bid re-pricing (verify acceptOffer).

## The one thing to do first
Fix #1 (regionId+serviceId validation in createOrder/routePreview) — it's the only CRITICAL, cross-confirmed by two agents, and protects ALL clients (app + web) from mispriced/free-ish rides.
