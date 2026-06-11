# HANCR — حالة المشروع (نقطة البداية لأي محادثة جديدة)

> هذا الملف هو **المصدر الحي لحالة المشروع**. يُحدَّث بعد كل خطوة عمل.
> ابدأ أي محادثة جديدة بقراءته (وحده يكفي للسياق) بدل تحميل المهارة الضخمة أو قراءة عشرات الملفات.
> آخر تحديث: 2026-06-11

---

## أين نحن الآن
- **🟦 خطة الإكمال الشاملة (مجلس) — الموجة A جارية.** الخطة: `C:\Users\7bici\.claude\plans\llm-council-lexical-owl.md`. 6 موجات (A لوحة·B تصفير قريباً·C ميزات·D دفع·E ويب·F تدقيق).
  - **A1+A2+A3 منجزة ومنشورة (PR #68، #69):** إنشاء/تعديل راكب وسائق + تسطيح حجز رحلة. الثلاثة بنود المسمّاة من المالك مكتملة حيّاً على admin.hancr.com.
    - A1/A2: mutations adminCreateRider/Driver+Update (RequireRole('ops')) + modals.
    - A3: `DispatcherDrawer` استُخرج لمكوّن مشترك `apps/admin-panel/src/components/DispatcherDrawer.tsx` (يقبل presetRider) + زر "احجز رحلة" في orders/page و riders/[id]/page.
  - **A6 منجزة ومنشورة (PR #70):** زر "تعديل البيانات" + modal على صفحتي تفاصيل الراكب والسائق.
  - **🟢 الموجة A مكتملة فعلياً.** اكتشاف مهم: **A4 و A5 كانتا منفّذتين أصلاً** (الفحص بالغ في التقدير): SOS (RESOLVE/ESCALATE) · complaints (ADD_NOTE) · pricing-zones (UPSERT/DELETE) · reverse-wallet (ADMIN_REVERSE_WALLET_TX) · كل صفحات الإعدادات الخمس لها mutations (UPDATE_THEME/LOYALTY/PRICING_RULES/HOME_LAYOUT). الفجوات الحقيقية كانت A1/A2/A3/A6 فقط — كلها منشورة.
  - **متبقٍّ ثانوي (غير حاجب، يمكن لاحقاً):** زر استرداد على تفاصيل الطلب (لا يوجد adminRefundOrder backend — البديل: wallet adjust) · A7 إخفاء أزرار اللوحة حسب دور الأدمن (الـ backend يفرض RBAC أصلاً).
    - ملاحظة نشر: تعديلات admin-panel فقط = rebuild admin-panel (لا API restart). backend = server-fix-restart.sh.
  - **🟩 الموجة B (تصفير "قريباً") — الكود مدموج (PR #71)، نشر APK جارٍ.** اكتشاف: التطبيقان يستخدمان شاشات **Aurora** (الشاشات القديمة main_screen/profile_tab/home_screen كود ميت غير مُوجَّه — toasts الموجة 4 فيها لا تظهر). العناصر الحيّة المعالَجة:
    - سائق: الدعم→بريد support@hancr.com · بيانات السيارة→شاشة تعديل (DriverUpdateRequested) · الحساب البنكي→AuroraPayoutMethodsScreen · مشكلة الرصيد→الدعم.
    - راكب: زر المركز (AI)→حجز سريع /book · إزالة أزرار الدخول الاجتماعي الوهمية · إزالة بطاقة premium + أزرار إرسال/كشف الوهمية بالمحفظة.
    - flutter analyze بلا أخطاء. أداة جديدة: `launchSupportEmail` في `apps/driver-app/lib/core/utils/external_launch.dart`.
    - **✅ منشورة:** APK الراكب (98.5MB) والسائق (94.5MB) أُعيد بناؤهما ورُفعا لـ /var/www/hancr-landing/downloads — كلاهما HTTP 200 على hancr.com/downloads.
  - **🟪 الموجة C — تدقيق الحالة الحيّة (تصحيح للفحص، مثل A4/A5):**
    - ✅ **منفّذ أصلاً:** التقييم بعد الرحلة (`aurora_rate_driver_screen.dart` + `/rate` في app.dart:145 + `rateDriverMutation` + order_bloc) · الإحالات (`InviteFriendsScreen` موصولة في aurora_profile_tab:135) · المحفظة/الشحن (aurora_wallet + recharge).
    - 🔴 **فجوة حقيقية:** شاشة إدارة الأماكن المحفوظة — الـ gql جاهز كاملاً (`savedPlacesQuery`/`addSavedPlaceMutation`/`deleteSavedPlaceMutation` في `apps/rider-app/lib/core/graphql/gql/rider_gql.dart`)، لكن لا شاشة إدارة في الملف (تُستخدم فقط داخل grocery/airport). الإضافة تحتاج منتقي موقع (يوجد `destination_bottom_sheet.dart` + geocoding للإعادة).
    - ⚠️ **تحسينات (ليست فجوات حادة):** الرحلات المجدولة (منتقي وقت موجود، تحقّق صارم، لا cron مطابقة) · توقّع أرباح السائق (earnings_tab فيه إحصاءات، الإضافة بطاقة توقّع) · شاشة كوبونات الراكب (`validateCoupon` موجود).
    - **التوصية:** كل بند C ميزة مركّزة + يتطلّب بناء APK (~16د/تطبيق) للنشر؛ يُنفَّذ بنداً بنداً في جلسات مركّزة. الأوضح للبدء: شاشة الأماكن المحفوظة (backend جاهز).
  - **بعد C:** D (دفع ببوابة) · E (ويب: دخول+حجز — الأكبر، مراجعة أمنية).
- **خطة N مكتملة (N1→N11).** آخر إنجاز: N11 — ذكاء اللوحة (PR #63).
- **🔒 فحص أمني شامل (مجلس LLM) — 2026-06-11:** أُصلحت 13 نقطة حرجة/عالية (أمن+مال)، مُتحقَّقة tsc=0. التفاصيل والمتبقّي المرتّب في `.claude/council/REMEDIATION.md`. تقرير المجلس: `.claude/council/council-report-20260611.html`.
  - **أُصلح:** أسرار JWT منفصلة+fail-fast · وقف تسريب/تسجيل OTP · حصر شحن المحفظة المجاني+التأكيد الذاتي في dev · حُرّاس أدوار الأدمن · IDOR المحادثة · `providerShare` عمولة المنصة · قبول الرحلة/المزايدة/الكوبون ذرّي · تحرير السائق عند الإلغاء · `.env` بأسرار قوية.
  - **⚠️ على المالك:** تدوير أسرار `.env` الخارجية المكشوفة (Neon/Twilio/Firebase/Maps/Mapbox). التوكنات القديمة بطلت → إعادة دخول.
  - **🔧 الموجة 3 (بنية تحتية) منجزة:** webhook الدفع يتحقّق من البايتات الخام (الشحنات تعمل الآن) · migration فهارس DB (`1779700000000`) · `CronLockService` على الـ7 crons · `enableShutdownHooks` في الـ3 APIs. كلها tsc=0.
  - **🎨 الموجة 4 (UX + تحصين) منجزة:** مفتاح الخريطة الحية (env+Dockerfile+compose) · مهلات بوابات الدفع · كاش Directions في Redis · توطين أزرار تطبيق السائق (9 مفاتيح، flutter analyze نظيف) · ربط 10 أزرار ميتة بـ"قريباً" (سائق+راكب).
  - **متبقٍّ (يحتاج موافقة):** migrations الـ~25 entity (يحتاج DB لتوليده) · تسوية الدفع المعامَلاتية (حسّاس، يحتاج اختبارات) · حدود سعر المزايدة (قرار عملي) · Throttler-Redis (يحتاج حزمة) · OTP السائق 6 خانات crypto.
- **🚀 نُشر على الإنتاج (2026-06-11):** PR #65 مُدمَج في main (squash 6ca02a7). الخادم على 6ca02a7، npm ci، الـ3 APIs + admin-panel أُعيد تشغيلها وكلها `/health/ready=200`. فهارس الأداء مطبَّقة عبر docker exec psql (CONCURRENTLY). admin-panel أُعيد بناؤه بمفتاح الخريطة (مخبوز ✓).
  - **درس مهم للنشر:** pm2 يعمل على المضيف لا داخل docker. `.env.prod` يحوي `DATABASE_HOST=postgres`/`REDIS_HOST=redis` (أسماء شبكة docker لا تُحلّ على المضيف). **لا** تُعِد التشغيل بـ `--update-env` بعد `source .env.prod` مباشرة. الصحيح: استخدم `scripts/server-fix-restart.sh` (يضبط HOST=127.0.0.1 ويعيد عبر ecosystem.config.js). docker postgres/redis منشوران على 127.0.0.1:5432/6379.
  - **ecosystem.config.js على الخادم:** أُضيف `JWT_DRIVER_SECRET: process.env.JWT_DRIVER_SECRET` (كتلة السائق كانت تمرّر JWT_SECRET فقط). المنافذ: rider 3000 · driver 3001 · admin 3002 · admin-panel 3003.
- **✅ التطبيقات منشورة (2026-06-11):** أُعيد بناء APK release للراكب (98.5MB) والسائق (94.5MB)، ورُفعا إلى `/var/www/hancr-landing/downloads/hancr-{rider,driver}.apk` (www-data 644). كلاهما يردّ HTTP 200 على hancr.com/downloads. (نسخ احتياطية `.bak` محفوظة.)
- **⏸️ محجوب — توليد migration الجداول الناقصة:** Docker Desktop المحلي غير مستجيب (postgis pull عالق، 5433 ECONNREFUSED). غير حاجب: prod فيه كل الجداول. أمر التشغيل الجاهز عند توفّر Docker (يصلح خطأ ts-node TS5109 عبر TS_NODE_PROJECT):
  ```
  docker compose -f docker/docker-compose.yml up -d postgres   # انتظر healthy
  TS_NODE_PROJECT=tsconfig.base.json node --require ts-node/register/transpile-only ./node_modules/typeorm/cli.js migration:run -d libs/database/src/lib/data-source.ts
  TS_NODE_PROJECT=tsconfig.base.json node --require ts-node/register/transpile-only ./node_modules/typeorm/cli.js migration:generate libs/database/src/lib/migrations/MissingTables -d libs/database/src/lib/data-source.ts
  ```
  (data-source يحمّل `.env` عبر dotenv → DB المحلي localhost:5433. راجع SQL المولّد قبل الاعتماد.)
- **⚠️ نشر هذه الإصلاحات:** الـ3 APIs تحتاج rebuild + `pm2 restart`. شغّل migration الفهارس: `npm run migration:run`. تأكّد من وجود `JWT_DRIVER_SECRET` و`STRIPE/HYPERPAY/MOYASAR_WEBHOOK_SECRET` في بيئة الإنتاج (fail-fast يرفض الإقلاع بدونها).
- **الخطة المعتمدة:** `C:\Users\7bici\.claude\plans\valiant-percolating-sparkle.md` (مكتملة).
- **نشر معلّق على الإنتاج (PRs #57–63):**
  - backend (rider/driver/admin-api): `git pull` + rebuild + `pm2 restart`. لا migration (كل شيء على حقول JSON قائمة / استعلامات قراءة).
  - admin-panel: rebuild (تذكّر `.env.production` بـ NEXT_PUBLIC_ADMIN_API_URL قبل build).
  - تطبيقات Flutter: إعادة بناء APK (deps حركة جديدة في N6 + ميزات N5–N10).
- ⚠️ خطأ tsc سابق في `apps/admin-panel/src/app/live/page.tsx` (GoogleMap vs React types) غير متعلّق بخطة N — مهمة منفصلة.

## خطة N — منجزة
- N7: أنيميشن الراكب (splash glow, bid bounce, ripple, success) — PR #59
- N8: أنيميشن السائق + سيارة متحركة على الخريطة (DriverCarMap) — PR #60
- N9: Live Activity bar + إيصال قابل للمشاركة — PR #61
- N10: أدوات السائق (أرباح يومية + هدف + heatmap الطلب) — PR #62
- N11: ذكاء اللوحة (surge engine + حملات مجدولة + A/B flags) — PR #63
- قرارات معتمدة: أنيميشن "أقصى" · ثيم تحكم كامل حي · الربط باللوحة أولاً · كل فئات الميزات الجديدة.

## ما أُنجز (مختصر — التفاصيل في git log و المهارة)
- I1–I11: لوحة إدارة كاملة. J1–J9: موقع تسويقي. K1–K4, L1–L3, M1–M4: JWT/تسعير/وثائق/دفع/PostGIS/تسجيل سائق/APKs.
- N1: AppConfig مصدر حقيقة. N2: صفحات SDUI. N3: تفصيل الراكب+loyalty. N4: دفعات السائقين (Stripe).
- N5: الثيم الحي — `AuroraColors` صار non-const يُقرأ من `themeConfig` (صف `main`) عبر `AuroraThemeData.apply` + `ThemeController`؛ استعلام عام `appTheme` في rider-api و driver-api.
- N6: مكتبة الحركة `lib/core/motion/motion.dart` (barrel) — Motion tokens · Haptics · Pressable · AppTransitions · PulseRing/GlowPulse · Skeleton · `.fadeSlideIn/.popIn` · LottieView · RiveView · SuccessCheck. حزم: flutter_animate/lottie/rive/shimmer. مطابقة في التطبيقين.

---

## المعمارية (مرجع سريع — لا تُعِد اكتشافها)
- Monorepo Nx على `E:\HANCR` (Windows). PostgreSQL 16+PostGIS+Redis. `synchronize:false` (migration يدوي).
- Backend: rider-api:3000 · driver-api:3001 · admin-api:3002 (NestJS+GraphQL code-first+TypeORM).
- Frontend: admin-panel:3003 (Next.js 14) · landing:4000.
- Mobile: rider-app + driver-app (Flutter، تصميم Aurora obsidian/ember، Cairo/Inter، RTL).
- entity جديد يُسجَّل في 3 أماكن: `libs/database/src/index.ts` + `data-source.ts` + module `entities[]`.
- ثيم الموبايل الحي: `apps/{rider,driver}-app/lib/core/theme/aurora_theme.dart` + `theme_controller.dart`. محرّر اللوحة: `apps/admin-panel/src/app/settings/theme/page.tsx`.
- مكتبة الحركة: `apps/{rider,driver}-app/lib/core/motion/motion.dart` (barrel). أصول Lottie/Rive في `assets/anim/`.

## أوامر التحقق (شغّلها قبل أي commit)
- Backend: `npx tsc --noEmit -p apps/<api>/tsconfig.app.json` (rider/driver/admin) → 0 أخطاء.
- Flutter: `cd apps/<app> && flutter analyze` → 0 errors (info/warning تجميلية مقبولة). ⚠️ لا تشغّل تحليلين معاً (تتعطّل الأداة).
- بعد تعديل كود: `graphify update .` (تلقائي عبر Stop hook الآن — راجع `.claude/settings.json`).

## نمط العمل (إلزامي)
PR-per-feature: branch → commit (`Co-Authored-By: Claude Opus 4.8`) → push → `gh pr create` → `gh pr merge --squash --delete-branch` → (نشر السيرفر بعد التأكيد).

## الإنتاج
GCE `hancr` (zone me-central1-a). pm2: rider/driver/admin-api + admin-panel. nginx: hancr.com / api.hancr.com (/rider /driver /admin) / admin.hancr.com. DB: docker `hancr_postgres_prod` (DB=hancr_prod). المسار `/opt/hancr` (user `info`). SQL يدوي عبر `docker exec hancr_postgres_prod psql`.

## أرقام الاختبار
راكب +966500000001 · سائق +966500000010 · OTP 1234 · admin@hancr.com.
