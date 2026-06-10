# HANCR — حالة المشروع (نقطة البداية لأي محادثة جديدة)

> هذا الملف هو **المصدر الحي لحالة المشروع**. يُحدَّث بعد كل خطوة عمل.
> ابدأ أي محادثة جديدة بقراءته (وحده يكفي للسياق) بدل تحميل المهارة الضخمة أو قراءة عشرات الملفات.
> آخر تحديث: 2026-06-10

---

## أين نحن الآن
- **آخر إنجاز:** N6 — مكتبة الحركة المشتركة Aurora Motion (PR #58، مدموج في main).
- **التالي:** N7 — أنيميشن تطبيق الراكب (success/confetti, bid bounce, splash glow, ripples) — يبني على مكتبة N6.
- **الخطة المعتمدة:** `C:\Users\7bici\.claude\plans\valiant-percolating-sparkle.md` (N5→N11).
- **نشر معلّق على الإنتاج:** ⏳ N5 (backend `appTheme`: `git pull`+rebuild+`pm2 restart`، لا migration) + N6 (deps Flutter جديدة → إعادة بناء APK). التطبيقات تحتاج إعادة بناء على أي حال.

## المتبقي من خطة N
- N7: أنيميشن تطبيق الراكب (success/confetti, bid bounce, splash glow, ripples) — الحالي التالي
- N8: أنيميشن السائق + سيارة متحركة على الخريطة
- N9: ميزات الراكب (live activity, rewards hub, إيصالات)
- N10: أدوات السائق (heatmap, أهداف يومية, رسوم أرباح)
- N11: ذكاء اللوحة (surge engine, حملات إشعارات مجدولة, A/B flags)
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
