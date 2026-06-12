# Wave F — Contrarian (web security red-team)

## CRITICAL
- **createOrder accepts unvalidated regionId** — create-order.input.ts:42-44 (@IsNumber only, no @Min/existence) · order.service.ts:158,267,435-437. regionId never checked vs RegionEntity; flows raw into zone SQL + exclusive-fleet SQL + persisted. Bogus region → no zone → silent fallback to service.baseFare. Exploit: createOrder(regionId:999999) bypasses surge/multiplier/fleet routing. Fix: regionRepo.findOne validate at top; @Min(1) on DTO. **[Cross-confirmed by First Principles C2]**
- **No serviceId↔regionId binding** — order.service.ts:110-113 fetches service by id alone. Exploit: submit a cheap region's serviceId with any regionId → ride at foreign region's pricing. Fix: serviceRepo.findOne({id, regionId, enabled:true}); same in previewRoute:591. **[Cross-confirmed by First Principles C1]**

## HIGH
- **Per-IP throttling broken behind proxy** — main.ts:18-23 FastifyAdapter no trustProxy → req.ip = proxy IP for all clients; guard reads XFF only when req.ip falsy (gql-throttler.guard.ts:26) → never. Strict OTP limits (3/60s, 10/60s) collapse to one global bucket in prod. Fix: FastifyAdapter({trustProxy:true}) + override getTracker() → req.ips[0]??req.ip + add PER-PHONE limiter on sendOtp.
- **CORS origin:true+credentials:true when CORS_ORIGINS unset** — main.ts:58-72. Tempered: web uses Bearer (localStorage) not cookie, so no ambient creds. Latent. Fix: fail closed at boot if prod+empty; never origin:true+credentials:true.
- **devOtp test-phone backdoor in prod** — send-otp-response.type.ts:12-13 (devOtp in schema) + auth.service.ts:47-50,85,99. Value suppressed for non-test phones (earlier fix holds) BUT +966500000001/2 always return static OTP 123456 via devOtp, queryable in prod. Exploit: sendOtp(+966500000001)→devOtp:123456→verifyOtp→demo account login. Fix: strip devOtp from prod schema OR hard-disable TEST_PHONES when NODE_ENV=production.

## MEDIUM
- **addresses[] no max-size / no length-match to points[]** — create-order.input.ts:30-34. No ArrayMaxSize, no addresses.length===points.length. Persisted verbatim → push/driver-sub. Storage bloat + downstream indexing + stored-XSS shifts to driver client escaping. Fix: @ArrayMaxSize(5) + custom validator length match + @MaxLength per string.
- **Web token in localStorage — XSS-exfil + no server-side logout** — riderAuth.ts:12-23 + loads 3rd-party maps script. No XSS sink found today (good). clearToken only client-side; JWT valid until expiry (no revocation). CSP disabled (main.ts:48). Fix: strict CSP on landing (CDN), short token TTL, server-side revocation on logout.

## LOW
- **proposedPrice (Bid) rider-controlled @Min(0) only** — create-order.input.ts:149-153. Not used by web. Ensure bid acceptance re-prices (note: I added bid bounds earlier in submitBidOffer — verify acceptOffer too).
- Web phone regex weaker than server (server @IsPhoneNumber authoritative; no exploit).

## CONFIRMED SAFE
- IDOR: me/savedPlaces/createOrder/history key on @CurrentUser().riderId from JWT; client can't supply riderId. findOrderForRider enforces ownership; order subscription filters riderId. No cross-rider path.
- Coords: GeoPointInput lat[-90,90]/lng[-180,180]; points ArrayMinSize2/MaxSize5. No crash. Dup points → 0 distance → base fare (not free).
- Throttler STORAGE Redis-backed + GraphQL-aware (the storage fix holds; only IP keying broken).
- Maps key public by design (config not code vuln).

### Most dangerous
1. Unvalidated regionId+serviceId in createOrder → base-rate pricing in bogus regions / cheaper foreign service. Public-endpoint authz gap.
2. Per-IP throttling collapses behind proxy + no per-phone limit → SMS-bomb/OTP brute-force uncontained.
3. Production test-phone backdoor (+966500000001/2 → static 123456 via devOtp) → unauth login as demo accounts from web.
