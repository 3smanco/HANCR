import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  HANCR Aurora — Premium Cinematic Dark Theme                  ║
/// ║  v3 (2026-05-28)                                              ║
/// ║                                                               ║
/// ║  Inspired by: luxury car apps + neon glow + cinematic dark.  ║
/// ║  - Deep obsidian background                                   ║
/// ║  - Warm orange glow accent                                    ║
/// ║  - Glassmorphism cards                                        ║
/// ║  - Outlined neon icons                                        ║
/// ║  - Smooth gradients                                           ║
/// ╚══════════════════════════════════════════════════════════════╝

class AuroraColors {
  AuroraColors._();

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  N5 — Live SDUI tokens                                         ║
  // ║  هذه الحقول NON-const ومتغيِّرة: تُحقن من themeConfig المنشور   ║
  // ║  من لوحة التحكم عبر AuroraThemeData.apply(). القيم هنا هي       ║
  // ║  الافتراضي (fallback) عند غياب الشبكة أو الإعداد.               ║
  // ║  ⚠️ أي widget يقرأها يجب أن يكون NON-const ليلتقط التحديث الحي. ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ═══ Background layers (من الأعمق للأخف) — live ═══
  static Color obsidian = const Color(0xFF0A0807); // الخلفية الأعمق
  static Color coal = const Color(0xFF13100E); // خلفية الـ surface
  static Color ash = const Color(0xFF1F1A17); // cards غامقة
  static Color smoke = const Color(0xFF2A2421); // cards فاتحة قليلاً
  static Color stone = const Color(0xFF3D3530); // hover/elevated

  // ═══ Brand accent — Orange Glow — live ═══
  static Color ember = const Color(0xFFFF7A1A); // الـ primary action
  static Color emberLight = const Color(0xFFFF9D4D); // glow + accent
  static Color emberDeep = const Color(0xFFE55F00); // pressed/active
  static Color emberMute = const Color(0xFF6B3920); // muted accent (low emphasis)

  // ═══ Gold accents (premium / loyalty) — live ═══
  static Color gold = const Color(0xFFFFB547);
  static Color goldGlow = const Color(0xFFFFC97A);

  // ═══ Text hierarchy — pearl live ═══
  static Color pearl = const Color(0xFFFFF5EE); // text عالي تباين
  static Color textPrimary = const Color(0xFFF5EDE7);
  static Color textSecondary = const Color(0xFFA89B96);
  static Color textHint = const Color(0xFF6F635E);
  static Color textDisabled = const Color(0xFF4D4441);

  // ═══ Borders ═══
  static Color border = const Color(0x1AFFFFFF); // 10% white
  static Color borderStrong = const Color(0x33FFFFFF); // 20% white
  static Color borderGlow = const Color(0x4DFF7A1A); // 30% ember
  static Color divider = const Color(0x0DFFFFFF); // 5% white

  // ═══ Status colors — success/danger live ═══
  static Color success = const Color(0xFF10B981);
  static Color successGlow = const Color(0xFF34D399);
  static Color successBg = const Color(0x1A10B981);

  static Color warning = const Color(0xFFFFB547);
  static Color warningBg = const Color(0x1AFFB547);

  static Color danger = const Color(0xFFFF4D4D);
  static Color dangerGlow = const Color(0xFFFF6B6B);
  static Color dangerBg = const Color(0x1AFF4D4D);

  // ═══ Typography + shape — live من themeConfig ═══
  /// عائلة الخط (Google Fonts) — تُقرأ ديناميكياً في AuroraText.
  static String fontFamily = 'Cairo';

  /// نصف قطر الحواف الأساسي للمكوّنات (أزرار/حقول) — يُطبَّق في AuroraTheme.dark.
  static double baseRadius = 16;

  static Color info = const Color(0xFF3B82F6);
  static Color infoBg = const Color(0x1A3B82F6);

  // ═══ Promo badge (للـ promotional badges) ═══
  static Color promoBg = const Color(0xFF10B981);
  static Color promoText = const Color(0xFFFFFFFF);

  // ═══ Gradients — تعتمد على ألوان live فصارت getters ═══
  static LinearGradient get emberGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [ember, emberDeep],
      );

  static LinearGradient get emberRadial => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [emberLight, ember, emberDeep],
      );

  static LinearGradient get pageBackground {
    // قمّة التدرّج تتبع السكين (دافئة فاتحة / داكنة / نيون).
    final top = activeSkin == 'light'
        ? const Color(0xFFFCEFE3)
        : activeSkin == 'vip'
            ? const Color(0xFF120A24)
            : const Color(0xFF1A0F08);
    return LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [top, obsidian, obsidian],
      stops: const [0.0, 0.4, 1.0],
    );
  }

  static const RadialGradient emberHalo = RadialGradient(
    colors: [Color(0x33FF7A1A), Color(0x00FF7A1A)],
    radius: 0.7,
  );

  static const LinearGradient cardGlass = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x1AFFFFFF), Color(0x0AFFFFFF)],
  );

  // ═══ Backward compat aliases — getters لأنها تشير لألوان live ═══
  static Color get background => obsidian;
  static Color get surface => ash;
  static Color get surfaceMute => coal;
  static Color get surfaceElevated => smoke;
  static Color get primary => ember;
  static Color get accent => ember;
  static Color get violet => ember; // mapping القديم → ember
  static Color get violetDeep => emberDeep;
  static Color get violetLight => emberMute;
  static Color get navy => obsidian;
  static Color get cream => pearl;
  static Color get purple => textSecondary;
  static Color get error => danger;
  static Color get errorBg => dangerBg;

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  السكين الحيّ — يعيد طلاء كل الحقول (dark / light / vip)        ║
  // ║  يُستدعى من ThemeController عند تغيير المظهر؛ ثم يُطبَّق SDUI    ║
  // ║  فوقه. لأن كل MaterialApp يُعاد بناؤه عند bump الإصدار، تلتقط    ║
  // ║  كل الشاشات (التي تقرأ AuroraColors.*) الطلاء الجديد فوراً.     ║
  // ╚═══════════════════════════════════════════════════════════════╝
  static String activeSkin = 'dark';

  /// يطبّق لوحة السكين المطلوب: 'dark' (Aurora) · 'light' (Dawn) · 'vip'.
  static void applySkin(String skin) {
    activeSkin = skin;
    switch (skin) {
      case 'light':
        // Dawn — عاج دافئ + ember
        obsidian = const Color(0xFFF6EFE8);
        coal = const Color(0xFFFFFFFF);
        ash = const Color(0xFFFFFFFF);
        smoke = const Color(0xFFF1E8E0);
        stone = const Color(0xFFE6DAD0);
        ember = const Color(0xFFE9670F);
        emberLight = const Color(0xFFFF8A3D);
        emberDeep = const Color(0xFFC24E00);
        emberMute = const Color(0xFFFBE0CC);
        gold = const Color(0xFFC8870F);
        goldGlow = const Color(0xFFE3A93A);
        pearl = const Color(0xFF1E1714);
        textPrimary = const Color(0xFF241C18);
        textSecondary = const Color(0xFF6B5E57);
        textHint = const Color(0xFF9C8E86);
        textDisabled = const Color(0xFFC2B5AD);
        border = const Color(0x14000000);
        borderStrong = const Color(0x29000000);
        borderGlow = const Color(0x4DE9670F);
        divider = const Color(0x12000000);
        success = const Color(0xFF0E9F6E);
        successGlow = const Color(0xFF34D399);
        successBg = const Color(0x1A0E9F6E);
        warning = const Color(0xFFB7791F);
        warningBg = const Color(0x1AB7791F);
        danger = const Color(0xFFDC2626);
        dangerGlow = const Color(0xFFEF4444);
        dangerBg = const Color(0x1ADC2626);
        info = const Color(0xFF2563EB);
        infoBg = const Color(0x1A2563EB);
        promoBg = const Color(0xFF0E9F6E);
        promoText = const Color(0xFFFFFFFF);
        break;
      case 'vip':
        // VIP — obsidian نيون بنفسجي/سماوي
        obsidian = const Color(0xFF070611);
        coal = const Color(0xFF0C0B1C);
        ash = const Color(0xFF14122A);
        smoke = const Color(0xFF1E1B3C);
        stone = const Color(0xFF2A2750);
        ember = const Color(0xFFB048FF);
        emberLight = const Color(0xFFCB7BFF);
        emberDeep = const Color(0xFF7E2FBF);
        emberMute = const Color(0xFF2A1745);
        gold = const Color(0xFF00F5FF);
        goldGlow = const Color(0xFF7DF9FF);
        pearl = const Color(0xFFF3EEFF);
        textPrimary = const Color(0xFFECE7FF);
        textSecondary = const Color(0xFFA9A2C9);
        textHint = const Color(0xFF6E6790);
        textDisabled = const Color(0xFF4A4570);
        border = const Color(0x1AB048FF);
        borderStrong = const Color(0x33B048FF);
        borderGlow = const Color(0x4DB048FF);
        divider = const Color(0x14FFFFFF);
        success = const Color(0xFF39FF14);
        successGlow = const Color(0xFF7CFF6B);
        successBg = const Color(0x2239FF14);
        warning = const Color(0xFFFFC043);
        warningBg = const Color(0x1AFFC043);
        danger = const Color(0xFFFF3D8B);
        dangerGlow = const Color(0xFFFF6BA6);
        dangerBg = const Color(0x22FF3D8B);
        info = const Color(0xFF00F5FF);
        infoBg = const Color(0x1A00F5FF);
        promoBg = const Color(0xFFB048FF);
        promoText = const Color(0xFFFFFFFF);
        break;
      default: // 'dark' — Aurora الأصلي
        obsidian = const Color(0xFF0A0807);
        coal = const Color(0xFF13100E);
        ash = const Color(0xFF1F1A17);
        smoke = const Color(0xFF2A2421);
        stone = const Color(0xFF3D3530);
        ember = const Color(0xFFFF7A1A);
        emberLight = const Color(0xFFFF9D4D);
        emberDeep = const Color(0xFFE55F00);
        emberMute = const Color(0xFF6B3920);
        gold = const Color(0xFFFFB547);
        goldGlow = const Color(0xFFFFC97A);
        pearl = const Color(0xFFFFF5EE);
        textPrimary = const Color(0xFFF5EDE7);
        textSecondary = const Color(0xFFA89B96);
        textHint = const Color(0xFF6F635E);
        textDisabled = const Color(0xFF4D4441);
        border = const Color(0x1AFFFFFF);
        borderStrong = const Color(0x33FFFFFF);
        borderGlow = const Color(0x4DFF7A1A);
        divider = const Color(0x0DFFFFFF);
        success = const Color(0xFF10B981);
        successGlow = const Color(0xFF34D399);
        successBg = const Color(0x1A10B981);
        warning = const Color(0xFFFFB547);
        warningBg = const Color(0x1AFFB547);
        danger = const Color(0xFFFF4D4D);
        dangerGlow = const Color(0xFFFF6B6B);
        dangerBg = const Color(0x1AFF4D4D);
        info = const Color(0xFF3B82F6);
        infoBg = const Color(0x1A3B82F6);
        promoBg = const Color(0xFF10B981);
        promoText = const Color(0xFFFFFFFF);
    }
  }

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  N5 — hex parsing helper                                       ║
  // ╚═══════════════════════════════════════════════════════════════╝
  /// يحوِّل '#RRGGBB' أو '#AARRGGBB' (أو بدون #) إلى Color. يُعيد null عند الفشل.
  static Color? parseHex(String? raw) {
    if (raw == null) return null;
    var h = raw.trim().replaceFirst('#', '').replaceFirst('0x', '');
    if (h.length == 6) h = 'FF$h'; // أضِف alpha كامل
    if (h.length != 8) return null;
    final v = int.tryParse(h, radix: 16);
    return v == null ? null : Color(v);
  }
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Aurora Shadows — Glow & Elevation                            ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraShadows {
  AuroraShadows._();

  /// Glow برتقالي حول الأزرار/الحدود
  static const List<BoxShadow> emberGlow = [
    BoxShadow(
      color: Color(0x66FF7A1A),
      blurRadius: 24,
      spreadRadius: -2,
    ),
    BoxShadow(
      color: Color(0x33FF7A1A),
      blurRadius: 40,
      spreadRadius: 2,
    ),
  ];

  /// Glow ناعم للـ ride card المحدد
  static const List<BoxShadow> selectionGlow = [
    BoxShadow(
      color: Color(0x80FF7A1A),
      blurRadius: 16,
      spreadRadius: 0,
    ),
    BoxShadow(
      color: Color(0x40FF7A1A),
      blurRadius: 32,
      spreadRadius: -4,
    ),
  ];

  /// Inner shadow للـ cards
  static const List<BoxShadow> cardDepth = [
    BoxShadow(
      color: Color(0x66000000),
      blurRadius: 24,
      offset: Offset(0, 12),
    ),
  ];

  /// Bottom nav floating shadow
  static const List<BoxShadow> floatingNav = [
    BoxShadow(
      color: Color(0x80000000),
      blurRadius: 40,
      offset: Offset(0, -10),
    ),
  ];

  /// Glow للـ icons
  static const List<BoxShadow> iconGlow = [
    BoxShadow(
      color: Color(0x4DFF7A1A),
      blurRadius: 12,
      spreadRadius: -1,
    ),
  ];

  /// Glow للـ danger button
  static const List<BoxShadow> dangerGlow = [
    BoxShadow(
      color: Color(0x66FF4D4D),
      blurRadius: 24,
      spreadRadius: -2,
    ),
  ];
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Aurora Spacing & Radius                                      ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraSpacing {
  AuroraSpacing._();
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double huge = 48;
}

class AuroraRadius {
  AuroraRadius._();
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double pill = 999;
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Aurora Typography                                            ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraText {
  AuroraText._();

  /// N5 — يقرأ عائلة الخط الحية من themeConfig. يسقط إلى Cairo لو فشل التحميل
  /// (مثلاً اسم خط غير موجود في Google Fonts).
  static TextStyle _font({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    double? height,
    double? letterSpacing,
  }) {
    try {
      return GoogleFonts.getFont(
        AuroraColors.fontFamily,
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
        height: height,
        letterSpacing: letterSpacing,
      );
    } catch (_) {
      return GoogleFonts.cairo(
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
        height: height,
        letterSpacing: letterSpacing,
      );
    }
  }

  static TextStyle get displayLarge => _font(
        color: AuroraColors.pearl,
        fontSize: 40,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: -0.5,
      );

  static TextStyle get displayMedium => _font(
        color: AuroraColors.pearl,
        fontSize: 32,
        fontWeight: FontWeight.w800,
        height: 1.15,
        letterSpacing: -0.3,
      );

  static TextStyle get titleLarge => _font(
        color: AuroraColors.pearl,
        fontSize: 24,
        fontWeight: FontWeight.w700,
        height: 1.2,
      );

  static TextStyle get titleMedium => _font(
        color: AuroraColors.pearl,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        height: 1.25,
      );

  static TextStyle get titleSmall => _font(
        color: AuroraColors.pearl,
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.3,
      );

  static TextStyle get bodyLarge => _font(
        color: AuroraColors.textPrimary,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => _font(
        color: AuroraColors.textSecondary,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodySmall => _font(
        color: AuroraColors.textSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.4,
      );

  static TextStyle get caption => _font(
        color: AuroraColors.textHint,
        fontSize: 11,
        fontWeight: FontWeight.w500,
        height: 1.3,
      );

  static TextStyle get buttonLarge => _font(
        color: AuroraColors.pearl,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        height: 1.0,
        letterSpacing: 0.2,
      );

  static TextStyle get buttonMedium => _font(
        color: AuroraColors.pearl,
        fontSize: 15,
        fontWeight: FontWeight.w700,
        height: 1.0,
      );
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Aurora Theme Data                                            ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraTheme {
  AuroraTheme._();

  static ThemeData get dark => _build(Brightness.dark, AuroraTokens.aurora);

  /// السكين الفاتح «Economy / Dawn».
  static ThemeData get light => _build(Brightness.light, AuroraTokens.dawn);

  static ThemeData _build(Brightness brightness, AuroraTokens tk) {
    // N5 — نصف القطر الحي (من themeConfig). non-const فلا يمكن استخدامه في const.
    final r = AuroraColors.baseRadius;
    final dark = brightness == Brightness.dark;
    return ThemeData(
        useMaterial3: true,
        brightness: brightness,
        extensions: <ThemeExtension<dynamic>>[tk],
        scaffoldBackgroundColor: tk.bg,
        canvasColor: tk.bg,
        colorScheme: ColorScheme(
          brightness: brightness,
          primary: tk.accent,
          onPrimary: tk.onAccent,
          secondary: tk.accentLight,
          onSecondary: tk.onAccent,
          surface: tk.surface,
          onSurface: tk.textPrimary,
          error: tk.danger,
          onError: Colors.white,
        ),
        textTheme: TextTheme(
          displayLarge: AuroraText.displayLarge.copyWith(color: tk.textPrimary),
          displayMedium: AuroraText.displayMedium.copyWith(color: tk.textPrimary),
          headlineLarge: AuroraText.titleLarge.copyWith(color: tk.textPrimary),
          headlineMedium: AuroraText.titleMedium.copyWith(color: tk.textPrimary),
          headlineSmall: AuroraText.titleSmall.copyWith(color: tk.textPrimary),
          titleLarge: AuroraText.titleLarge.copyWith(color: tk.textPrimary),
          titleMedium: AuroraText.titleMedium.copyWith(color: tk.textPrimary),
          titleSmall: AuroraText.titleSmall.copyWith(color: tk.textPrimary),
          bodyLarge: AuroraText.bodyLarge.copyWith(color: tk.textPrimary),
          bodyMedium: AuroraText.bodyMedium.copyWith(color: tk.textSecondary),
          bodySmall: AuroraText.bodySmall.copyWith(color: tk.textSecondary),
          labelLarge: AuroraText.buttonLarge.copyWith(color: tk.onAccent),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: AuroraText.titleMedium.copyWith(color: tk.textPrimary),
          iconTheme: IconThemeData(color: tk.textPrimary),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: tk.accent,
            foregroundColor: tk.onAccent,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(r),
            ),
            textStyle: AuroraText.buttonLarge,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: dark ? tk.surface : tk.surfaceAlt,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(r),
            borderSide: BorderSide(color: tk.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(r),
            borderSide: BorderSide(color: tk.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(r),
            borderSide: BorderSide(color: tk.accent, width: 1.5),
          ),
          hintStyle: AuroraText.bodyMedium.copyWith(color: tk.textHint),
          labelStyle: AuroraText.bodyMedium.copyWith(color: tk.textSecondary),
        ),
        dividerTheme: DividerThemeData(
          color: tk.divider,
          thickness: 1,
          space: 1,
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: tk.surfaceAlt,
          selectedItemColor: tk.accent,
          unselectedItemColor: tk.textSecondary,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
        ),
      );
  }
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  AuroraTokens — نظام السكينين (ThemeExtension)                ║
/// ║                                                               ║
/// ║  ألوان دلالية تُقرأ بـ context.c فتتبدّل تلقائياً مع السكين     ║
/// ║  (فاتح dawn / داكن aurora / فاخر vip) عبر AnimatedTheme.       ║
/// ║  سكين aurora يشير لحقول AuroraColors الحية (يحفظ SDUI).        ║
/// ╚══════════════════════════════════════════════════════════════╝
@immutable
class AuroraTokens extends ThemeExtension<AuroraTokens> {
  const AuroraTokens({
    required this.bg,
    required this.surface,
    required this.surfaceAlt,
    required this.elevated,
    required this.accent,
    required this.accentLight,
    required this.accentDeep,
    required this.onAccent,
    required this.textPrimary,
    required this.textSecondary,
    required this.textHint,
    required this.border,
    required this.borderStrong,
    required this.divider,
    required this.success,
    required this.danger,
    required this.warning,
    required this.gold,
    required this.isDark,
  });

  final Color bg;
  final Color surface;
  final Color surfaceAlt;
  final Color elevated;
  final Color accent;
  final Color accentLight;
  final Color accentDeep;
  final Color onAccent;
  final Color textPrimary;
  final Color textSecondary;
  final Color textHint;
  final Color border;
  final Color borderStrong;
  final Color divider;
  final Color success;
  final Color danger;
  final Color warning;
  final Color gold;
  final bool isDark;

  LinearGradient get accentGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [accent, accentDeep],
      );

  /// السكين الداكن (الحالي) — يشير للحقول الحية فيبقى SDUI فعّالاً.
  static AuroraTokens get aurora => AuroraTokens(
        bg: AuroraColors.obsidian,
        surface: AuroraColors.ash,
        surfaceAlt: AuroraColors.coal,
        elevated: AuroraColors.smoke,
        accent: AuroraColors.ember,
        accentLight: AuroraColors.emberLight,
        accentDeep: AuroraColors.emberDeep,
        onAccent: AuroraColors.pearl,
        textPrimary: AuroraColors.pearl,
        textSecondary: AuroraColors.textSecondary,
        textHint: AuroraColors.textHint,
        border: AuroraColors.border,
        borderStrong: AuroraColors.borderStrong,
        divider: AuroraColors.divider,
        success: AuroraColors.success,
        danger: AuroraColors.danger,
        warning: AuroraColors.warning,
        gold: AuroraColors.gold,
        isDark: true,
      );

  /// السكين الفاتح «Economy / Dawn» — عاج كريمي دافئ + ember.
  // ignore: prefer_const_constructors
  static AuroraTokens get dawn => AuroraTokens(
        bg: const Color(0xFFF7F1EC),
        surface: const Color(0xFFFFFFFF),
        surfaceAlt: const Color(0xFFF1E9E2),
        elevated: const Color(0xFFFFFFFF),
        accent: const Color(0xFFE56A12),
        accentLight: const Color(0xFFFF8A3D),
        accentDeep: const Color(0xFFC24E00),
        onAccent: const Color(0xFFFFFFFF),
        textPrimary: const Color(0xFF1E1714),
        textSecondary: const Color(0xFF6B5E57),
        textHint: const Color(0xFF9C8E86),
        border: const Color(0x14000000),
        borderStrong: const Color(0x26000000),
        divider: const Color(0x0F000000),
        success: const Color(0xFF0E9F6E),
        danger: const Color(0xFFE02424),
        warning: const Color(0xFFD98A00),
        gold: const Color(0xFFCB8B1A),
        isDark: false,
      );

  /// السكين الفاخر «VIP» — obsidian أعمق + نيون بنفسجي/سماوي.
  // ignore: prefer_const_constructors
  static AuroraTokens get vip => AuroraTokens(
        bg: const Color(0xFF070611),
        surface: const Color(0xFF14122A),
        surfaceAlt: const Color(0xFF0C0B1C),
        elevated: const Color(0xFF1E1B3C),
        accent: const Color(0xFFB048FF),
        accentLight: const Color(0xFFCB7BFF),
        accentDeep: const Color(0xFF7E2FBF),
        onAccent: const Color(0xFFFFFFFF),
        textPrimary: const Color(0xFFF3EEFF),
        textSecondary: const Color(0xFFA9A2C9),
        textHint: const Color(0xFF6E6790),
        border: const Color(0x1AB048FF),
        borderStrong: const Color(0x33B048FF),
        divider: const Color(0x14FFFFFF),
        success: const Color(0xFF39FF14),
        danger: const Color(0xFFFF3D8B),
        warning: const Color(0xFFFFC043),
        gold: const Color(0xFF00F5FF),
        isDark: true,
      );

  @override
  AuroraTokens copyWith({
    Color? bg,
    Color? surface,
    Color? surfaceAlt,
    Color? elevated,
    Color? accent,
    Color? accentLight,
    Color? accentDeep,
    Color? onAccent,
    Color? textPrimary,
    Color? textSecondary,
    Color? textHint,
    Color? border,
    Color? borderStrong,
    Color? divider,
    Color? success,
    Color? danger,
    Color? warning,
    Color? gold,
    bool? isDark,
  }) {
    return AuroraTokens(
      bg: bg ?? this.bg,
      surface: surface ?? this.surface,
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      elevated: elevated ?? this.elevated,
      accent: accent ?? this.accent,
      accentLight: accentLight ?? this.accentLight,
      accentDeep: accentDeep ?? this.accentDeep,
      onAccent: onAccent ?? this.onAccent,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textHint: textHint ?? this.textHint,
      border: border ?? this.border,
      borderStrong: borderStrong ?? this.borderStrong,
      divider: divider ?? this.divider,
      success: success ?? this.success,
      danger: danger ?? this.danger,
      warning: warning ?? this.warning,
      gold: gold ?? this.gold,
      isDark: isDark ?? this.isDark,
    );
  }

  @override
  AuroraTokens lerp(ThemeExtension<AuroraTokens>? other, double t) {
    if (other is! AuroraTokens) return this;
    return AuroraTokens(
      bg: Color.lerp(bg, other.bg, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceAlt: Color.lerp(surfaceAlt, other.surfaceAlt, t)!,
      elevated: Color.lerp(elevated, other.elevated, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentLight: Color.lerp(accentLight, other.accentLight, t)!,
      accentDeep: Color.lerp(accentDeep, other.accentDeep, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textHint: Color.lerp(textHint, other.textHint, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderStrong: Color.lerp(borderStrong, other.borderStrong, t)!,
      divider: Color.lerp(divider, other.divider, t)!,
      success: Color.lerp(success, other.success, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      gold: Color.lerp(gold, other.gold, t)!,
      isDark: t < 0.5 ? isDark : other.isDark,
    );
  }
}

/// اختصار قراءة التوكنات السياقية: context.c.accent ...
extension AuroraContext on BuildContext {
  AuroraTokens get c =>
      Theme.of(this).extension<AuroraTokens>() ?? AuroraTokens.aurora;
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  AuroraThemeData — N5 Live SDUI Theme                         ║
/// ║                                                               ║
/// ║  يحقن themeConfig المنشور من لوحة التحكم في حقول AuroraColors  ║
/// ║  الحية. يُستدعى من ThemeController عند الإقلاع وعند كل تحديث.  ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraThemeData {
  AuroraThemeData._();

  /// مفاتيح الـ JSON القادمة من اللوحة (theme/page.tsx → UPDATE_THEME_CONFIG).
  /// أي مفتاح مفقود يُبقي القيمة الافتراضية الحالية.
  static void apply(Map<String, dynamic>? config) {
    if (config == null || config.isEmpty) return;

    Color? c(String key) => AuroraColors.parseHex(config[key] as String?);

    AuroraColors.ember = c('ember') ?? AuroraColors.ember;
    AuroraColors.emberLight = c('emberLight') ?? AuroraColors.emberLight;
    AuroraColors.emberDeep = c('emberDeep') ?? AuroraColors.emberDeep;
    AuroraColors.obsidian = c('obsidian') ?? AuroraColors.obsidian;
    AuroraColors.coal = c('coal') ?? AuroraColors.coal;
    AuroraColors.ash = c('ash') ?? AuroraColors.ash;
    AuroraColors.gold = c('gold') ?? AuroraColors.gold;
    AuroraColors.pearl = c('pearl') ?? AuroraColors.pearl;
    AuroraColors.success = c('success') ?? AuroraColors.success;
    AuroraColors.danger = c('danger') ?? AuroraColors.danger;

    final font = config['fontFamily'];
    if (font is String && font.trim().isNotEmpty) {
      AuroraColors.fontFamily = font.trim();
    }

    final radius = config['borderRadius'];
    if (radius is num) {
      AuroraColors.baseRadius = radius.toDouble().clamp(0, 40);
    }
  }
}
