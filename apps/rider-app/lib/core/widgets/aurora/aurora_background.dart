import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraBackground — Scaffold بـ خلفية تدرجية cinematic.
/// Ember halo في الأعلى + obsidian في القاع.
class AuroraBackground extends StatelessWidget {
  final Widget child;
  final bool showTopHalo;
  final bool showBottomHalo;

  const AuroraBackground({
    required this.child,
    this.showTopHalo = true,
    this.showBottomHalo = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AuroraColors.pageBackground,
      ),
      child: Stack(
        children: [
          // Top halo — ember glow ناعم
          if (showTopHalo)
            Positioned(
              top: -150,
              left: -100,
              right: -100,
              height: 400,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: AuroraColors.emberHalo,
                ),
              ),
            ),
          // Bottom halo (للـ login screen مثلاً)
          if (showBottomHalo)
            Positioned(
              bottom: -200,
              left: -50,
              right: -50,
              height: 400,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: AuroraColors.emberHalo,
                ),
              ),
            ),
          child,
        ],
      ),
    );
  }
}
