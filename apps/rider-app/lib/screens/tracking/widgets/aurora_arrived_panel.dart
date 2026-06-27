import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/i18n/app_localization.dart';
import '../../../core/models/order_model.dart';
import '../../../core/theme/aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  AuroraArrivedPanel — لوحة «وصل سائقك» + عدّاد الانتظار          ║
/// ║                                                               ║
/// ║  تظهر داخل بطاقة التتبع عند حالة `arrived`:                    ║
/// ║  - حزام حالة ضخم: «وصل سائقك — قابله بالخارج».                 ║
/// ║  - عدّاد تنازلي: أخضر ضمن المهلة المجانية (freeWaitSeconds)،    ║
/// ║    ثم أحمر «بدأ احتساب وقت الانتظار» مع عدّ الوقت المدفوع.       ║
/// ║  - Vehicle Verification Pod: لوحة السيارة مكبّرة بصندوق أبيض    ║
/// ║    عالي التباين + موديل/لون السيارة + أفاتار السائق.            ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraArrivedPanel extends StatefulWidget {
  const AuroraArrivedPanel({required this.order, super.key});

  final OrderModel order;

  @override
  State<AuroraArrivedPanel> createState() => _AuroraArrivedPanelState();
}

class _AuroraArrivedPanelState extends State<AuroraArrivedPanel> {
  Timer? _ticker;
  late DateTime _arrivedAt;

  @override
  void initState() {
    super.initState();
    // مرجع العدّاد: لحظة وصول الخادم إن توفّرت، وإلا أول ظهور للوحة.
    _arrivedAt = widget.order.arrivedAt ?? DateTime.now();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  int get _elapsedSeconds =>
      DateTime.now().difference(_arrivedAt).inSeconds.clamp(0, 1 << 30);

  int get _freeWait => widget.order.freeWaitSeconds;

  bool get _isPaid => _elapsedSeconds >= _freeWait;

  /// النص الزمني: ضمن المهلة = العدّ التنازلي للمجاني؛ بعدها = العدّ التصاعدي للمدفوع.
  String get _clock {
    final secs = _isPaid ? (_elapsedSeconds - _freeWait) : (_freeWait - _elapsedSeconds);
    final m = (secs ~/ 60).toString().padLeft(2, '0');
    final s = (secs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _statusBanner(),
        const SizedBox(height: AuroraSpacing.md),
        _countdownRow(),
        const SizedBox(height: AuroraSpacing.lg),
        _verificationPod(),
      ],
    );
  }

  // ── Status banner ────────────────────────────────────────────────────────
  Widget _statusBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.md),
      decoration: BoxDecoration(
        gradient: AuroraColors.emberGradient,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        boxShadow: AuroraShadows.emberGlow,
      ),
      child: Row(
        children: [
          const Icon(Icons.directions_car_filled_rounded,
              color: Colors.white, size: 28),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tr('driverArrivedBig'),
                  style: AuroraText.titleMedium.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  tr('meetOutside'),
                  style: AuroraText.bodySmall
                      .copyWith(color: Colors.white.withValues(alpha: 0.9)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Countdown ────────────────────────────────────────────────────────────
  Widget _countdownRow() {
    final paid = _isPaid;
    final color = paid ? AuroraColors.danger : AuroraColors.success;
    final label = paid ? tr('paidWaitStarted') : tr('freeWaitTime');
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.md),
      decoration: BoxDecoration(
        color: (paid ? AuroraColors.dangerBg : AuroraColors.successBg),
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Icon(paid ? Icons.timer_rounded : Icons.timelapse_rounded,
              color: color, size: 22),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Text(
              label,
              style: AuroraText.bodyMedium.copyWith(
                color: color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Text(
            _clock,
            style: AuroraText.titleMedium.copyWith(
              color: color,
              fontWeight: FontWeight.w900,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }

  // ── Vehicle Verification Pod ─────────────────────────────────────────────
  Widget _verificationPod() {
    final o = widget.order;
    final carLine = [o.carColor, o.carBrand, o.carModel]
        .where((e) => (e ?? '').trim().isNotEmpty)
        .join(' · ');
    return Row(
      children: [
        _driverAvatar(o),
        const SizedBox(width: AuroraSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                o.driverName ?? tr('driver'),
                style: AuroraText.titleSmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (carLine.isNotEmpty)
                Text(
                  carLine,
                  style: AuroraText.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        const SizedBox(width: AuroraSpacing.md),
        _platePod(o.plateNumber ?? '—'),
      ],
    );
  }

  /// صندوق أبيض عالي التباين يُكبّر رقم اللوحة (أول ما يتحقّق منه الراكب).
  Widget _platePod(String plate) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AuroraRadius.sm),
        border: Border.all(color: const Color(0xFF111111), width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0x55000000), blurRadius: 10, offset: Offset(0, 3)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            tr('plateLabel'),
            style: const TextStyle(
              color: Color(0xFF666666),
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 1,
            ),
          ),
          Text(
            plate,
            style: const TextStyle(
              color: Color(0xFF0A0807),
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _driverAvatar(OrderModel o) {
    final url = o.driverAvatarUrl;
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AuroraColors.emberGradient,
        border: Border.all(color: AuroraColors.borderGlow, width: 2),
      ),
      clipBehavior: Clip.antiAlias,
      child: (url != null && url.isNotEmpty)
          ? Image.network(
              url,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _avatarFallback(o),
            )
          : _avatarFallback(o),
    );
  }

  Widget _avatarFallback(OrderModel o) {
    final initial =
        (o.driverName ?? 'D').trim().isNotEmpty ? o.driverName!.trim()[0] : 'D';
    return Center(
      child: Text(
        initial,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 22,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
