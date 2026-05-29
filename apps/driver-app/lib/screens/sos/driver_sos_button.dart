import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../core/theme/app_theme.dart';
import 'driver_emergency_contacts_screen.dart';

/// DriverSosButton — زر طوارئ دائري عائم للسائق.
///
/// يظهر دائماً في زاوية الشاشة. عند الضغط:
///  - لو لا توجد حادثة نشطة: confirmation dialog → triggerDriverSos
///  - لو هناك حادثة نشطة: dialog عرض الحالة + زر إلغاء
///
/// يحتاج موقع السائق (lat/lng) + orderId اختياري.
class DriverSosButton extends StatelessWidget {
  final double latitude;
  final double longitude;
  final int? orderId;

  const DriverSosButton({
    required this.latitude,
    required this.longitude,
    this.orderId,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SosBloc, SosState>(
      builder: (context, state) {
        final hasActive =
            state is SosLoaded && state.activeIncident != null;
        return _PulseButton(
          color: hasActive ? HancrColors.error : HancrColors.error,
          animated: hasActive,
          onTap: () => hasActive
              ? _showActiveDialog(context, state.activeIncident!.id,
                  state.activeIncident!.contactsNotified)
              : _confirmTrigger(context, state),
        );
      },
    );
  }

  Future<void> _confirmTrigger(BuildContext context, SosState state) async {
    // إن لم تكن هناك جهات طوارئ، نقترح الإضافة.
    if (state is SosLoaded && state.contacts.isEmpty) {
      final addNow = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('لا توجد جهات طوارئ'),
          content: const Text(
            'يُنصح بإضافة جهات طوارئ قبل التفعيل ليتم إشعارها تلقائياً عند الحاجة.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('إضافة الآن'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              style: TextButton.styleFrom(foregroundColor: HancrColors.error),
              child: const Text('تفعيل بدون جهات'),
            ),
          ],
        ),
      );
      if (!context.mounted) return;
      if (addNow == true) {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const DriverEmergencyContactsScreen(),
          ),
        );
        return;
      }
      if (addNow != false) return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: HancrColors.error),
            SizedBox(width: 8),
            Text('تفعيل الطوارئ؟'),
          ],
        ),
        content: const Text(
          'سيُرسَل موقعك ورسالة استغاثة لكل جهات الطوارئ المسجَّلة، وسيتم تنبيه فريق HANCR فوراً.\n\nاستخدم هذا الزر فقط في حالات الخطر الحقيقي.',
          style: TextStyle(height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: HancrColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('نعم، فعِّل الآن'),
          ),
        ],
      ),
    );

    if (!context.mounted) return;
    if (confirmed == true) {
      context.read<SosBloc>().add(SosTriggered(
            latitude: latitude,
            longitude: longitude,
            orderId: orderId,
          ));
    }
  }

  Future<void> _showActiveDialog(
    BuildContext context,
    int incidentId,
    int contactsNotified,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('🚨 حادثة طوارئ نشطة'),
        content: Text(
          'تم إشعار $contactsNotified جهة طوارئ. فريق HANCR يتابع موقعك.\n\nهل أنت بأمان الآن؟',
          style: const TextStyle(height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('لا، الخطر مستمر'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('نعم، أنا بأمان'),
          ),
        ],
      ),
    );
    if (!context.mounted) return;
    if (result == true) {
      context.read<SosBloc>().add(SosCancelled(incidentId));
    }
  }
}

/// زر دائري مع animation نبض عند الحاجة.
class _PulseButton extends StatefulWidget {
  final Color color;
  final bool animated;
  final VoidCallback onTap;

  const _PulseButton({
    required this.color,
    required this.animated,
    required this.onTap,
  });

  @override
  State<_PulseButton> createState() => _PulseButtonState();
}

class _PulseButtonState extends State<_PulseButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
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
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (widget.animated)
            AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) {
                final v = _ctrl.value;
                return Container(
                  width: 40 + 24 * v,
                  height: 40 + 24 * v,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: widget.color.withValues(alpha: 0.3 * (1 - v)),
                  ),
                );
              },
            ),
          Material(
            color: widget.color,
            shape: const CircleBorder(),
            elevation: 6,
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: widget.onTap,
              child: const SizedBox(
                width: 56,
                height: 56,
                child: Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
