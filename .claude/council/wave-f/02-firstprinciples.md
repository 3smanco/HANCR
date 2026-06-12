# Wave F — First Principles (money/logic in new flows)

## CRITICAL
- **C1 createOrder trusts serviceId (no region/enabled check)** — order.service.ts:110-113 `findOne({where:{id: input.serviceId}})` — no regionId match, no enabled:true. Web lists only enabled/region-1 but createOrder trusts raw serviceId. → price off disabled/wrong-region service. Fix: `findOne({where:{id, regionId: input.regionId, enabled:true}})` else 404.
- **C2 regionId fully attacker-controlled** — resolver passes input through; order.service.ts:158 uses input.regionId in zone query; :196 passes to couponService.validate. Server never validates rider belongs to region nor pickup falls in it. → (a) wrong regional tariff; (b) unlock region-restricted coupon by passing any regionId. Fix: derive region server-side from pickup point (PostGIS) or rider record; reject mismatch.

## HIGH
- **H1 region-1-no-zone silent fallback to service default tariff** — order.service.ts:161-169. zoneRow empty → baseFare/perKm fall back to service defaults silently. Fix: explicit per-region decision; log/flag default-path pricing.
- **H2 providerShare on web orders = OK (verified, NOT a bug)** — order.service.ts:251-255,282 computes+saves providerShare for every path incl web. Earlier fix holds.

## MEDIUM
- **M1 referral_code NO unique DB constraint** — rider.entity.ts:74 no unique (vs phone_number:22, email:42). Generator users.service.ts:189-203 check-then-insert (race). Duplicate codes corrupt referral attribution. Fix: add unique:true + migration.
- **M2 phone uniqueness check-then-insert but DB-backstopped** — users.service.ts:144-149,255-261 racy pre-check, but phone_number unique index prevents dup (just 500 not Conflict). Acceptable; optionally translate DB error to ConflictException.
- **M3 createDriver approveImmediately = approved + serviceIds[] + Offline** — users.service.ts:263-284. Internally consistent; not free-ride (matching needs serviceId; status Offline). Policy gap (approve w/o docs) not corruption. Guard worthwhile.

## LOW (verified clean)
- **L1 saved places ownership enforced — NO IDOR** — saved-place.service.ts:36-39 deletes by {id, riderId}; resolver injects user.riderId from JWT. Clean.
- **L2 GeoPoint units consistent** — ST_MakePoint(lng,lat) correct order, no swap.

### Biggest risk
order pipeline trusts client serviceId + regionId without cross-validation (order.service.ts:110-113, 152-158). Crafted request → price off disabled/wrong-region service, wrong tariff, or unlock region-locked coupon. Fix: resolve service with {id, regionId, enabled:true} + derive region server-side from pickup.
