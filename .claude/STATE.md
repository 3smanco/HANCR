# HANCR — حالة المشروع (نقطة البداية لأي محادثة جديدة)

> هذا الملف هو **المصدر الحي لحالة المشروع**. يُحدَّث بعد كل خطوة عمل.
> ابدأ أي محادثة جديدة بقراءته (وحده يكفي للسياق) بدل تحميل المهارة الضخمة أو قراءة عشرات الملفات.
> آخر تحديث: 2026-06-10

---

## أين نحن الآن
- **خطة N مكتملة (N1→N11).** آخر إنجاز: N11 — ذكاء اللوحة (PR #63).
- **التالي:** معاينة/مراجعة المستخدم ثم النشر على الإنتاج.
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
