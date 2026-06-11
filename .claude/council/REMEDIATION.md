# HANCR — خطة المعالجة (Remediation) — 2026-06-11

مصدر النتائج: مجلس LLM (5 وكلاء + مراجعة متبادلة). التفاصيل في `01..05-*.md` و`VERDICT.md`.

---

## ✅ أُصلح في هذه الجلسة (مُتحقَّق: tsc = 0 أخطاء على الـ3 APIs)

### الأمن
1. **أسرار JWT منفصلة وقوية + fail-fast** — راكب `JWT_SECRET`، سائق `JWT_DRIVER_SECRET`، أدمن `ADMIN_JWT_SECRET`؛ حُذفت كل القيم الاحتياطية المزروعة؛ الخادم يرفض الإقلاع إن نقص سرّ أو قلّ عن 32 محرفاً. (rider/driver/admin jwt.strategy + auth.module + auth.resolver) — يُبطل تزوير الأدمن الخارق.
2. **وقف تسريب OTP** — حُذف شرط `!sms.success` (كان يكشف الكود في الإنتاج عند فشل Twilio = استيلاء على الحساب)، وحُذف تسجيل OTP نصّاً صريحاً. (rider/driver auth.service)
3. **شحن المحفظة المجاني محصور في غير الإنتاج** — مسار المحاكاة في `startWalletRecharge` يرمي خطأً في الإنتاج. (wallet.resolver)
4. **`confirmWalletRecharge` محصور في dev** — لا يستطيع الراكب تأكيد شحنته ذاتياً في الإنتاج (التأكيد عبر webhook فقط). (wallet.resolver)
5. **حُرّاس أدوار الأدمن** — `banRider/unbanRider/approveDriver/banDriver/unbanDriver/setDriverApproval` تتطلّب `@RequireRole('ops')` (super يمرّ دائماً). (users.resolver)
6. **إصلاح IDOR المحادثة** — اشتراك `orderMessageAdded` يتحقّق من ملكية الطلب قبل البثّ. (chat.resolver + chat.service)
7. **كلمة مرور أدمن قوية للبذرة** + تحديث `.env`/`.env.example`/`.env.prod.example`.

### المال/المنطق
8. **عمولة المنصة `providerShare` تُحسَب وتُحفظ** — في `createOrder` و`bid.acceptOffer` (كانت دائماً 0 = المنصة تدفع للسائق 100%). (order.service + bid.service)
9. **قبول الرحلة ذرّي** — تحديث مشروط `WHERE status='Found'`؛ يمنع إسناد سائقَين لنفس الرحلة. (driver order.service)
10. **قبول المزايدة ذرّي** — تحديث مشروط `WHERE status='Open'`؛ يمنع القبول المزدوج/بعد الانتهاء. (bid.service)
11. **زيادة الكوبون ذرّية** — `UPDATE ... WHERE (max_uses=0 OR used_count<max_uses)`؛ يمنع تجاوز الحد بالتزامن. (coupon.service)
12. **تحرير السائق عند الإلغاء** — `cancelOrder` يعيد السائق المُسنَد من Busy إلى Online (DB). (order.service)
13. **`cleanupExpiredBids` يفلتر على DB** — بدل تحميل كل المزايدات المفتوحة للذاكرة. (bid.service)

---

## ✅ أُصلح في الموجة 3 — البنية التحتية الحرجة (مُتحقَّق: tsc=0)
14. **webhook الدفع يتحقّق من البايتات الخام** — `rawBody:true` في rider-api + تمرير `req.rawBody` + دالة `extractRawBody` في البوابات الثلاث (Stripe/HyperPay/Moyasar). الشحنات الحقيقية تُقبَل الآن (كانت تُرفض كلها). (gateway.interface + 3 gateways + wallet-webhook.controller + main.ts)
15. **فهارس DB** — migration جديد `1779700000000-AddPerformanceIndexes`: فهارس على `order(status/rider_id/driver_id/status+expected)`, `bid(status+expires_at)`, `driver(status)`. (phone مفهرس مسبقاً)
16. **أقفال cron موزّعة** — `CronLockService` جديد في `@hancr/redis` (SET NX EX)، مُطبَّق على الـ7 crons (bid/order×2/commuter/flight/location/intelligence). instance واحد فقط ينفّذ كل نافذة.
17. **إغلاق رشيق** — `app.enableShutdownHooks()` في الـ3 APIs (يُنهي المعاملات ويُغلق DB/Redis/PubSub عند إعادة تشغيل pm2).

⚠️ **migrations الـ~25 entity:** لم أُولّدها يدوياً (خطر/تحتاج DB حيّة). إن كانت DB الإنتاج الحالية تعمل فالجداول موجودة (أُنشئت سابقاً). للنشر على DB نظيفة: شغّل `npm run migration:generate -- libs/database/src/lib/migrations/MissingTables` على DB مُزامَنة، ثم راجع الناتج.

## ✅ أُصلح في الموجة 4 — تجربة المستخدم + تحصين (مُتحقَّق: tsc=0 + flutter analyze نظيف)
18. **مفتاح الخريطة الحية** — `NEXT_PUBLIC_GOOGLE_MAPS_KEY` في `.env.local` + `ARG/ENV` في Dockerfile.admin-panel + `build.args` في docker-compose.prod.yml. الخريطة الحية تعمل الآن.
19. **مهلات بوابات الدفع** — `AbortSignal.timeout(10s)` على fetch في Stripe/HyperPay/Moyasar (اتصال معلّق لا يشبع event loop).
20. **كاش Directions** — DirectionsService يخزّن النتيجة في Redis (مفتاح إحداثيات مقرّبة، TTL 10د) → خفض تكلفة Google Maps.
21. **توطين تطبيق السائق** — الأزرار الأساسية (وصلت/ابدأ/أنهِ الرحلة، قبول/رفض، تحقّق/إعادة الرمز، إرسال الرمز، الملف/المساعدة/الخصوصية) عبر `tr()` + 9 مفاتيح جديدة. flutter analyze نظيف.
22. **أزرار ميتة مربوطة** — صفوف المساعدة/الخصوصية (سائق) + 8 صفوف الملف (راكب) تعرض "قريباً" بدل لا شيء.

## ✅ أُصلح في الموجة 5 — البنود الحسّاسة (مُتحقَّق: tsc=0 + 27 اختبار ناجح)
23. **Throttler-Redis** — ثُبّتت `nestjs-throttler-storage-redis` ووُصِّلت في observability.module عبر `forRootAsync` بتخزين Redis. حدود المعدّل (OTP/login) أصبحت عالمية عبر كل عمليات pm2 بدل لكل عملية.
24. **حدود سعر المزايدة** — `submitBidOffer` يقصّ العرض ضمن [0.5×, 3×] من سعر الراكب المقترح (نِسَب قابلة للتعديل). يمنع عرض 9999 ليصبح أجرة ملزمة.
25. **تسوية الدفع المعامَلاتية** — `_settlePayment` (Wallet): خصم الراكب ثم إيداع السائق، مع **عكس خصم الراكب** (reverseTransaction) عند فشل الإيداع، و**نقل الطلب لـ WaitingForPostPay** عند الرصيد الناقص (لا رحلة مجانية). +2 اختبار جديد، وأُصلح اختبارا acceptOrder والبوابة (كانا يخالفان الكود). **27/27 اختبار ناجح.**

## 🔴 يتطلّب إجراء المالك فوراً (لا يمكنني تنفيذه)
- **تدوير كل الأسرار الخارجية المكشوفة في `.env`** (نُقلت/طُبعت): Neon DB، Twilio (SID+token)، Firebase admin، Google Maps، Mapbox. استبدلها من لوحات مزوّديها.
- بعد تدوير أسرار JWT، **كل التوكنات القديمة بطلت** — المستخدمون يعيدون الدخول (سلوك مقصود).

---

## ⏳ متبقٍّ — مرتّب بالأولوية (يحتاج موافقتك للمتابعة)

### CRITICAL — يمنع عمل الإنتاج
- ✅ **webhook الدفع** — أُصلح في الموجة 3 (بند 14).
- ⏳ **~25 entity بلا migration** — انظر ملاحظة الموجة 3 (يحتاج DB حيّة لتوليده).

### HIGH
- **تسوية الدفع غير معامَلاتية + تُبتلَع** — debit الراكب وcredit السائق معاملتان منفصلتان؛ فشل بعد debit → الراكب يُخصم والسائق لا يُدفع. والرحلة تكتمل برصيد ناقص (مجانية). الحل: لفّ debit+credit في `dataSource.transaction`؛ حالة `SettlementPending` عند الفشل + عدم إكمال الطلب عند insufficient balance. (driver order.service `_settlePayment` + `finishRide`) — **حسّاس، يحتاج اختبارات**.
- **حدود سعر المزايدة** — `offeredPrice` السائق موثوق بلا حدّ. الحل: قصّ ضمن `[أرضية الأجرة, سقف × سعر الراكب المقترح]`. **يحتاج قرار عملي للحدود**.
- ✅ **فهارس DB** — أُصلح في الموجة 3 (بند 15).
- ✅ **أقفال cron** — أُصلح في الموجة 3 (بند 16).
- **Throttler في الذاكرة** — حدود لكل عملية لا عالمية. الحل: `ThrottlerStorageRedis` (يحتاج تثبيت `nestjs-throttler-storage-redis`).
- ✅ **graceful shutdown** — أُصلح في الموجة 3 (بند 17).
- **Directions بلا cache** — انفجار تكلفة Maps. الحل: cache Redis مفتاحه lat/lng مقرّب + waypoints، TTL قصير.
- **gateway fetch بلا timeout** — اتصال معلّق يشبع event loop. الحل: AbortController 5-10s.
- **تطبيق السائق نصفه إنجليزي** (RTL عربي) — أزرار الرحلة الأساسية. الحل: توجيه النصوص عبر `tr()`.
- **أزرار ميتة** — 7 صفوف راكب + 4 سائق (`onTap:(){}`). الحل: ربطها أو toast "قريباً".
- **الخريطة الحية فارغة** — `NEXT_PUBLIC_GOOGLE_MAPS_KEY` مفقود + غير مخبوز في Dockerfile.admin-panel. الحل: إضافته للبيئة + `ARG`/`ENV` قبل `npm run build`.

### MEDIUM/LOW (راجع `03`/`04`/`05`)
- OTP السائق 4 خانات Math.random + لا فحص انتهاء في confirmDelivery (استخدم crypto.randomInt 6 خانات).
- حساب المال بـ float (استخدم وحدات صغرى صحيحة).
- لا DataLoader (N+1)، لا pool sizing، readiness بلا Redis، Sentry بلا tracing.
- CORS reflect+credentials في غير الإنتاج، formatError غير مُقنّع.
- مفتاح Maps مزروع في manifests أندرويد (قيّده بتوقيع الحزمة).
- CI: نسخة Flutter 3.27 vs 3.41 + `--no-fatal-warnings`؛ deploy.yml معلّق؛ اللوحة/الموقع بلا تغطية CI.
- `ignoreBuildErrors:true`+`ignoreDuringBuilds:true` في اللوحة (أخطاء تُشحَن صامتة).
- `/showcase` يُشحَن مع auth-bypass (احرسه بـ kDebugMode).
- اللينت: 6 استيرادات غير مستخدمة + `useQuery` مشروط (rules-of-hooks) في wallets/[type]/page.tsx:77.
