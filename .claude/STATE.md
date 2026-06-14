# HANCR — حالة المشروع (نقطة البداية لأي محادثة جديدة)

> هذا الملف هو **المصدر الحي لحالة المشروع**. يُحدَّث بعد كل خطوة عمل.
> ابدأ أي محادثة جديدة بقراءته (وحده يكفي للسياق) بدل تحميل المهارة الضخمة أو قراءة عشرات الملفات.
> آخر تحديث: 2026-06-12

---

## 🛑 سبب جذري حرج (2026-06-12) — لماذا فشل الدخول في كل مرة
**الـ APK كان يُبنى بـ `flutter build apk --release` المجرّد بدون `--dart-define=ENV=production`.**
`AppConfig.env` يفترض `development` افتراضياً → `graphqlUrl = http://10.0.2.2:3000` (مُحاكي أندرويد) → على هاتف حقيقي = غير موجود → `TimeoutException after 5s: No stream event`. الخادم سليم تماماً؛ التطبيق كان يكلّم العنوان الخطأ.
**القاعدة (إلزامي لكل بناء APK):** استخدم دائماً:
```
flutter build apk --release --dart-define=ENV=production \
  --dart-define=MAPS_API_KEY=<key> --dart-define=MAPS_KEY=<key> \
  --dart-define=GOOGLE_SERVER_CLIENT_ID=<id-or-empty>
```
أو سكربت `scripts/build-flutter-release.sh` (يضبط ENV=production افتراضياً، لكنه يستخدم --split-per-abi؛ للنشر كملف واحد hancr-*.apk ابنِ universal كما أعلاه).

## 🗺️ سبب جذري حرج (2026-06-13) — لماذا كانت الخريطة فارغة على أندرويد
**المانيفست كان يستخدم مفتاح الويب `AIzaSyCwLtWyS6m44JNXWjTRCyOkR83GirSkZ3o` (مقيَّد بـ HTTP referrers لـ hancr.com).** المفاتيح المقيَّدة بالـ referrer **لا تعمل أبداً مع Android Maps SDK** (تطبيقات أندرويد لا ترسل referrer) → بلاطات الخريطة لا تُحمَّل → خريطة فارغة/رمادية.
**الإصلاح الجذري (مُنجَز عبر المتصفّح في حساب المالك، مشروع hancr-494520):**
- **مفتاح الخرائط للأندرويد (راكب+سائق) = `AIzaSyBsz0l4Vpb7FYNi6r1ZnlX62F28frgy9ys`** (اسمه "Maps Platform API Key"). قُيِّد إلى **Android apps**: `com.zancr.hancr_rider` + `com.zancr.hancr_driver`، كلاهما ببصمة الإصدار SHA-1 `B1:E0:93:51:16:22:D4:ED:F9:64:0A:B0:97:BD:F3:82:CA:5C:19:9D`. يشمل Maps SDK for Android ضمن 33 API. هذا المفتاح في مانيفست التطبيقين الآن.
- **مفتاح الويب يبقى منفصلاً:** "HANCR" = `AIzaSyCwLtWyS6m44JNXWjTRCyOkR83GirSkZ3o` (HTTP referrers لـ hancr.com) — للموقع فقط، لم يُمَس.
- التطبيق لا يجري أي نداء Maps/Places/Directions عبر HTTP (خرائط أصلية فقط)، لذا قيد Android apps يكفي.
- أُثري نمط `_darkMapStyle` (booking + tracking) لإظهار الشوارع وأسماؤها + الطرق السريعة + المياه + الحدائق + المعالم + الحدود الإدارية (المناطق) + أسماء المدن/الأحياء.
- **بعد التثبيت:** يجب على المستخدم **إلغاء تثبيت** التطبيق القديم ثم تثبيت APK الجديد (المفتاح في المانيفست يُقرأ عند البناء).
- **✅ مبني + منشور (2026-06-13):** أُعيد بناء APK الراكب (94.6MB، release-signed) والسائق (90.5MB) بالمفتاح الجديد (مُتحقَّق بـ `aapt dump xmltree` → القيمة `AIzaSyBsz0...`)، ورُفعا حيّاً: `hancr.com/downloads/hancr-rider.apk` (HTTP 200) و`hancr-driver.apk` (HTTP 200).
- **⚠️ درس بناء مهم على هذا الجهاز:** بناء release واحد يأخذ **~33 دقيقة** (Gradle assembleRelease ~1995s) ويُشبع الذاكرة. Flutter **يحجز مخرجاته في buffer عند الكتابة لملف** فيبدو السجل فارغاً = ليس تعليقاً. **لا تُوقف البناء** — إيقافه يترك Gradle daemon يتيماً (1.3GB) يخنق الجهاز. اضبط `org.gradle.daemon=false` مؤقتاً عند الحاجة، وابنِ تطبيقاً واحداً في كل مرة (بناءان متوازيان يُفسدان كاش Kotlin).

## 🎨 خطة التطوير الشاملة (2026-06-13) — `.claude/plans/zesty-wiggling-ritchie.md`
5 مراحل: (1) هوية/لوجو · (2) صقل Aurora · (3) محرّك التسعير · (4) تطوير الموجود · (5) ميزات جديدة. القرارات: خطة مرحلية · تطوير الهوية الحالية · صقل (لا إعادة تصميم) · تصحيح تسعير + surge ذكي.
- **✅ المرحلة 1 (PR #99، مدموج):** لوجو **"Orbit"** (حرف H + قوس مداري + وميض على obsidian، لوحة Aurora). وُلِّدت أيقونات التطبيقين (adaptive+iOS+legacy+splash) عبر `flutter_launcher_icons`/`flutter_native_splash` (السائق بقوس ذهبي للتمييز)، وخلفية الأيقونة navy→obsidian، وأصول الموقع (favicon/apple-icon/og-image موصولة بـ metadata). مولّد الأصول: `~/hancr-logo-gen/gen.js` + `gen-web.js` (resvg-js؛ يُعاد تشغيله لتعديل اللوجو). **إعادة بناء APK مؤجَّلة لتُجمَّع مع المرحلة 2.**
- **✅ المرحلة 2 (صقل Aurora):** حُذفت **11 شاشة قديمة ميتة** (51→40، عنقود مغلق بلا مراجع حيّة — مُتحقَّق). رُبط `Haptics` بزرّ `AuroraButton` المشترك (نبضة لمسية لكل الأزرار: selection للعادي، warning للخطر). أُنشئ `core/theme/aurora_map_style.dart` (مصدر واحد) وطُبِّق على `pickup_confirmation` (كان بنمط افتراضي فاتح) + booking؛ tracking يبقى بنمطه المميَّز (طريق سريع ember). `flutter analyze` = 0 أخطاء.
- **✅ المرحلة 3 (محرّك التسعير — backend):** أُنشئ `FareCalculator` (مصدر واحد) يستدعيه `previewRoute` و`createOrder` بنفس المدخلات عبر `resolveZonePricing` المشترك → **السعر المعروض = المفروض** (كانا مختلفين). يفرض **الحد الأدنى** (كان مُهمَلاً)، ويطبّق **مضاعفات الذروة** (وقت/يوم/موسم — كانت مُعرَّفة وغير مستخدمة، تؤخذ الأعلى لا تُكدَّس)، ويفعّل **surge** عبر `appConfig.getSurgeMultiplier(regionId)` (كان مبنياً وغير موصول). `previewRoute` يُرجع **تفصيل الأجرة** (FareBreakdownType: أساسي/مسافة/وقت/مضاعفات/حد أدنى/إجمالي). `tsc`=0 · **7 اختبارات jest خضراء**. الصيغة: `total = max(minFee, subtotal × zoneMult × peakMult × surge)`.
  - **ملاحظة:** الأجرة المعروضة في التطبيق صارت صحيحة فوراً دون تعديل موبايل (التطبيق يعرض estimatedFare المُصحَّح). عرض التفصيل في الواجهة + surge ديناميكي حسب العرض/الطلب = تحسين لاحق.
  - **✅ منشور حيّاً على السيرفر (2026-06-14):** `git pull` + `pm2 restart rider-api`. التطبيق يعمل عبر **ts-node** مباشرة (`ecosystem.config.js` → `ts-node --transpile-only`) — **لا خطوة بناء؛ النشر = pull + restart فقط**. مُتحقَّق: `Nest application successfully started` + `api.hancr.com/rider/graphql` → HTTP 200.
  - **⚠️ درس نشر:** `.nx/cache` و`.nx/workspace-data` كانا متعقَّبَين في الريبو فكسرا كل `git pull` على السيرفر. أُصلِح: أُضيفا لـ `.gitignore` وأُزيلا من التتبّع. عند نشر قديم بمشكلة مشابهة: `rm -rf .nx && git checkout -- .nx && git pull`.
- **✅ المرحلة 4 (تطوير الموجود — موبايل):** تبيّن أن الشاشات **الحيّة (aurora)** في التطبيقين مكتملة فعلاً — كل "قريباً"/زر ميت كان في **كود قديم ميت**. حُذف عنقود السائق القديم (8 ملفات: home_screen/earnings_tab/profile_tab/stars_tab/driver_wallet_screen/driver_sos_button/driver_emergency_contacts_screen/add_driver_contact_sheet) + شاشة الراكب الميتة service_picker_screen. مُتحقَّق: صفر "قريباً"/زر ميت في الكود الحيّ (عدا تأجيل Apple Sign-In الصادق). `flutter analyze` (السائق) = 0 أخطاء.
- **🔵 المرحلة 5 (ميزات جديدة) — جارية:**
  - **✅ حجز الويب — خريطة بصرية:** كان الحجز موجوداً نصياً في `AccountClient.tsx` (autocomplete + GPS). أُضيفت **خريطة Google بصرية** (نمط داكن HANCR): علامتا الانطلاق (أخضر) والوجهة (برتقالي) + **خط المسار** (polyline من `routePreview` المُحسَّن) + **النقر على الخريطة يحدّد الوجهة** + ملاءمة الحدود. `routePreview` الويب صار يطلب `polyline`، ومُحمِّل الخرائط أضاف مكتبة `geometry`. `tsc`=0 و`next build`=ناجح. (التقدير دقيق الآن بفضل المرحلة 3.)
  - متبقٍّ في المرحلة 5: أدوات AI للحجز (يحتاج رصيد Anthropic) · الدفع بالبطاقة (يحتاج تاجر).
- **✅ APK الراكب+السائق مبنيان ومنشوران (2026-06-14):** يحملان المراحل 1+2+4 (أيقونة Orbit + الاهتزاز + توحيد الخريطة + تنظيف). حيّان: `hancr.com/downloads/hancr-{rider,driver}.apk` (HTTP 200؛ ~43 و~42 ميجا).
  - **⚠️ درس بناء (ذاكرة الجهاز):** الجهاز بلا pagefile كافٍ (حدّ commit ≈ RAM الفعلية 16GB)، وبناء release كامل (3 معماريات) ينهار بـ `Could not start thread DartWorker` أو يُقتَل Gradle. **الحل الناجح: `--target-platform android-arm64` (معمارية واحدة) + `-Xmx2g` + `parallel=false` + `workers.max=1`** → بناء ~4 دقائق وحجم ~42 ميجا (arm64 يغطي كل الهواتف الحديثة). نسخة universal كاملة تحتاج ذاكرة أكثر (أغلِق Chrome/برامج أو أعِد التشغيل).
  - **⚠️ درس ارتداد (PR #105 أصلحه):** فحص الكود الميت في #103 **استثنى ملفات `aurora_` من البحث عن المستوردين** + أخطأ في حرف grep للأخطاء → حذف `driver_emergency_contacts_screen` + `add_driver_contact_sheet` بينما `aurora_driver_profile_tab`/`aurora_driver_sos_button` يستوردانهما (استيراد نفس-المجلد بلا شرطة). **القاعدة: عند فحص الميتة لا تستثنِ aurora_، وتحقّق بالبناء لا بـ grep وحده.**
- **🟥 متبقٍّ من المرحلة 5 (مؤجَّل بطلب المالك):** أدوات AI للحجز (يحتاج رصيد Anthropic) · الدفع بالبطاقة (يحتاج تاجر).

## 🌍 إعادة بناء لوحة التحكم العالمية (2026-06-14) — `.claude/plans/zesty-wiggling-ritchie.md` (مُعتمد)
برنامج متعدد المراحل لتحويل لوحة التحكم من إقليمية إلى **غرفة عمليات عالمية**. القرارات: منصّة جاهزة عالمياً · تجديد واجهة + طبقة عالمية (إبقاء الـ backend) · ثيم ثنائي داكن-افتراضي · البدء بالأساس+العمليات والمالي+CRM.
- **✅ Phase 0a (الأساس الجغرافي):** `CountryEntity` (iso2/عملة/توقيت/علم/نظام قياس/قاعدة ضريبية/متطلبات وثائق/رقم طوارئ) + `CityEntity` (دولة/توقيت/مركز/bbox) + توسعة `RegionEntity` (country_id/city_id/timezone). migration `1781500000000` يُنشئ الجدولين + يبذر **الخليج مُفعَّل** (قطر/السعودية + الإمارات معطّلة) و**لندن/نيويورك/باريس جاهزة معطّلة**، ويربط المناطق الحالية بالدولة عبر العملة. مُسجَّلة في `HANCR_ENTITIES` + index. `tsc` (database)=0. **لم تُنشَر بعد** (migration يُشغَّل عند النشر).
- **✅ Phase 0b (محرك العملات):** `ExchangeRateService` (Open Exchange Rates عبر `OPEN_EXCHANGE_RATES_APP_ID` + cron كل 6س + جدول احتياطي ثابت، أساس USD) + `CurrencyService.convert/toBase` (عملة عرض أساسية `BASE_DISPLAY_CURRENCY`، USD افتراضي) + `exchangeRates` query (للوحة: الأسعار/المصدر/آخر مزامنة). في `apps/admin-api/.../currency/`، مُسجَّل في `admin-api.module` (+ أُضيفت Country/City لمصفوفة كيانات admin-api). `tsc`=0 · **7 اختبارات jest خضراء**. 🔒 مفتاح OXR = إجراء مالك (يعمل احتياطياً بدونه).
- **✅ Phase 0c (RBAC مُنطقَن):** `AdminUserEntity.scope` (jsonb: `{countries[],cities[]}` أو null=عالمي) + نوع `OperatorScope` + migration `1781500001000`. `ScopeService.allowedRegionIds(operator, {countryIso?,cityId?})` (يحوّل النطاق → regionIds مسموح بها، تقاطع مع طلب الشريط العلوي، كاش 60ث؛ `super` دائماً عالمي) في `apps/admin-api/.../scope/`، مُسجَّل `ScopeModule`. إدارة المشغّلين: super يُعيّن النطاق (create/update + `scope` في النوع). **القاعدة للـ resolvers:** `const ids = await scope.allowedRegionIds(op, req); if (ids) where region_id IN ids`. أُضيف `moduleNameMapper` لـ `@hancr/*` في `apps/admin-api/jest.config.ts` (لازم لاختبارات تستورد الـ libs). `tsc`(db+admin)=0 · **14 اختبار jest أخضر** (7 عملة + 7 نطاق).
- **🎉 Phase 0 (الأساس العالمي) مكتمل بالكامل** (جغرافيا + عملات + RBAC مُنطقَن). **لم يُنشَر بعد** (migrations تُشغَّل عند نشر admin-api؛ الكود في ts-node).
- **⏭️ التالي: Phase 1** — هيكل command-center (ثيم ثنائي داكن) + الشريط العلوي الذكي (فلتر دولة/مدينة، جرس SOS، polyglot RTL/LTR) — واجهة admin-panel.

## 🔐 إعداد Google OAuth (2026-06-12 — أُنجز في حساب المالك عبر المتصفّح)
المشروع: **hancr-494520** (Hancr). أُنشئ في Google Cloud Console:
- **HANCR Web** (Web application) = `GOOGLE_OAUTH_CLIENT_ID` = `390136620892-bkt9ive9las4eqqft40dorpnva676l4l.apps.googleusercontent.com`. JS origins: hancr.com + www. مضبوط على الخادم في `/opt/hancr/.env` + `.env.prod` (مُتحقَّق: الخلفية تتحقّق من توكنات Google).
- **HANCR Rider Android** (package `com.zancr.hancr_rider` + SHA-1 `48:3B:B3:F2:50:4E:94:2B:7F:B1:D4:39:F1:B5:91:16:69:1B:CE:22` = توقيع debug، مُتحقَّق أنه نفس موقّع APK المنشور). يمنع DEVELOPER_ERROR على الجهاز.
- **✅ شاشة الموافقة منشورة للإنتاج (Production):** أي مستخدم Google يقدر يدخل (النطاقات email/profile غير حسّاسة، لا تحتاج مراجعة). (test user 7bicii@gmail.com مُضاف أيضاً.)
- **✅ Android client للسائق:** `HANCR Driver Android` (package `com.zancr.hancr_driver` + SHA-1 debug `48:3B:...`).
- **serverClientId في البناء (راكب + سائق):** أضِف دائماً `--dart-define=GOOGLE_SERVER_CLIENT_ID=390136620892-bkt9ive9las4eqqft40dorpnva676l4l.apps.googleusercontent.com`.
- **🔑 keystore الإصدار — ✅ مُفعَّل (بإذن المالك):** `keys/hancr-upload.jks` (alias `hancr`، كلمة المرور `cb8e9ade6a5bfc48f7996b917662b701` سُلِّمت للمالك، gitignored؛ SHA-1 `B1:E0:93:51:16:22:D4:ED:F9:64:0A:B0:97:BD:F3:82:CA:5C:19:9D`). `key.properties` في android/ للتطبيقين → التطبيقان موقّعان بمفتاح الإصدار، وعميلا Android سُجِّلا ببصمة الإصدار B1:E0 (مُتحقَّق apksigner). **APKs المنشورة release-signed.** (للإطلاق على Play: يُفضَّل Play App Signing — حينها سجّل بصمة Play الإضافية.)
- **✅ G2-سائق (PR #85):** واجهة Google/الإيميل للسائق مكتملة + منشورة (release-signed).
- **✅ G4 التحصينات (منشورة ومُتحقَّقة حيّاً):**
  - CSP + HSTS + X-Frame-Options + nosniff + Referrer-Policy + Permissions-Policy على hancr.com (`scripts/apply-csp.sh` + snippet `/etc/nginx/snippets/hancr-security.conf`).
  - إبطال جلسة الويب: `JwtStrategy.validate` async — يرفض توكنات صدرت قبل آخر logout (Redis `hancr:revoked:rider:{id}`) + إعادة فحص banned كل طلب. mutation `logout` (PR #87). مُتحقَّق: me يعمل ثم يُرفض بعد logout.
  - اشتقاق منطقة الطلب من نقطة الالتقاط في createOrder — **PostGIS ST_Contains** على حدود المناطق (PR #88 ثم #92/#93). migration `1781400000000`+`1781400001000` يملأ مضلّعات قطر/الإمارات/السعودية (data-driven، يُنقَّح بتحديث الصف). مُتحقَّق حيّاً: الدوحة→1، الرياض/جدة→3، القاهرة→NULL. (دبي→NULL لأن منطقة الإمارات `enabled=false`؛ المضلّع يحويها فور تفعيلها → 2.)
- **✅ G3 (دخول Google/الإيميل من الويب) منشور ومُتحقَّق (PR #90):** زرّ Google (GIS) + دخول الإيميل (OTP) على hancr.com/account، مع تدفّق pendingToken لربط الهاتف + mutation logout. `riderAuth.ts` (sendEmailOtp/verifyEmailOtp/googleAuth/logout) + `AccountClient.tsx` (زرّ GIS + شاشتا email/email-otp + link-mode). `NEXT_PUBLIC_GOOGLE_CLIENT_ID` على الخادم. محقَّق حيّاً: الزرّ يُرسَم، GIS مُحمّل، الإيميل والهاتف متاحان. **نشر الموقع:** `scripts/deploy-landing.sh`.
- **🎉 الموجة G مكتملة بالكامل** (G1 خلفي · G2 موبايل راكب+سائق · G3 ويب · G4 تحصينات الثلاثة) + تفعيل keystore الإصدار + نشر شاشة موافقة Google للإنتاج + PostGIS للمناطق.
- **📦 Play App Signing — جاهز للرفع (إجراء المالك الوحيد المتبقّي):** بُنيت AABs الإصدار (`apps/{rider,driver}-app/build/app/outputs/bundle/release/app-release.aab`، موقّعة بمفتاح الرفع hancr-upload.jks). خطوات المالك على Play Console: أنشئ التطبيق → فعّل Play App Signing → ارفع الـ AAB → انسخ **SHA-1 لمفتاح توقيع تطبيق Play** → أضِفه على عميلَي Android في Google Cloud (إضافةً لبصمة الرفع B1:E0). لا يمكن للوكيل إتمامه (يتطلّب حساب Play).

## 🔑 حسابات تجريبية (الدخول — OTP ثابت 123456)
| التطبيق | الرقم/الإيميل | الرمز |
|---|---|---|
| راكب | `+97433000001` · `+97433000002` (قطر) | `123456` |
| راكب (إيميل) | `rider-demo@hancr.com` | `123456` |
| سائق | `+97433000010` · `+97433000011` (قطر) | `123456` |
| سائق (إيميل) | `driver-demo@hancr.com` | `123456` |

قديمة (KSA، تعمل): راكب `+966500000001/02` · سائق `+966500000010/11`. كلها OTP `123456`. تُغلق بـ `ALLOW_TEST_PHONES=false` عند الإطلاق.

## 🟦 الموجة G — دخول بالإيميل + Google (مخطّط؛ G1+G2-راكب منجزة)
- **✅ G2-راكب (PR #82، منشور):** ربط أزرار Google/الإيميل بتدفّقات حقيقية + شاشتا email/email-otp + AuthBloc (email OTP/Google/pendingToken) + google_sign_in. `GOOGLE_SERVER_CLIENT_ID` build-time.
- **⏭️ G2-سائق:** نفس الواجهة للسائق (لم تُنفَّذ بعد؛ دخول هاتف السائق يعمل بعد بناء ENV=production).

**الطلب:** دخول بالإيميل (OTP) + Google على الأسطح الثلاثة (راكب·موقع·سائق) + 3 تحصينات (توكن الويب: إبطال/CSP/TTL · referral_code unique · اشتقاق منطقة الطلب من PostGIS).
**القرارات:** الإيميل=OTP · الهاتف يبقى إلزامياً (ربط بعد دخول Google/الإيميل عبر pendingToken) · الأسطح الثلاثة.

- **✅ G1 — الأساس الخلفي (PR #80، منشور+محقَّق حيّاً + migration مُشغَّل):**
  - معماري: **تدفّق pendingToken** — Google/الإيميل يتحقّق الهوية؛ إن لم يوجد حساب بالإيميل → `needsPhone:true`+`pendingToken` (15د، scope=link-phone) → يُكمل بـ verifyOtp(phone+pendingToken) الذي يُنشئ/يدمج. يُبقي phone_number إلزامياً+فريداً. الدمج لا يستبدل حقلاً موجوداً.
  - `EmailService` (nodemailer/SMTP) في @hancr/notifications — مُتحكَّم بالبيئة، تسليم صادق، إيميلات تجريبية (rider-demo@/driver-demo@hancr.com → 123456).
  - تحقّق Google ID token عبر google-auth-library (محلي: توقيع+جمهور؛ env `GOOGLE_OAUTH_CLIENT_ID`).
  - Mutations: راكب `sendEmailOtp`/`verifyEmailOtp`/`googleAuth`؛ سائق `driverSendEmailOtp`/`driverVerifyEmailOtp`/`driverGoogleAuth`. verifyOtp/driverVerifyOtp يقبلان `pendingToken`.
  - Entities: rider.googleId · driver.email · driver.googleId (nullable+unique). Migration `1781300000000`: أعمدة + **referral_code UNIQUE** (يزيل التكرار أولاً) — منشور على DB الإنتاج.
  - محقَّق حيّاً: sendEmailOtp→devOtp 123456 · verifyEmailOtp→needsPhone+pendingToken · googleAuth→فشل صادق · دمج pendingToken لا يستبدل.
- **⏭️ المتبقّي من G (لم يُنفَّذ بعد):**
  - **G2 — موبايل (راكب+سائق):** حزمة google_sign_in + شاشة OTP بريد + شاشة ربط هاتف + ربط أزرار Google/الإيميل بالتدفقات الحقيقية.
  - **G3 — الويب (/account):** Google Identity Services + OTP بريد في riderAuth.ts + UI.
  - **G4 — تحصينات:** (C) إبطال توكن الويب عند الخروج (Redis jti denylist + فحص banned في JwtStrategy) + CSP على nginx + TTL قصير + refresh. (E) اشتقاق منطقة الطلب من نقطة الالتقاط عبر PostGIS.
- **🔴 إجراء المالك (حاجب لعمل زر Google فعلياً):** أنشئ **Google OAuth Web Client ID** في Google Cloud Console (+ SHA-1 لتطبيق أندرويد + أصول hancr.com للويب) واضبط `GOOGLE_OAUTH_CLIENT_ID` في `.env.prod`. ولـ بريد OTP حقيقي: `SMTP_HOST/PORT/USER/PASS`+`EMAIL_FROM` (الإيميلات التجريبية تعمل بدونها).

---

## 🔴 آخر إصلاح (2026-06-12) — regression الدخول (PR #78، منشور+محقَّق حيّاً)
**المشكلة:** الموجة F عطّلت الأرقام التجريبية في الإنتاج (`isTestPhone = isDev && ...`)، ومع بقاء Twilio تجريبياً → **لا طريق دخول يعمل** للتطبيقين + زر رجوع OTP لا يعمل + أزرار دخول اجتماعي محذوفة.
- **الدخول:** علم `ALLOW_TEST_PHONES` (افتراضي `true`؛ يُضبط `false` عند ترقية Twilio) في rider-api + driver-api `auth.service.ts`. **محقَّق حيّاً:** `+966500000001/123456` و`+966500000010/123456` (driver: mutation `driverSendOtp`/`driverVerifyOtp` بوسيط `phone`) يُصدران JWT صالحاً.
- **زر رجوع OTP:** السبب = هاتف→OTP كان `context.go` (يستبدل المكدّس). صار `context.push` + احتياط `canPop()?pop():go('/auth/phone')` في `aurora_otp_screen.dart`.
- **أزرار الدخول الاجتماعي (Google·Apple·X):** أُعيدت في `aurora_phone_screen.dart` (`_buildSocialButtons`/`_socialButton`، toast "قريباً" صادق) + مفتاحا i18n `orContinueWith`/`comingSoonSocial`.
- **TimeoutException (No stream event 5s):** كان عابراً (الـ API يُعاد تشغيله أثناء نشر F). تأكّد أن مسار ws سليم: nginx يضبط `Upgrade`/`Connection $connection_upgrade` (map معرّف في `/etc/nginx/sites-available/hancr:1`) على /rider /driver /admin — الاشتراكات تعمل.
- **APK الراكب الجديد (98.8MB) منشور** على hancr.com/downloads/hancr-rider.apk (HTTP 200). driver-app لم يتغيّر (إصلاح الدخول خادمي فقط).
- **⚠️ تذكير للمالك:** بعد ترقية Twilio عن الحساب التجريبي، اضبط `ALLOW_TEST_PHONES=false` في `.env.prod` لإغلاق باب الأرقام التجريبية.

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
    - **✅ شاشة الأماكن المحفوظة منشورة (PR #72):** `aurora_saved_places_screen.dart` مربوطة في ملف الراكب. APK الراكب (98.8MB) أُعيد بناؤه ورُفع — HTTP 200 على hancr.com/downloads.
    - **متبقٍّ C (تحسينات اختيارية):** رحلات مجدولة (cron) · توقّع أرباح السائق · شاشة كوبونات الراكب — كلها تحسينات لا فجوات حادة.
  - **🟥 الموجة E1 — تسجيل دخول الراكب من الويب منشور (PR #73):** صفحة `/account` (دخول OTP عبر rider-api + عرض الملف) حيّة على hancr.com/ar/account و/en/account (HTTP 200). بطاقة الراكب في /login → "تسجيل الدخول".
    - معماري: الموقع `output:'export'` (static) → مصادقة **client-side** (توكن localStorage، مطابق للتطبيق). `riderAuth.ts` (fetch لـ `api.hancr.com/rider/graphql`: sendOtp/verifyOtp/me).
    - **نشر الموقع:** على الخادم `cd /opt/hancr/apps/landing && npm run build` ثم `sudo rsync -a --delete --exclude downloads out/ /var/www/hancr-landing/` (⚠️ exclude downloads ليبقى الـ APK). chown www-data.
  - **✅ E3 (تقدير الأجرة من الويب) منشور (PR #74):** ودجة في /account — الموقع الحالي (geolocation) + وجهة من الأماكن المحفوظة + خدمة → routePreview (قراءة فقط، لا إنشاء طلب). أضيفت استعلامات services/savedPlaces/routePreview في riderAuth.ts.
    - **✅ E3 الحجز الكامل من المتصفح منشور (PR #75):** Google Places Autocomplete (بحث وجهة حرّ) + اختصارات الأماكن المحفوظة + الموقع الحالي → routePreview → **createOrder** (طلب فعلي). `NEXT_PUBLIC_GOOGLE_MAPS_KEY` مضبوط في `/opt/hancr/apps/landing/.env.production` على الخادم (gitignored؛ يجب إعادة ضبطه إن أُعيد تثبيت الخادم). المفتاح مخبوز في البناء.
    - ⚠️ **للتحقق من المالك:** مفتاح Google يجب أن يكون مُفعَّلاً لـ **Maps JavaScript API + Places API** ويسمح بـ referrer `hancr.com` ليعمل الـ autocomplete في المتصفح.
    - **متبقٍّ E (تحسينات):** متابعة حية للطلب من الويب (subscription) · دفع ويب (مع D) · تحصين httpOnly cookie (يتطلّب تحويل لـ SSR).
  - **🟫 الموجة F — التدقيق العدائي النهائي منجزة ومنشورة (PR #76):** مجلس 3 وكلاء عدائيين على كل كود الجلسة. التقرير: `.claude/council/wave-f/` (01/02/VERDICT/HTML).
    - **أُصلح:** 🔴 createOrder/previewRoute يربط serviceId بالمنطقة+enabled (كان يُسعَّر من منطقة وهمية/خدمة معطّلة — مؤكَّد من وكيلين) · 🟠 إلغاء باب OTP الخلفي (123456) في الإنتاج · 🟠 trustProxy:true ×3 + حدّ OTP لكل رقم 3/60ث · 🟠 CORS fail-closed · 🟡 DTO validators للأدمن + addresses[] حدود.
    - **برّأه المجلس:** IDOR (riderId من JWT)، صلاحيات الأدمن الجديدة (RBAC)، لا حقن، providerShare سليم.
    - **مُتحقَّق حيّاً:** الباب الخلفي مُغلق على الإنتاج — `sendOtp(+966500000001)` يُرجع `devOtp:null` (كان 123456). الـ3 APIs 200.
    - **🟫 المجلس الكامل (5 وكلاء + مراجعة متبادلة + HTML/transcript) — PR #77:** أُضيف التوسّعي + الغريب. كشفا معضلات تشغيلية فاتت على الأمن. التقارير: `.claude/council/wave-f/01-05 + VERDICT + transcript + HTML`.
      - **🔴 إجراء المالك (CONFIG، لا كود — حاجب الإطلاق):** (T1) **ترقية Twilio من الحساب التجريبي** — خطأ 21608 + مُرسِل +1618 أمريكي → دخول كل المستخدمين الحقيقيين (ويب+تطبيق) معطّل حتى الترقية + مُرسِل KSA/QA/UAE (Messaging-Service SID). (T2) **تقييد مفتاح Google Maps** (referrer hancr.com + Maps JS/Places فقط + حدّ يومي + تنبيه فوترة).
      - **أُصلح ونُشر (r2):** sendOtp صادق (success يعكس التسليم + Sentry) — مؤكَّد حيّاً (`success:false` عند فشل SMS) · الويب لا ينتقل لشاشة رمز ميتة + "لا سائقين" بدل "تم ✓" الكاذب + إظهار فشل الخرائط/لا خدمات · DispatcherDrawer يرفض NaN.
      - **مؤجَّل موثّق:** إبطال توكن الويب عند الحظر/الخروج (Redis jti أو فحص banned في JwtStrategy) · Places session-token+debounce · referral_code unique · اشتقاق المنطقة من PostGIS.
  - **متبقٍّ عام:** D (دفع ببوابة، مؤجَّل لبيانات التاجر) · متابعة/دفع الويب.
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
