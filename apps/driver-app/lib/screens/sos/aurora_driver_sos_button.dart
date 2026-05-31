import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'driver_emergency_contacts_screen.dart';

/// AuroraDriverSosButton — زر SOS عائم للسائق.
class AuroraDriverSosButton extends StatefulWidget {
  final double latitude;
  final double longitude;
  final int? orderId;

  const AuroraDriverSosButton({
    required this.latitude,
    required this.longitude,
    this.orderId,
    super.key,
  });

  @override
  State<AuroraDriverSosButton> createState() => _AuroraDriverSosButtonState();
}

class _AuroraDriverSosButtonState extends State<AuroraDriverSosButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SosBloc, SosState>(
      builder: (ctx, state) {
        final active = state is SosLoaded && state.activeIncident != null;
        return SizedBox(
          width: 56,
          height: 56,
          child: Stack(
            alignment: Alignment.center,
            children: [
              if (active)
                AnimatedBuilder(
                  animation: _pulse,
                  builder: (_, __) {
                    final v = _pulse.value;
                    return Container(
                      width: 40 + 24 * v,
                      height: 40 + 24 * v,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AuroraColors.danger.withValues(alpha: 0.3 * (1 - v)),
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
                    customBorder: const CircleBorder(),
                    onTap: active
                        ? () => _showActiveDialog(
                            ctx, state.activeIncident!.id,
                            state.activeIncident!.contactsNotified)
                        : () => _confirmTrigger(ctx, state),
                    child: const Icon(
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
    if (state is SosLoaded && state.contacts.isEmpty) {
      final add = await _showAuroraDialog<bool>(
        context: context,
        title: tr('noContactsTitle'),
        body: tr('noContactsBody'),
        confirm: tr('addNow'),
        cancel: tr('activateWithout'),
      );
      if (!context.mounted) return;
      if (add == true) {
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => const DriverEmergencyContactsScreen(),
        ));
        return;
      }
      if (add != false) return;
    }
    final ok = await _showAuroraDialog<bool>(
      context: context,
      title: tr('sosActivateConfirm'),
      body: tr('sosActivateBody'),
      confirm: tr('yesActivate'),
      cancel: tr('cancel'),
      dangerConfirm: true,
    );
    if (!context.mounted) return;
    if (ok == true) {
      context.read<SosBloc>().add(SosTriggered(
            latitude: widget.latitude,
            longitude: widget.longitude,
            orderId: widget.orderId,
          ));
    }
  }

  Future<void> _showActiveDialog(
      BuildContext context, int incidentId, int notified) async {
    final ok = await _showAuroraDialog<bool>(
      context: context,
      title: tr('sosActiveTitle'),
      body: 'تم إشعار $notified جهة. هل أنت بأمان الآن؟',
      confirm: tr('yesSafe'),
      cancel: tr('dangerContinues'),
    );
    if (!context.mounted) return;
    if (ok == true) context.read<SosBloc>().add(SosCancelled(incidentId));
  }
}

Future<T?> _showAuroraDialog<T>({
  required BuildContext context,
  required String title,
  required String body,
  required String confirm,
  required String cancel,
  bool dangerConfirm = false,
}) {
  return showDialog<T>(
    context: context,
    builder: (ctx) => Dialog(
      backgroundColor: AuroraColors.ash,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AuroraRadius.xl),
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
              label: confirm,
              variant: dangerConfirm
                  ? AuroraButtonVariant.danger
                  : AuroraButtonVariant.primary,
              onPressed: () => Navigator.of(ctx).pop(true as T?),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            AuroraButton.ghost(
              label: cancel,
              fullWidth: true,
              onPressed: () => Navigator.of(ctx).pop(false as T?),
            ),
          ],
        ),
      ),
    ),
  );
}
