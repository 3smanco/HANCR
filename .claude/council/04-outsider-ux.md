# Outsider — Does it actually work (UX/quality) Findings

**KEY CORRECTION:** crash logs (hs_err_pid*, flutter_*.log) are local tooling OOM (zone.cc:96 Out of memory, analysis server -1073740791), NOT app defects. flutter analyze = 0 errors both apps; admin-panel tsc = 0 errors; landing has built out/. Code compiles & builds. "Doesn't work" = dead buttons + unlocalized driver app + unconfigured runtime keys.

## CRITICAL
1. **Driver app core flow hardcoded English in RTL-Arabic product** — active_ride_card.dart:204,214,224 ("Arrived at Pickup","Start Ride","Finish Ride"); incoming_order_sheet.dart:205,216 ("Decline"/"Accept"); auth/otp_screen.dart:130,141; phone_screen.dart:161; profile_tab.dart:78,208,213,219. App has tr() (196×) but primary buttons bypass it. Fix: route all strings through tr()/app_localization.dart, add keys.

## HIGH
2. **Rider Profile — 7 dead menu rows** — profile_tab.dart:339,346,362,370,378,408,415,422 onTap:(){} (payment methods, saved addresses, notifications, language, region, help, privacy, terms). Fix: wire to screens or show comingSoon toast.
3. **Driver Profile + Earnings — 4 dead rows** — driver profile_tab.dart:209,214; earnings_tab.dart:293,306 onTap:(){}. Fix: wire/toast.
4. **Dashboard Live Map blank — NEXT_PUBLIC_GOOGLE_MAPS_KEY absent everywhere** — live/page.tsx:45-46; key missing from .env.local/.env/.env.example/.env.prod.example (only server-side GOOGLE_MAPS_API_KEY exists). Shows "مفتاح Google Maps غير مُعيَّن". Fix: add NEXT_PUBLIC_GOOGLE_MAPS_KEY + rebuild.

## MEDIUM
5. **Saved Places decorative** — home_tab.dart:214-230 home/work rows say "tap to add" but onTap:_startBooking; no add-address flow. Fix: build editor or fix copy.
6. **Service grid 3 services → identical flow** — home_tab.dart:174,180,186 ride/delivery/parcel all _startBooking, no differentiation. Fix: pass service type.
7. **Dead scheduling control** — service_picker_screen.dart:244 "الآن" pill chevron onTap:(){}. Fix: implement schedule sheet or remove chevron.
8. **Dev /showcase route ships, auth-bypassed** — app.dart:69-70,148-149; design_showcase_screen.dart:95 onPressed:null. Fix: guard behind kDebugMode.
9. **Hardcoded Google Maps key in both Android manifests** — rider AndroidManifest.xml:14 + driver:15 literal AIzaSyDTvp_NShN0LVoxH6N_F2b1cD_zrfFkX14 committed. Fix: manifest placeholder from local.properties, restrict by package signature.

## LOW
10. **Stale admin-api/schema.gql** — lacks liveDrivers/adminRiderLookup/adminCreateManualOrder/N11 fields BUT resolvers exist (live.resolver.ts:93, order-detail.resolver.ts:62,74); code-first regenerates at boot so live API serves them. Just stale artifact. Fix: regenerate+commit or gitignore.
11. **Misleading comment driver onboarding upload** — DriverApplicationWizard.tsx:551 says skipped but :552-559 PUTs to GCS. Fix: update comment.
12. **Dead _cachedToken field + prefer_const lints** — push_service.dart:36; cosmetic. Fix: dart fix --apply.

### Why it feels broken
Apps build/run fine (crash logs = local tooling OOM). User hits silent dead ends: rider taps 7+ dead profile rows + decorative saved-places; captain uses half-English app in Arabic-RTL product; dashboard flagship Live Map blank (public Maps key in zero env files). Everything "kind of works but key pieces inert."
