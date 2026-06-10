import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_emergency_contacts_screen.dart';

/// AuroraSosCompactButton — زر طوارئ compact (للـ top bar في tracking).
class AuroraSosCompactButton extends StatefulWidget {
  final double latitude;
  final double longitude;
  final int? orderId;

  const AuroraSosCompactButton({
    required this.latitude,
    required this.longitude,
    this.orderId,
    super.key,
  });

  @override
  State<AuroraSosCompactButton> createState() => _AuroraSosCompactButtonState();
}

class _AuroraSosCompactButtonState extends State<AuroraSosCompactButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SosBloc, SosState>(
      builder: (context, state) {
        final hasActive =
            state is SosLoaded && state.activeIncident != null;
        return SizedBox(
          width: 56,
          height: 56,
          child: Stack(
            alignment: Alignment.center,
            children: [
              if (hasActive)
                AnimatedBuilder(
                  animation: _pulseCtrl,
                  builder: (_, __) {
                    final v = _pulseCtrl.value;
                    return Container(
                      width: 40 + 24 * v,
                      height: 40 + 24 * v,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            AuroraColors.danger.withValues(alpha: 0.3 * (1 - v)),
                      ),
                    );
                  },
                ),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AuroraColors.danger,
                  shape: BoxShape.circle,
                  boxShadow: AuroraShadows.dangerGlow,
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: hasActive
                        ? () => _showActiveDialog(
                              context,
                              state.activeIncident!.id,
                              state.activeIncident!.contactsNotified,
                            )
                        : () => _confirmTrigger(context, state),
                    customBorder: const CircleBorder(),
                    child: Icon(
                      Icons.warning_amber_rounded,
                      color: AuroraColors.pearl,
                      size: 22,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _confirmTrigger(BuildContext context, SosState state) async {
    // إن لم تكن هناك جهات → اقترح الإضافة
    if (state is SosLoaded && state.contacts.isEmpty) {
      final addNow = await _showAuroraDialog<bool>(
        context: context,
        title: tr('noContactsTitle'),
        body:
            tr('noContactsBody'),
        confirmLabel: tr('addNow'),
        cancelLabel: tr('activateWithout'),
        confirmIsPrimary: true,
      );
      if (!context.mounted) return;
      if (addNow == true) {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const AuroraEmergencyContactsScreen(),
          ),
        );
        return;
      }
      if (addNow != false) return;
    }

    final confirmed = await _showAuroraDialog<bool>(
      context: context,
      title: tr('sosActivateConfirm'),
      body:
          tr('sosActivateBody'),
      confirmLabel: tr('yesActivate'),
      cancelLabel: tr('cancel'),
      confirmIsDanger: true,
    );

    if (!context.mounted) return;
    if (confirmed == true) {
      context.read<SosBloc>().add(SosTriggered(
            latitude: widget.latitude,
            longitude: widget.longitude,
            orderId: widget.orderId,
          ));
    }
  }

  Future<void> _showActiveDialog(
    BuildContext context,
    int incidentId,
    int contactsNotified,
  ) async {
    final result = await _showAuroraDialog<bool>(
      context: context,
      title: '🚨 طوارئ نشطة',
      body:
          'تم إشعار $contactsNotified جهة طوارئ.\nهل أنت بأمان الآن؟',
      confirmLabel: tr('yesSafe'),
      cancelLabel: tr('noContinueDanger'),
    );
    if (!context.mounted) return;
    if (result == true) {
      context.read<SosBloc>().add(SosCancelled(incidentId));
    }
  }
}

/// Helper: dialog بنمط Aurora.
Future<T?> _showAuroraDialog<T>({
  required BuildContext context,
  required String title,
  required String body,
  required String confirmLabel,
  required String cancelLabel,
  bool confirmIsDanger = false,
  bool confirmIsPrimary = false,
}) {
  return showDialog<T>(
    context: context,
    builder: (ctx) => Dialog(
      backgroundColor: AuroraColors.ash,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AuroraRadius.xl),
        side: const BorderSide(color: AuroraColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AuroraSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: AuroraText.titleMedium),
            const SizedBox(height: AuroraSpacing.sm),
            Text(body, style: AuroraText.bodyMedium),
            const SizedBox(height: AuroraSpacing.xl),
            AuroraButton(
              label: confirmLabel,
              variant: confirmIsDanger
                  ? AuroraButtonVariant.danger
                  : AuroraButtonVariant.primary,
              onPressed: () => Navigator.of(ctx).pop(true as T?),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            AuroraButton.ghost(
              label: cancelLabel,
              fullWidth: true,
              onPressed: () => Navigator.of(ctx).pop(false as T?),
            ),
          ],
        ),
      ),
    ),
  );
}

/// AuroraSosExpandedButton — للـ inline use (في شاشة كاملة).
class AuroraSosExpandedButton extends StatelessWidget {
  final double latitude;
  final double longitude;
  final int? orderId;

  const AuroraSosExpandedButton({
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
        if (hasActive) {
          return AuroraActiveSosBanner(
            incidentId: state.activeIncident!.id,
            contactsNotified: state.activeIncident!.contactsNotified,
          );
        }
        return AuroraButton.danger(
          label: tr('sosActivate'),
          icon: Icons.warning_amber_rounded,
          onPressed: () {
            // delegate to compact button logic via dialog
            final btn = AuroraSosCompactButton(
              latitude: latitude,
              longitude: longitude,
              orderId: orderId,
            );
            (btn.createState() as _AuroraSosCompactButtonState)
                ._confirmTrigger(context, state);
          },
        );
      },
    );
  }
}

/// AuroraActiveSosBanner — يعرض حالة الحادثة النشطة.
class AuroraActiveSosBanner extends StatelessWidget {
  final int incidentId;
  final int contactsNotified;

  const AuroraActiveSosBanner({
    required this.incidentId,
    required this.contactsNotified,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3D1010), Color(0xFF1A0808)],
        ),
        border: Border.all(color: AuroraColors.danger, width: 2),
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        boxShadow: AuroraShadows.dangerGlow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: AuroraColors.danger,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AuroraColors.danger,
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                '🚨 طوارئ نشطة',
                style: AuroraText.titleSmall.copyWith(
                  color: AuroraColors.dangerGlow,
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Text(
            'تم إشعار $contactsNotified جهة طوارئ • فريق HANCR على تواصل',
            style: AuroraText.bodyMedium,
          ),
          const SizedBox(height: AuroraSpacing.md),
          AuroraButton.secondary(
            label: 'إنذار خاطئ — إلغاء',
            icon: Icons.cancel_outlined,
            onPressed: () async {
              final ok = await _showAuroraDialog<bool>(
                context: context,
                title: tr('cancelAlarm'),
                body:
                    tr('areYouSafe'),
                confirmLabel: tr('yesSafe'),
                cancelLabel: 'لا',
              );
              if (ok == true && context.mounted) {
                context.read<SosBloc>().add(SosCancelled(incidentId));
              }
            },
          ),
        ],
      ),
    );
  }
}
