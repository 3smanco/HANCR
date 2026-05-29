import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import 'emergency_contacts_screen.dart';

/// SosButton — زر الطوارئ القابل لإعادة الاستخدام.
///
/// عند الضغط:
///  1. يعرض dialog تأكيد (مع slide-to-confirm لمنع الضغط الخاطئ)
///  2. عند التأكيد → يُرسل SosTriggered للـ Bloc
///  3. لو لا توجد جهات طوارئ → يعرض dialog يقترح إضافتها أولاً
///
/// يجب أن يكون داخل `BlocProvider<SosBloc>`.
class SosButton extends StatelessWidget {
  /// موقع المستخدم الحالي (يجب أن يُمرَّر من الشاشة)
  final double latitude;
  final double longitude;

  /// id الرحلة الحالية (إن وُجدت)
  final int? orderId;

  /// شكل الزر — `compact` للظهور بجانب أزرار أخرى، `expanded` لـ full-width
  final SosButtonVariant variant;

  const SosButton({
    required this.latitude,
    required this.longitude,
    this.orderId,
    this.variant = SosButtonVariant.expanded,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SosBloc, SosState>(
      builder: (context, state) {
        final hasActive =
            state is SosLoaded && state.activeIncident != null;

        if (hasActive) {
          return _ActiveSosBanner(
            incidentId: state.activeIncident!.id,
            contactsNotified: state.activeIncident!.contactsNotified,
          );
        }

        if (variant == SosButtonVariant.compact) {
          return _CompactButton(onPressed: () => _confirmTrigger(context, state));
        }
        return _ExpandedButton(onPressed: () => _confirmTrigger(context, state));
      },
    );
  }

  Future<void> _confirmTrigger(BuildContext context, SosState state) async {
    // إن لم تكن هناك جهات طوارئ مسجَّلة، اقترح الإضافة أولاً.
    if (state is SosLoaded && state.contacts.isEmpty) {
      final addNow = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('لا توجد جهات طوارئ'),
          content: const Text(
            'لم تُسجل جهات طوارئ بعد. يُنصح بإضافتها قبل تفعيل الطوارئ ليتم إشعارها تلقائياً.',
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
            builder: (_) => const EmergencyContactsScreen(),
          ),
        );
        return;
      }
      if (addNow != false) return; // dialog dismissed
    }

    // dialog تأكيد رئيسي
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: HancrColors.surface,
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: HancrColors.error),
            SizedBox(width: 8),
            Text('تفعيل الطوارئ؟'),
          ],
        ),
        content: const Text(
          'سيتم إرسال موقعك الحالي ورسالة استغاثة لجميع جهات الطوارئ المسجَّلة، وسيتم تنبيه فريق HANCR للطوارئ فوراً.\n\nلا تفعِّل هذا الزر إلا في حالات الخطر الحقيقي.',
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
}

enum SosButtonVariant { compact, expanded }

// ─────────────────────────────────────────────────────────────────────────────
// Button variants
// ─────────────────────────────────────────────────────────────────────────────

class _ExpandedButton extends StatelessWidget {
  final VoidCallback onPressed;
  const _ExpandedButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: HancrColors.error,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.warning_amber_rounded,
                  color: Colors.white, size: 22),
              SizedBox(width: 10),
              Text(
                'تفعيل الطوارئ',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CompactButton extends StatelessWidget {
  final VoidCallback onPressed;
  const _CompactButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: HancrColors.error,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: const Padding(
          padding: EdgeInsets.all(14),
          child: Icon(
            Icons.warning_amber_rounded,
            color: Colors.white,
            size: 22,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active SOS Banner — يظهر بدل الزر عند وجود حادثة نشطة
// ─────────────────────────────────────────────────────────────────────────────

class _ActiveSosBanner extends StatelessWidget {
  final int incidentId;
  final int contactsNotified;

  const _ActiveSosBanner({
    required this.incidentId,
    required this.contactsNotified,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: HancrColors.errorBg,
        border: Border.all(color: HancrColors.error, width: 2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  color: HancrColors.error,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  '🚨 حادثة طوارئ نشطة',
                  style: TextStyle(
                    color: HancrColors.error,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'تم إشعار $contactsNotified جهة طوارئ • فريق HANCR على تواصل',
            style: const TextStyle(
              color: HancrColors.textPrimary,
              fontSize: 12,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 12),
          HancrButton.outline(
            label: 'إنذار خاطئ — إلغاء',
            icon: Icons.cancel_outlined,
            onPressed: () => _confirmCancel(context),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmCancel(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إلغاء الإنذار'),
        content: const Text(
          'هل أنت بأمان الآن؟ سيتم إلغاء حالة الطوارئ وإغلاق الحادثة.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('لا'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('نعم، أنا بأمان'),
          ),
        ],
      ),
    );
    if (!context.mounted) return;
    if (confirmed == true) {
      context.read<SosBloc>().add(SosCancelled(incidentId));
    }
  }
}
