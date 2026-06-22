import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// Helper لعرض snackbars بنمط Aurora.
class AuroraToast {
  AuroraToast._();

  /// "قريباً" — يُستخدم في الأزرار قيد التطوير.
  static void comingSoon(BuildContext context, {String? feature}) {
    final msg = feature != null ? '$feature — قريباً ✨' : 'هذه الميزة قريباً ✨';
    show(context, msg, icon: Icons.auto_awesome);
  }

  /// Generic Aurora snackbar.
  static void show(
    BuildContext context,
    String message, {
    IconData? icon,
    Color? color,
    Duration duration = const Duration(seconds: 2),
  }) {
    // N5 — اللون الافتراضي حي (ember) فلا يصلح كقيمة افتراضية const.
    final bg = color ?? AuroraColors.ember;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: AuroraColors.pearl, size: 18),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                message,
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: bg,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(AuroraSpacing.lg),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
        ),
        duration: duration,
      ),
    );
  }

  /// Success toast (green).
  static void success(BuildContext context, String message) =>
      show(context, message,
          icon: Icons.check_circle, color: AuroraColors.success);

  /// Error toast (red).
  static void error(BuildContext context, String message) =>
      show(context, message,
          icon: Icons.error_outline, color: AuroraColors.danger);
}
