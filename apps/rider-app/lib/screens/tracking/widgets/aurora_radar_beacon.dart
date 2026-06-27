import 'package:flutter/material.dart';

import '../../../core/theme/aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  AuroraRadarBeacon — رادار نابض لمرحلة البحث عن سائق            ║
/// ║                                                               ║
/// ║  حلقات ember متحدّة المركز تتمدّد وتتلاشى حول أيقونة رادار،     ║
/// ║  توحي بالبثّ للسائقين القريبين. مكتفٍ ذاتياً (ticker داخلي).    ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraRadarBeacon extends StatefulWidget {
  const AuroraRadarBeacon({this.size = 72, super.key});

  final double size;

  @override
  State<AuroraRadarBeacon> createState() => _AuroraRadarBeaconState();
}

class _AuroraRadarBeaconState extends State<AuroraRadarBeacon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (_, __) {
          return Stack(
            alignment: Alignment.center,
            children: [
              // ثلاث حلقات متتابعة الطور
              for (var i = 0; i < 3; i++) _ring((_ctrl.value + i / 3) % 1.0),
              // النواة
              Container(
                width: widget.size * 0.34,
                height: widget.size * 0.34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AuroraColors.emberGradient,
                  boxShadow: AuroraShadows.emberGlow,
                ),
                child: Icon(
                  Icons.radar_rounded,
                  color: Colors.white,
                  size: widget.size * 0.2,
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _ring(double t) {
    final scale = 0.34 + t * 0.66; // من النواة للحافة
    final opacity = (1 - t).clamp(0.0, 1.0) * 0.5;
    return Container(
      width: widget.size * scale,
      height: widget.size * scale,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AuroraColors.ember.withValues(alpha: opacity),
          width: 2,
        ),
      ),
    );
  }
}
