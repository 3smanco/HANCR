import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/aurora_theme.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — Skeleton (shimmer loading)                              ║
/// ║  هياكل تحميل بلون الثيم الحي. SkeletonBox للعناصر داخل مجموعة، ║
/// ║  SkeletonGroup يطبّق shimmer واحد على شجرة (أداء أفضل)،        ║
/// ║  Skeleton اختصار جاهز لعنصر مفرد.                              ║
/// ╚══════════════════════════════════════════════════════════════╝

/// صندوق رمادي مدوّر بلا shimmer (يُستخدم داخل [SkeletonGroup]).
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.radius = 8,
  });

  final double width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

/// يطبّق shimmer واحداً على شجرة من [SkeletonBox] (أكفأ من shimmer لكل عنصر).
class SkeletonGroup extends StatelessWidget {
  const SkeletonGroup({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      period: Motion.shimmer,
      baseColor: AuroraColors.ash,
      highlightColor: AuroraColors.smoke,
      child: child,
    );
  }
}

/// هيكل مفرد جاهز (box + shimmer).
class Skeleton extends StatelessWidget {
  const Skeleton({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.radius = 8,
  });

  final double width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return SkeletonGroup(
      child: SkeletonBox(width: width, height: height, radius: radius),
    );
  }
}
