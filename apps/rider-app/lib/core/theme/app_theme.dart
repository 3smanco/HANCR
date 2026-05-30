import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ============================================================
/// HANCR Design System — v2 (2026-05-27)
/// ============================================================
/// مستوحى من Uber redesign 2024 + هوية HANCR الخاصة:
/// - أساس navy داكن + بنفسجي للإجراءات
/// - دفء عبر cream والـ 16px radii
/// - دعم RTL + Cairo Arabic + Inter Latin
/// ============================================================

class HancrColors {
  HancrColors._();

  // ===== Brand Primary — مُعاد تعيينها لـ Aurora (obsidian + ember) =====
  static const Color navy = Color(0xFF0A0807); // obsidian — الهوية الأساسية
  static const Color violet = Color(0xFFFF7A1A); // ember — الإجراء الرئيسي (CTA)
  static const Color violetDeep = Color(0xFFE55F00); // ember-deep — hover/pressed
  static const Color violetLight = Color(0xFF6B3920); // ember-mute — chip/accent bg
  static const Color purple = Color(0xFFA89B96); // muted — ثانوي (subtitles)
  static const Color cream = Color(0xFF13100E); // coal — خلفية داكنة

  // ===== Aliases (لـ backward-compat) =====
  static const Color primary = navy;
  static const Color accent = violet;
  static const Color accentDark = violetDeep;

  // ===== Surfaces — Aurora dark =====
  static const Color background = Color(0xFF0A0807); // obsidian
  static const Color surface = Color(0xFF1F1A17); // ash
  static const Color surfaceMute = Color(0xFF13100E); // coal — input bg
  static const Color surfaceElevated = Color(0xFF1F1A17); // ash

  // ===== Text — Aurora (light on dark) =====
  static const Color textPrimary = Color(0xFFFFF5EE); // pearl
  static const Color textSecondary = Color(0xFFA89B96); // muted
  static const Color textHint = Color(0xFF6F635E);
  static const Color textOnDark = Color(0xFFFFFFFF);

  // ===== Borders — Aurora (subtle white) =====
  static const Color border = Color(0x1AFFFFFF); // 10% white
  static const Color borderStrong = Color(0x33FFFFFF); // 20% white
  static const Color divider = Color(0x14FFFFFF); // 8% white

  // ===== Functional — brightened for dark bg =====
  static const Color success = Color(0xFF34D399);
  static const Color successBg = Color(0xFF12251C);
  static const Color warning = Color(0xFFFFB547);
  static const Color warningBg = Color(0xFF2A2114);
  static const Color error = Color(0xFFFF6B6B);
  static const Color errorBg = Color(0xFF2A1414);
  static const Color info = Color(0xFF60A5FA);
  static const Color infoBg = Color(0xFF14203A);

  // ===== Status (Driver / Order) =====
  static const Color statusOnline = Color(0xFF10B981); // Captain online
  static const Color statusOffline = Color(0xFF9CA3AF);
  static const Color statusInRide = violet;
  static const Color statusPending = warning;
  static const Color statusBanned = error;

  // ===== Loyalty Tier Colors =====
  static const Color tierBronze = Color(0xFFCD7F32);
  static const Color tierSilver = Color(0xFFC0C0C0);
  static const Color tierGold = Color(0xFFD4AF37);
  static const Color tierPlatinum = Color(0xFF8E9DAB);
  static const Color tierDiamond = violet;

  // ===== Legacy aliases (backward compat with existing screens) =====
  static const Color surfaceVariant = surfaceMute;
  static const Color statusGreen = success;
  static const Color statusOrange = warning;
  static const Color statusBlue = info;
  static const Color statusRed = error;
  static const Color onlineGreen = statusOnline;

  // ===== Gradients =====
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [navy, Color(0xFF1F1A17)],
  );

  static const LinearGradient violetGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [violet, violetDeep],
  );
}

/// ============================================================
/// HancrSpacing — 4pt grid system
/// ============================================================
class HancrSpacing {
  HancrSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double huge = 48;
}

/// ============================================================
/// HancrRadius — corner rounding tokens
/// ============================================================
class HancrRadius {
  HancrRadius._();

  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16; // default for cards/buttons (دافئ)
  static const double xl = 20;
  static const double xxl = 24; // bottom sheets
  static const double pill = 999;
}

/// ============================================================
/// HancrShadows — elevation tokens
/// ============================================================
class HancrShadows {
  HancrShadows._();

  static final List<BoxShadow> card = [
    BoxShadow(
      color: HancrColors.navy.withValues(alpha: 0.04),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static final List<BoxShadow> cardElevated = [
    BoxShadow(
      color: HancrColors.navy.withValues(alpha: 0.08),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
  ];

  static final List<BoxShadow> bottomSheet = [
    BoxShadow(
      color: HancrColors.navy.withValues(alpha: 0.12),
      blurRadius: 24,
      offset: const Offset(0, -8),
    ),
  ];

  static final List<BoxShadow> violetGlow = [
    BoxShadow(
      color: HancrColors.violet.withValues(alpha: 0.25),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];
}

/// ============================================================
/// AppTheme — Material 3 theme factory
/// ============================================================
class AppTheme {
  AppTheme._();

  /// Returns the merged text theme with Cairo Arabic + Inter Latin fallback
  static TextTheme _buildTextTheme(TextTheme base) {
    // Cairo handles Arabic gracefully and includes Latin glyphs
    return GoogleFonts.cairoTextTheme(base).copyWith(
      displayLarge: GoogleFonts.cairo(
        fontSize: 36,
        fontWeight: FontWeight.w800,
        color: HancrColors.textPrimary,
        height: 1.2,
        letterSpacing: -0.5,
      ),
      displayMedium: GoogleFonts.cairo(
        fontSize: 30,
        fontWeight: FontWeight.w700,
        color: HancrColors.textPrimary,
        height: 1.25,
      ),
      headlineLarge: GoogleFonts.cairo(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: HancrColors.textPrimary,
        height: 1.3,
      ),
      headlineMedium: GoogleFonts.cairo(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: HancrColors.textPrimary,
      ),
      headlineSmall: GoogleFonts.cairo(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: HancrColors.textPrimary,
      ),
      titleLarge: GoogleFonts.cairo(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: HancrColors.textPrimary,
      ),
      titleMedium: GoogleFonts.cairo(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: HancrColors.textPrimary,
      ),
      titleSmall: GoogleFonts.cairo(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: HancrColors.textPrimary,
      ),
      bodyLarge: GoogleFonts.cairo(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: HancrColors.textPrimary,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.cairo(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: HancrColors.textSecondary,
        height: 1.5,
      ),
      bodySmall: GoogleFonts.cairo(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: HancrColors.textSecondary,
        height: 1.4,
      ),
      labelLarge: GoogleFonts.cairo(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        letterSpacing: 0.2,
      ),
      labelMedium: GoogleFonts.cairo(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: HancrColors.textPrimary,
      ),
      labelSmall: GoogleFonts.cairo(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: HancrColors.textSecondary,
        letterSpacing: 0.4,
      ),
    );
  }

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: HancrColors.violet,
        onPrimary: Colors.white,
        primaryContainer: HancrColors.violetLight,
        onPrimaryContainer: HancrColors.navy,
        secondary: HancrColors.navy,
        onSecondary: Colors.white,
        tertiary: HancrColors.purple,
        surface: HancrColors.surface,
        onSurface: HancrColors.textPrimary,
        surfaceContainerHighest: HancrColors.surfaceMute,
        onSurfaceVariant: HancrColors.textSecondary,
        error: HancrColors.error,
        onError: Colors.white,
        outline: HancrColors.border,
        outlineVariant: HancrColors.divider,
      ),
      scaffoldBackgroundColor: HancrColors.background,
      splashFactory: InkRipple.splashFactory,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionLike(),
          TargetPlatform.iOS: CupertinoPageTransitionLike(),
        },
      ),
    );

    return base.copyWith(
      textTheme: _buildTextTheme(base.textTheme),
      primaryTextTheme: _buildTextTheme(base.primaryTextTheme),

      // ===== AppBar =====
      appBarTheme: AppBarTheme(
        backgroundColor: HancrColors.surface,
        foregroundColor: HancrColors.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: HancrColors.textPrimary,
        ),
        iconTheme: const IconThemeData(
          color: HancrColors.textPrimary,
          size: 24,
        ),
      ),

      // ===== Elevated Button (CTA primary) =====
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: HancrColors.violet,
          foregroundColor: Colors.white,
          disabledBackgroundColor: HancrColors.violet.withValues(alpha: 0.4),
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(HancrRadius.lg),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
          elevation: 0,
          shadowColor: HancrColors.violet.withValues(alpha: 0.4),
        ).copyWith(
          overlayColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed)) {
              return HancrColors.violetDeep;
            }
            if (states.contains(WidgetState.hovered)) {
              return HancrColors.violet.withValues(alpha: 0.9);
            }
            return null;
          }),
        ),
      ),

      // ===== Filled Button (alternative) =====
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: HancrColors.navy,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(HancrRadius.lg),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),

      // ===== Outlined Button =====
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: HancrColors.navy,
          minimumSize: const Size(double.infinity, 56),
          side: const BorderSide(color: HancrColors.borderStrong, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(HancrRadius.lg),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ===== Text Button =====
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: HancrColors.violet,
          textStyle: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ===== Input Decoration =====
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: HancrColors.surfaceMute,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: HancrSpacing.lg,
          vertical: HancrSpacing.lg,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          borderSide: const BorderSide(color: HancrColors.violet, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          borderSide: const BorderSide(color: HancrColors.error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          borderSide: const BorderSide(color: HancrColors.error, width: 2),
        ),
        hintStyle: GoogleFonts.cairo(
          color: HancrColors.textHint,
          fontSize: 15,
        ),
        labelStyle: GoogleFonts.cairo(
          color: HancrColors.textSecondary,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        floatingLabelStyle: GoogleFonts.cairo(
          color: HancrColors.violet,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),

      // ===== Card =====
      cardTheme: CardThemeData(
        color: HancrColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          side: const BorderSide(color: HancrColors.divider, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      // ===== Bottom Navigation =====
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: HancrColors.surface,
        selectedItemColor: HancrColors.violet,
        unselectedItemColor: HancrColors.textHint,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: GoogleFonts.cairo(
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
        unselectedLabelStyle: GoogleFonts.cairo(
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),

      // ===== Bottom Sheet =====
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: HancrColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(HancrRadius.xxl),
          ),
        ),
        elevation: 0,
        showDragHandle: true,
        dragHandleColor: HancrColors.borderStrong,
        dragHandleSize: Size(48, 4),
      ),

      // ===== Dialog =====
      dialogTheme: DialogThemeData(
        backgroundColor: HancrColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HancrRadius.xl),
        ),
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: HancrColors.textPrimary,
        ),
        contentTextStyle: GoogleFonts.cairo(
          fontSize: 14,
          color: HancrColors.textSecondary,
          height: 1.5,
        ),
      ),

      // ===== Divider =====
      dividerTheme: const DividerThemeData(
        color: HancrColors.divider,
        thickness: 1,
        space: 1,
      ),

      // ===== SnackBar =====
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HancrRadius.md),
        ),
        backgroundColor: HancrColors.navy,
        contentTextStyle: GoogleFonts.cairo(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        actionTextColor: HancrColors.violet,
      ),

      // ===== Chip =====
      chipTheme: ChipThemeData(
        backgroundColor: HancrColors.surfaceMute,
        selectedColor: HancrColors.violetLight,
        labelStyle: GoogleFonts.cairo(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: HancrColors.textPrimary,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: HancrSpacing.md,
          vertical: HancrSpacing.xs,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HancrRadius.pill),
        ),
        side: BorderSide.none,
      ),

      // ===== Progress Indicator =====
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: HancrColors.violet,
        linearTrackColor: HancrColors.violetLight,
        circularTrackColor: HancrColors.violetLight,
      ),

      // ===== Switch =====
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected)
                  ? Colors.white
                  : Colors.white,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected)
                  ? HancrColors.violet
                  : HancrColors.borderStrong,
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),

      // ===== Floating Action Button =====
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: HancrColors.violet,
        foregroundColor: Colors.white,
        elevation: 4,
        focusElevation: 6,
        hoverElevation: 6,
        shape: CircleBorder(),
      ),
    );
  }
}

/// Custom transition that mimics Cupertino slide
class CupertinoPageTransitionLike extends PageTransitionsBuilder {
  const CupertinoPageTransitionLike();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final tween = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).chain(CurveTween(curve: Curves.easeOutCubic));
    return SlideTransition(position: animation.drive(tween), child: child);
  }
}
