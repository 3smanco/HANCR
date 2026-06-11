# First Principles — Logic / Money Integrity Findings

## CRITICAL
1. **Platform commission always ZERO** — driver order.service.ts:500-501 reads providerShare (never assigned in createOrder rider:256-310 or bid.service.ts:150-166), @Column default 0 persists. ServiceEntity.providerSharePercent(20) never applied. Driver paid 100% of fare; platform revenue 0. Fix: compute providerShare = round(costAfterCoupon * service.providerSharePercent/100,2) and persist before settlement.
2. **Concurrent driver-accept double-assignment** — acceptOrder driver:98-119 read-check-update, no lock/txn. Two drivers both read Found, both succeed. Fix: conditional UPDATE ... WHERE id=$2 AND status='Found', affected===0 → throw.
3. **Settlement outside transaction, swallowed on failure** — finishRide/confirmDelivery driver:333-340,409-415 _settlePayment in try/catch logs only, after order moved to WaitingForReview. Debit(502)+credit(599) separate txns; credit throws after debit commits → rider charged, driver unpaid, no rollback. Fix: single dataSource.transaction; on failure → SettlementPending state + retry job.
4. **finishRide ignores InsufficientBalance, still completes** — _settlePayment driver:521-529 returns+logs on insufficient wallet, but status already WaitingForReview(311). Free ride. Fix: WaitingForPostPay hold, block closure, create receivable.
5. **~25 entities have NO migration (synchronize:false)** — only 3 migrations, 18 tables covered, 44 entities. Missing: pricing_zone, fleet (used in createOrder raw SQL order.service.ts:139,426), company, coupon, payout, etc. → "relation does not exist" on order creation. Fix: generate migrations for all unmigrated entities before prod.

## HIGH
6. **Bid driver-price trusted, no bounds** — acceptOffer bid.service.ts:149-166 takes offeredPrice verbatim as costBest/costAfterCoupon. No validation vs riderProposedPrice/server estimate/min-max. Fix: clamp [serverFloorFare, riderProposedPrice*cap], reject out-of-range.
7. **OTP 4-digit Math.random, delivery OTP no expiry on driver path** — order.service.ts:302/305 Math.floor(1000+random*9000). confirmDelivery driver:376 caps 5 but never checks otpExpiresAt (unlike verifyDeliveryOtp:673). Fix: crypto.randomInt, 6 digits, enforce otpExpiresAt, global throttle.
8. **Coupon usage limits racy** — validate coupon.service.ts:47,62-69 checks then incrementUsage(98) after commit, no lock. Concurrent both pass. Fix: atomic UPDATE coupon SET used_count=used_count+1 WHERE id=$1 AND (max_uses=0 OR used_count<max_uses) RETURNING inside order txn.
9. **confirmWalletRecharge rider self-credit** — wallet.resolver.ts:189-233 JwtAuthGuard only, promotes own Pending→Completed credit, no webhook. (Same as Contrarian #4). Fix: remove rider-facing / webhook-only.
10. **Cancellation after DriverAccepted leaves driver stuck Busy, no fee** — cancelOrder rider:611-653, never resets driver status/Redis, no cancel fee. Fix: set driver Online + driverRedis.setStatus + apply cancellation fee.

## MEDIUM
11. **Floating-point money math** — number + Math.round(x*100)/100 everywhere (matching:153, order:177, coupon:86, wallet:281,335). Drift; cached balance vs ledger mismatch. Fix: integer minor units / decimal lib.
12. **rateDriver non-atomic paidAmount tip** — order.service.ts:758-767 JS read-add-update, races settlement. Fix: SQL paid_amount = paid_amount + :tip.
13. **Settlement currency mix** — driver credited in order.currency(driver:603) but wallet enforces input.currency===ownerCurrency(wallet:311); mismatch throws→swallowed→driver unpaid. Fix: convert/settle in driver wallet currency.
14. **No DB index on order hot paths** — no index on status/riderId/driverId/expectedTimestamp; getActiveOrder 9 queries(829-834); crons scan every 30-45s. Fix: composite (riderId,status),(driverId,status),(status,expectedTimestamp).
15. **Bid acceptOffer no row lock** — bid.service.ts:130-141 check-then-update, races expiry cron(187). Fix: conditional UPDATE bid WHERE status='Open'.
16. **Hardcoded currency in bid display** — bid.service.ts:237 'QAR' always; toType:249 'SAR'; order entity:107 'QAR'. Inconsistent. Fix: derive from bid.currency, unify default.

## LOW
17. **Surge config dead code** — getSurgeMultiplier(app-config-reader:148) never called; only zone multiplier applies. Fix: wire or remove.
18. **previewRoute ignores zone/surge** — order.service.ts:589-595 base rates only; diverges from createOrder. Fix: use zone-aware path.

### Biggest risks
1. Money leaks by default (providerShare=0, un-transactioned swallowed settlement, free insufficient-balance rides).
2. State corruption under concurrency (driver-accept, bid-accept, coupon redemption all unguarded read-then-write).
3. Prod won't run (pricing_zone/fleet + ~25 entities no migration; rider self-credit mutation).
