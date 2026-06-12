# Wave F — Executor (admin authz + injection + build verify)

## Part A — Admin AuthZ + Validation
### RBAC — PASS (all 4 new mutations fully guarded)
All carry `@UseGuards(AdminJwtGuard, AdminRolesGuard)` + `@RequireRole('ops')` (users.resolver.ts):
- adminCreateRider :54-56 · adminUpdateRider :63-65 · adminCreateDriver :111-113 · adminUpdateDriver :119-122.
Role guard enforces (admin-roles.guard.ts): rejects unauth :29, super always :31, required-role checked :32-36. adminListRiders/getRider/riderDetail/getDriver intentionally AdminJwtGuard-only (read, any role) — consistent.
DispatcherDrawer's mutation **adminCreateManualOrder** guarded: order-detail.resolver.ts:60-61 RequireRole('ops'). Not abusable by lower role.

### Findings
- **[LOW] new admin DTOs lack class-validator** — user.types.ts:119-167. Sibling DTOs validate (order-detail.types.ts:23-30, wallet/complaints/broadcast). The 4 new inputs had only @Field. Global ValidationPipe(whitelist) strips unknown + GraphQL scalar typing rejects type-mismatch, but NO phone/email/length check. ops admin could persist garbage phone (extractCountryCode slices substring(0,4)) or bad email. Fix: @IsPhoneNumber/@Matches/@IsEmail/@MaxLength. **[FIXED in Wave F]**
- **[INFO] No SQL injection** — only TypeORM repo calls (findOne/create/save) + one parameterized QueryBuilder (getRiderDetail :74-79 `.where('o.rider_id=:id',{id})`). No raw interpolation. listDrivers:239 static literal. Clean.
- **[INFO] DispatcherDrawer not abusable beyond role** — inputs Number()-coerced client + @IsInt server (order-detail.types.ts:23-30); driverIdHint force-assign gated by same RequireRole('ops').
- **[INFO] createRider/createDriver dup-phone check is check-then-insert (TOCTOU)** — users.service.ts:144,255 — but phone_number unique index backstops → 500 not corruption. Cosmetic.

## Part B — Build Status
| Target | Command | Result | Errors |
|---|---|---|---|
| rider-api | tsc --noEmit | PASS | 0 |
| driver-api | tsc --noEmit | PASS | 0 |
| admin-api | tsc --noEmit | PASS | 0 |
| admin-panel | tsc --noEmit | FAIL (pre-existing only) | 1 — known .next/types settings/cancel-reasons TS2344 (UpsertModal re-export). NOT new. ignoreBuildErrors masks it. |
| landing | tsc --noEmit | PASS | 0 |
| driver-api tests | jest order.service | PASS | 27/27 (incl 8 settlement) |

## Verdict
1. Safe on authz: all 4 new admin mutations + Dispatcher manual-order guarded (AdminJwtGuard+AdminRolesGuard+RequireRole('ops')); no injection (TypeORM parameterized).
2. One non-blocking gap: new DTOs lacked class-validator (FIXED Wave F).
3. Build effectively green: rider/driver/admin-api + landing 0 errors, 27/27 tests; lone admin-panel tsc failure is pre-existing cancel-reasons generated-type error.
