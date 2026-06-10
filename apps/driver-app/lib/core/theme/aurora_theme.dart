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
  static const Color smoke = Color(0xFF2A2421); // cards فاتحة قليلاً
  static const Color stone = Color(0xFF3D3530); // hover/elevated

  // ═══ Brand accent — Orange Glow — live ═══
  static Color ember = const Color(0xFFFF7A1A); // الـ primary action
  static Color emberLight = const Color(0xFFFF9D4D); // glow + accent
  static Color emberDeep = const Color(0xFFE55F00); // pressed/active
  static const Color emberMute = Color(0xFF6B3920); // muted accent (low emphasis)

  // ═══ Gold accents (premium / loyalty) — live ═══
  static Color gold = const Color(0xFFFFB547);
  static const Color goldGlow = Color(0xFFFFC97A);

  // ═══ Text hierarchy — pearl live ═══
  static Color pearl = const Color(0xFFFFF5EE); // text عالي تباين
  static const Color textPrimary = Color(0xFFF5EDE7);
  static const Color textSecondary = Color(0xFFA89B96);
  static const Color textHint = Color(0xFF6F635E);
  static const Color textDisabled = Color(0xFF4D4441);

  // ═══ Borders ═══
  static const Color border = Color(0x1AFFFFFF); // 10% white
  static const Color borderStrong = Color(0x33FFFFFF); // 20% white
  static const Color borderGlow = Color(0x4DFF7A1A); // 30% ember
  static const Color divider = Color(0x0DFFFFFF); // 5% white

  // ═══ Status colors — success/danger live ═══
  static Color success = const Color(0xFF10B981);
  static const Color successGlow = Color(0xFF34D399);
  static const Color successBg = Color(0x1A10B981);

  static const Color warning = Color(0xFFFFB547);
  static const Color warningBg = Color(0x1AFFB547);

  static Color danger = const Color(0xFFFF4D4D);
  static const Color dangerGlow = Color(0xFFFF6B6B);
  static const Color dangerBg = Color(0x1AFF4D4D);

  // ═══ Typography + shape — live من themeConfig ═══
  /// عائلة الخط (Google Fonts) — تُقرأ ديناميكياً في AuroraText.
  static String fontFamily = 'Cairo';

  /// نصف قطر الحواف الأساسي للمكوّنات (أزرار/حقول) — يُطبَّق في AuroraTheme.dark.
  static double baseRadius = 16;

  static const Color info = Color(0xFF3B82F6);
  static const Color infoBg = Color(0x1A3B82F6);

  // ═══ Promo badge (للـ promotional badges) ═══
  static const Color promoBg = Color(0xFF10B981);
  static const Color promoText = Color(0xFFFFFFFF);

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

  static LinearGradient get pageBackground => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [const Color(0xFF1A0F08), obsidian, obsidian],
        stops: const [0.0, 0.4, 1.0],
      );

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
  static const Color surfaceElevated = smoke;
  static Color get primary => ember;
  static Color get accent => ember;
  static Color get violet => ember; // mapping القديم → ember
  static Color get violetDeep => emberDeep;
  static const Color violetLight = emberMute;
  static Color get navy => obsidian;
  static Color get cream => pearl;
  static const Color purple = textSecondary;
  static Color get error => danger;
  static const Color errorBg = dangerBg;

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

  static ThemeData get dark {
    // N5 — نصف القطر الحي (من themeConfig). non-const فلا يمكن استخدامه في const.
    final r = AuroraColors.baseRadius;
    return ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AuroraColors.obsidian,
        canvasColor: AuroraColors.obsidian,
        colorScheme: ColorScheme.dark(
          primary: AuroraColors.ember,
          onPrimary: AuroraColors.pearl,
          secondary: AuroraColors.emberLight,
          onSecondary: AuroraColors.obsidian,
          surface: AuroraColors.ash,
          onSurface: AuroraColors.pearl,
          error: AuroraColors.danger,
          onError: AuroraColors.pearl,
        ),
        textTheme: TextTheme(
          displayLarge: AuroraText.displayLarge,
          displayMedium: AuroraText.displayMedium,
          headlineLarge: AuroraText.titleLarge,
          headlineMedium: AuroraText.titleMedium,
          headlineSmall: AuroraText.titleSmall,
          titleLarge: AuroraText.titleLarge,
          titleMedium: AuroraText.titleMedium,
          titleSmall: AuroraText.titleSmall,
          bodyLarge: AuroraText.bodyLarge,
          bodyMedium: AuroraText.bodyMedium,
          bodySmall: AuroraText.bodySmall,
          labelLarge: AuroraText.buttonLarge,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: AuroraText.titleMedium,
          iconTheme: IconThemeData(color: AuroraColors.pearl),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AuroraColors.ember,
            foregroundColor: AuroraColors.pearl,
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
          fillColor: AuroraColors.ash,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(r),
            borderSide: const BorderSide(color: AuroraColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(r),
            borderSide: const BorderSide(color: AuroraColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(r),
            borderSide: BorderSide(color: AuroraColors.ember, width: 1.5),
          ),
          hintStyle: AuroraText.bodyMedium.copyWith(color: AuroraColors.textHint),
          labelStyle: AuroraText.bodyMedium.copyWith(color: AuroraColors.textSecondary),
        ),
        dividerTheme: const DividerThemeData(
          color: AuroraColors.divider,
          thickness: 1,
          space: 1,
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: AuroraColors.coal,
          selectedItemColor: AuroraColors.ember,
          unselectedItemColor: AuroraColors.textSecondary,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
        ),
      );
  }
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
