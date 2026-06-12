# Wave F — Outsider (does it actually work?)

## CRITICAL
- **Web OTP = silent dead end when Twilio fails** — auth.service.ts:108-112 sendOtp returns success:true unconditionally even when sms.success=false (live 21608 = Twilio trial/unverified). devOtp null in prod (isDev/isTestPhone false). Web client (riderAuth.ts:58-63) only throws on json.errors (none) → AccountClient.onSendOtp:191-192 always advances to OTP screen. User: "Code sent" but nothing arrives, stuck, no error shown. **Web AND app login unusable for real numbers until Twilio upgraded.** Fix: (a) PRODUCT: upgrade Twilio (A2P/KSA sender); (b) CODE: return success:false/smsDelivered flag when sms fails & not dev, web shows "تعذّر إرسال الرمز".
- **Web booking autocomplete dead unless Maps key has Places API + hancr.com referrer** — AccountClient.tsx:30-44,96-117,365-370. Destination relies entirely on Places Autocomplete → destCoord. If key is Static-only / missing Places API / referrer not hancr.com → dropdown silent (onerror swallowed :116 `.catch(()=>{})`). "Estimate fare" stays disabled (`!destCoord` :400). Zero saved places = autocomplete only path = fully dead. Fix: verify key APIs+referrer; surface loadGoogleMaps rejection; add Geocoding fallback.

## HIGH
- **Geolocation denied = booking blocked, no manual origin** — AccountClient.tsx:127-137. Deny → one-line error, origin null, calcEstimate hard-blocks (:142-145). No manual/Autocomplete origin fallback. Fix: allow manual origin entry.

## MEDIUM
- **False "ride requested ✓" for NotFound orders** — order.service.ts:551-560 createOrder doesn't throw when no drivers in range; saves status:NotFound, returns {id,status}. Web (AccountClient.tsx:332-350) keys success on order.id → shows green success for a failed match. Fix: branch web UI on order.status (NotFound → "no drivers nearby").
- **Empty services silent dead-end** — if seed-services not run for region 1, fetchServices returns [], select empty, serviceId null, Estimate disabled forever, no message. Fix: explicit empty-state when services.length===0.

## LOW
- **Admin create-rider works end-to-end** ✓ — riders/page.tsx:61-77 regex mirrors DTO @Matches; placeholder valid; backend createRider only needs phone; ConflictException toasted; loading/empty states present. Clean.
- **DispatcherDrawer NaN** — DispatcherDrawer.tsx:66-71 `Number('abc')→NaN` passes `!!originLat` truthiness → sends NaN to API. No map/geocode for real dispatch. Fix: reject NaN before enabling submit; add Autocomplete.

### Why it might feel broken
1. Send code → nothing arrives (Twilio trial can't text unverified KSA numbers; backend hides failure as success:true).
2. Past login, booking can't complete if Maps key lacks Places API/referrer — silent empty dropdown, no fallback.
3. Screens fail QUIETLY: swallowed catch on Maps, no SMS-failed banner, no empty-services state, false "ride requested ✓" for NotFound. Admin create-rider is the exception (works).
