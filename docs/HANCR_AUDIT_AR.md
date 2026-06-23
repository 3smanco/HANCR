# تقرير تدقيق HANCR

تاريخ المراجعة: 2026-06-23

## الخلاصة التنفيذية

المشروع أصبح أفضل بكثير من نقطة البداية، لكن لا يزال غير جاهز لإطلاق عام واسع.
السبب ليس أن الكود الأساسي معطل، بل لأن هناك بلوكرات إنتاجية خارجية لم تغلق بعد:
دومين HTTPS، إعدادات CORS النهائية، Sentry، ومفاتيح الخدمات التجارية مثل الدفع
والرفع والبريد.

على السيرفر الحالي:

- الخدمات الأربع تعمل عبر PM2: `rider-api`, `driver-api`, `admin-api`,
  `admin-panel`.
- health checks للـ APIs الثلاثة تعطي 200 على `/health/live` و`/health/ready`.
- المستودع على السيرفر نظيف بعد إعادة تشغيل PM2.
- `npm run secrets:check` ينجح محليا وعلى السيرفر.
- `npm run readiness:prod` ما زال يعطي: 23 pass, 7 warn, 8 fail.

## ما تم إصلاحه

- ربط Webhook بوابات الدفع بمسارات صحيحة لكل مزود بدل الاعتماد على callback عام.
- إضافة فحص جاهزية الإنتاج لروابط HTTPS وCORS وأسرار الدفع والمراقبة.
- تقوية لوحة الإدارة:
  - lint بدون warnings.
  - فحص مفاتيح الترجمة.
  - منع إخفاء مشاكل hooks أو استخدام خيارات Apollo القديمة.
- تقوية إنشاء أول مشرف إنتاجي:
  - رفض غياب `ADMIN_DEFAULT_EMAIL`.
  - رفض البريد غير الصالح.
  - رفض كلمات المرور الضعيفة أو placeholder.
- تحسين جلسة لوحة الإدارة:
  - cookie options مركزية.
  - `SameSite=Strict`.
  - `Secure` تلقائيا عند HTTPS.
  - إزالة الكوكيز من نفس المسار الصحيح.
- إصلاح Sentry exception filter:
  - أخطاء HTTP العادية لا ترسل كـ noise.
  - أخطاء 5xx والـ unknown ترفع إلى Sentry.
  - GraphQL يحتفظ بسلوك الرمي الصحيح.
- تقوية GraphQL WebSocket auth:
  - تحويل `connectionParams.Authorization` إلى headers تفهمها guards.
- قفل live tracking:
  - اشتراك الراكب في موقع السائق يحتاج rider مصادق، `orderId`, `driverId`,
    وطلب حي يملكه نفس الراكب.
  - اشتراك driver-api لا يسمح للسائق إلا بتياره الخاص.
- منع السيرفر من تغيير `apps/*/schema.gql` بعد PM2 reload عبر توليد schema
  في الذاكرة في production.
- تقليل تسريب بيانات الاتصال في logs:
  - تقنيع أرقام الجوال والبريد في auth/SMS/email.
  - عدم طباعة جسم SMS في dev logs.
  - عدم طباعة عنوان البريد عندما يحتوي OTP.
  - إرسال سياق Sentry المقنّع بدل الرقم أو البريد الكامل في فشل OTP.

## نقاط الضعف المتبقية

### بلوكرات الإطلاق

- الروابط العامة ما زالت تستخدم HTTP/IP:
  - `PUBLIC_BASE_URL`
  - `PUBLIC_API_URL`
  - `PUBLIC_ADMIN_URL`
- CORS ما زال يسمح بأصل HTTP مبني على IP:
  - `CORS_ORIGINS`
  - `ADMIN_CORS_ORIGINS`
- المراقبة الإنتاجية ناقصة:
  - `SENTRY_DSN_RIDER_API`
  - `SENTRY_DSN_DRIVER_API`
  - `SENTRY_DSN_ADMIN_API`

### تحذيرات إنتاجية

- الرفع لا يملك bucket production واضحا.
- الدفع والسحب يحتاجان مفاتيح production أو قرار مزود نهائي.
- البريد transactional غير مفعّل.
- الترجمة وFX rates يعملان بتعطيل أو fallback.
- Sentry لتطبيقات Flutter معطل حتى حل مشكلة البناء المذكورة في ملفات التطبيق.

### مخاطر تقنية

- production يعمل حاليا عبر `ts-node --transpile-only`، وهذا مناسب مؤقتا لكنه
  ليس نموذج نشر صلب على المدى الطويل. الأفضل الانتقال إلى compiled artifacts.
- عدادات إعادة تشغيل PM2 مرتفعة ويجب تحليل سببها قبل الإطلاق العام.
- `npm audit --omit=dev` يظهر:
  - root: 31 vulnerability منها 1 critical و8 high.
  - admin-panel: 2 vulnerabilities منها 1 high.
  هذه تحتاج ترقية منظمة لأنها تمس Fastify/Nest/Apollo/Next وقد تكون breaking.
- GitHub Actions جاهزة محليا في commit `752ada4`، لكن GitHub رفض `git push`
  وContents API لأن التكامل الحالي لا يملك صلاحية `workflow`.

## ما يجب مراجعته قبل الإطلاق

1. تجهيز DNS وTLS:
   - `https://api.hancr...`
   - `https://admin.hancr...`
   - domain عام للتطبيق والروابط.
2. تحديث `/opt/hancr/.env.prod` بالروابط النهائية فقط، دون raw HTTP IP.
3. إنشاء مشاريع Sentry وإضافة DSNs للـ APIs الثلاثة.
4. اختيار مزود الدفع والسحب النهائي وتفعيل مفاتيح production.
5. تفعيل SMTP أو مزود بريد transactional.
6. تجهيز GCS buckets وservice account للوثائق والرفع.
7. إعادة تفعيل GitHub workflows بعد تسجيل GitHub token بصلاحية `workflow`.
8. نقل النشر من `ts-node` إلى build artifacts.
9. عمل pass مستقل لترقية الاعتماديات ذات الثغرات.
10. اختبار رحلة كاملة: تسجيل، طلب، قبول سائق، تتبع مباشر، دفع، إنهاء، مراجعة.

## لماذا Codex مفيد هنا أكثر

لا أتعامل مع المشروع كنص فقط؛ أعمل عليه كمنظومة كاملة:

- أقرأ الكود، أشغل الاختبارات، أعدل الملفات، أدفع إلى GitHub، وأنشر على السيرفر.
- أتحقق من النتيجة فعليا عبر PM2 وhealth checks وreadiness.
- أميز بين عيب كود قابل للإصلاح الآن وبلوك خارجي يحتاج دومين أو سر إنتاجي.
- أحافظ على الفروع والـ commits وأتجنب لمس تغييراتك غير المتتبعة.
- أترك وراء العمل بوابات CI ووثائق قابلة للمتابعة، لا مجرد قائمة ملاحظات.

بمعنى أبسط: كلود يمكن أن يساعدك كثيرا في التفكير والشرح، لكن في هذا المشروع
قيمتي الأكبر أنني أربط التحليل بالتنفيذ والتحقق على نفس جهازك وسيرفرك.

## خطة التطوير المقترحة

### المرحلة 1: إغلاق بلوكرات الإنتاج

- ضبط الدومينات وHTTPS.
- تحديث CORS والروابط العامة.
- إضافة Sentry DSNs.
- تشغيل `npm run readiness:prod` حتى يصبح صفر failures.

### المرحلة 2: تثبيت CI الحقيقي

- إعادة مصادقة GitHub بصلاحية `workflow`.
- تتبع `.github/workflows`.
- تشغيل `npm run ci:verify` كشرط للـ PR.
- إضافة workflow للنشر بعد نجاح الاختبارات فقط.

### المرحلة 3: تقوية النشر

- بناء APIs كـ compiled JS.
- تشغيل PM2 على ملفات build لا ts-node.
- إضافة rollback واضح لكل نشر.
- مراقبة logs/restarts بعد كل deploy.

### المرحلة 4: جودة المنتج

- اختبار رحلة الطلب كاملة على بيئة staging.
- تحسين تجربة التتبع في Flutter عند فقد الاتصال أو انتهاء حالة الطلب.
- إضافة حالات empty/error/loading أوضح في rider/driver apps.
- توسيع اختبارات order lifecycle والدفع والسحب.

### المرحلة 5: الأمن والاعتماديات

- تنفيذ major upgrade pass لـ Nest/Fastify/Apollo/Next.
- مراجعة صلاحيات admin roles.
- مراجعة rate limits للـ auth والـ OTP.
- مراجعة تخزين الملفات والروابط الموقعة.

## المطلوب منك لإغلاق ما لا أستطيع إغلاقه وحدي

- الدومينات النهائية التي تريد استخدامها.
- قرار مزود الدفع والسحب.
- Sentry DSNs أو السماح بإنشاء المشاريع وإضافتها.
- إعداد SMTP أو مزود البريد.
- صلاحية GitHub `workflow` لتتبع ملفات GitHub Actions.
