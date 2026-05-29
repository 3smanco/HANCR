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

  // ═══ Background layers (من الأعمق للأخف) ═══
  static const Color obsidian = Color(0xFF0A0807); // الخلفية الأعمق
  static const Color coal = Color(0xFF13100E); // خلفية الـ surface
  static const Color ash = Color(0xFF1F1A17); // cards غامقة
  static const Color smoke = Color(0xFF2A2421); // cards فاتحة قليلاً
  static const Color stone = Color(0xFF3D3530); // hover/elevated

  // ═══ Brand accent — Orange Glow ═══
  static const Color ember = Color(0xFFFF7A1A); // الـ primary action
  static const Color emberLight = Color(0xFFFF9D4D); // glow + accent
  static const Color emberDeep = Color(0xFFE55F00); // pressed/active
  static const Color emberMute = Color(0xFF6B3920); // muted accent (low emphasis)

  // ═══ Gold accents (premium / loyalty) ═══
  static const Color gold = Color(0xFFFFB547);
  static const Color goldGlow = Color(0xFFFFC97A);

  // ═══ Text hierarchy ═══
  static const Color pearl = Color(0xFFFFF5EE); // text عالي تباين
  static const Color textPrimary = Color(0xFFF5EDE7);
  static const Color textSecondary = Color(0xFFA89B96);
  static const Color textHint = Color(0xFF6F635E);
  static const Color textDisabled = Color(0xFF4D4441);

  // ═══ Borders ═══
  static const Color border = Color(0x1AFFFFFF); // 10% white
  static const Color borderStrong = Color(0x33FFFFFF); // 20% white
  static const Color borderGlow = Color(0x4DFF7A1A); // 30% ember
  static const Color divider = Color(0x0DFFFFFF); // 5% white

  // ═══ Status colors ═══
  static const Color success = Color(0xFF10B981);
  static const Color successGlow = Color(0xFF34D399);
  static const Color successBg = Color(0x1A10B981);

  static const Color warning = Color(0xFFFFB547);
  static const Color warningBg = Color(0x1AFFB547);

  static const Color danger = Color(0xFFFF4D4D);
  static const Color dangerGlow = Color(0xFFFF6B6B);
  static const Color dangerBg = Color(0x1AFF4D4D);

  static const Color info = Color(0xFF3B82F6);
  static const Color infoBg = Color(0x1A3B82F6);

  // ═══ Promo badge (للـ promotional badges) ═══
  static const Color promoBg = Color(0xFF10B981);
  static const Color promoText = Color(0xFFFFFFFF);

  // ═══ Gradients ═══
  static const LinearGradient emberGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [ember, emberDeep],
  );

  static const LinearGradient emberRadial = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [emberLight, ember, emberDeep],
  );

  static const LinearGradient pageBackground = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF1A0F08), obsidian, obsidian],
    stops: [0.0, 0.4, 1.0],
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

  // ═══ Backward compat aliases (للكود القديم) ═══
  static const Color background = obsidian;
  static const Color surface = ash;
  static const Color surfaceMute = coal;
  static const Color surfaceElevated = smoke;
  static const Color primary = ember;
  static const Color accent = ember;
  static const Color violet = ember; // mapping القديم → ember
  static const Color violetDeep = emberDeep;
  static const Color violetLight = emberMute;
  static const Color navy = obsidian;
  static const Color cream = pearl;
  static const Color purple = textSecondary;
  static const Color error = danger;
  static const Color errorBg = dangerBg;
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

  static TextStyle get displayLarge => GoogleFonts.cairo(
        color: AuroraColors.pearl,
        fontSize: 40,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: -0.5,
      );

  static TextStyle get displayMedium => GoogleFonts.cairo(
        color: AuroraColors.pearl,
        fontSize: 32,
        fontWeight: FontWeight.w800,
        height: 1.15,
        letterSpacing: -0.3,
      );

  static TextStyle get titleLarge => GoogleFonts.cairo(
        color: AuroraColors.pearl,
        fontSize: 24,
        fontWeight: FontWeight.w700,
        height: 1.2,
      );

  static TextStyle get titleMedium => GoogleFonts.cairo(
        color: AuroraColors.pearl,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        height: 1.25,
      );

  static TextStyle get titleSmall => GoogleFonts.cairo(
        color: AuroraColors.pearl,
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.3,
      );

  static TextStyle get bodyLarge => GoogleFonts.cairo(
        color: AuroraColors.textPrimary,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => GoogleFonts.cairo(
        color: AuroraColors.textSecondary,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.cairo(
        color: AuroraColors.textSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.4,
      );

  static TextStyle get caption => GoogleFonts.cairo(
        color: AuroraColors.textHint,
        fontSize: 11,
        fontWeight: FontWeight.w500,
        height: 1.3,
      );

  static TextStyle get buttonLarge => GoogleFonts.cairo(
        color: AuroraColors.pearl,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        height: 1.0,
        letterSpacing: 0.2,
      );

  static TextStyle get buttonMedium => GoogleFonts.cairo(
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

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AuroraColors.obsidian,
        canvasColor: AuroraColors.obsidian,
        colorScheme: const ColorScheme.dark(
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
          iconTheme: const IconThemeData(color: AuroraColors.pearl),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AuroraColors.ember,
            foregroundColor: AuroraColors.pearl,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
            ),
            textStyle: AuroraText.buttonLarge,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AuroraColors.ash,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            borderSide: const BorderSide(color: AuroraColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            borderSide: const BorderSide(color: AuroraColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            borderSide: const BorderSide(color: AuroraColors.ember, width: 1.5),
          ),
          hintStyle: AuroraText.bodyMedium.copyWith(color: AuroraColors.textHint),
          labelStyle: AuroraText.bodyMedium.copyWith(color: AuroraColors.textSecondary),
        ),
        dividerTheme: const DividerThemeData(
          color: AuroraColors.divider,
          thickness: 1,
          space: 1,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: AuroraColors.coal,
          selectedItemColor: AuroraColors.ember,
          unselectedItemColor: AuroraColors.textSecondary,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
        ),
      );
}
