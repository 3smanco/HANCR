import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../core/models/sos_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_add_contact_sheet.dart';

/// AuroraEmergencyContactsScreen — قائمة جهات الطوارئ بنمط Aurora.
class AuroraEmergencyContactsScreen extends StatelessWidget {
  const AuroraEmergencyContactsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SosBloc>(
      create: (_) => SosBloc()..add(const SosLoadRequested()),
      child: const _ContactsView(),
    );
  }
}

class _ContactsView extends StatelessWidget {
  const _ContactsView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: BlocConsumer<SosBloc, SosState>(
          listenWhen: (p, c) => c is SosLoaded && c.toast != null,
          listener: (ctx, state) {
            if (state is SosLoaded && state.toast != null) {
              ScaffoldMessenger.of(ctx).showSnackBar(
                SnackBar(
                  content: Text(state.toast!),
                  backgroundColor: AuroraColors.ember,
                ),
              );
              ctx.read<SosBloc>().add(const SosToastCleared());
            }
          },
          builder: (context, state) {
            return SafeArea(
              child: Column(
                children: [
                  // ─── Top bar ───
                  Padding(
                    padding: const EdgeInsets.all(AuroraSpacing.lg),
                    child: Row(
                      children: [
                        _circleBtn(
                          icon: Icons.arrow_back,
                          onTap: () => Navigator.of(context).pop(),
                        ),
                        const SizedBox(width: AuroraSpacing.md),
                        Expanded(
                          child: Text(
                            tr('emergencyContacts'),
                            style: AuroraText.titleLarge,
                          ),
                        ),
                        _circleBtn(
                          icon: Icons.add,
                          primary: true,
                          onTap: () => _openAdd(context),
                        ),
                      ],
                    ),
                  ),

                  Expanded(
                    child: _buildBody(context, state),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, SosState state) {
    if (state is SosInitial || state is SosLoading) {
      return Center(
        child: CircularProgressIndicator(color: AuroraColors.ember),
      );
    }
    if (state is SosError) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.xxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline,
                  color: AuroraColors.danger, size: 64),
              const SizedBox(height: AuroraSpacing.md),
              Text(state.message, style: AuroraText.bodyMedium),
              const SizedBox(height: AuroraSpacing.lg),
              AuroraButton.primary(
                label: tr('retry'),
                fullWidth: false,
                onPressed: () =>
                    context.read<SosBloc>().add(const SosLoadRequested()),
              ),
            ],
          ),
        ),
      );
    }
    if (state is SosLoaded) {
      return RefreshIndicator(
        color: AuroraColors.ember,
        backgroundColor: AuroraColors.ash,
        onRefresh: () async {
          context.read<SosBloc>().add(const SosLoadRequested());
          await Future<void>.delayed(const Duration(milliseconds: 600));
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            _infoCard(),
            const SizedBox(height: AuroraSpacing.lg),
            if (state.contacts.isEmpty)
              _empty(context)
            else
              ...state.contacts.map(
                (c) => Padding(
                  padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                  child: _contactCard(context, c),
                ),
              ),
            const SizedBox(height: AuroraSpacing.huge),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }

  // ─────────────────────────────────────────────────────────────
  Widget _infoCard() {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        gradient: AuroraColors.emberGradient,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        boxShadow: AuroraShadows.emberGlow,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AuroraSpacing.sm),
            decoration: BoxDecoration(
              color: AuroraColors.pearl.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.shield_outlined,
                color: AuroraColors.pearl, size: 24),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tr('safetyFirst'),
                  style: AuroraText.titleSmall.copyWith(
                    color: AuroraColors.pearl,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  tr('sosShareMsg'),
                  style: AuroraText.bodySmall.copyWith(
                    color: AuroraColors.pearl.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _contactCard(BuildContext context, EmergencyContactModel c) {
    return AuroraCard(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${c.name} — ${c.phoneNumber}'),
          backgroundColor: AuroraColors.smoke,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: AuroraColors.emberGradient,
              shape: BoxShape.circle,
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Center(
              child: Text(
                c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                style: AuroraText.titleSmall.copyWith(
                  color: AuroraColors.pearl,
                ),
              ),
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(c.name, style: AuroraText.titleSmall),
                const SizedBox(height: 2),
                Text(
                  c.phoneNumber,
                  style: AuroraText.bodySmall.copyWith(
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _miniChip(
                      label: c.relation.label,
                      color: AuroraColors.emberMute,
                      textColor: AuroraColors.ember,
                    ),
                    if (c.autoShareTrips) ...[
                      const SizedBox(width: 6),
                      _miniChip(
                        label: '📍 مشاركة تلقائية',
                        color: AuroraColors.successBg,
                        textColor: AuroraColors.success,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon:
                Icon(Icons.delete_outline, color: AuroraColors.danger),
            onPressed: () => _confirmDelete(context, c),
          ),
        ],
      ),
    );
  }

  Widget _miniChip({
    required String label,
    required Color color,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.sm, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AuroraRadius.xs),
      ),
      child: Text(
        label,
        style: AuroraText.caption.copyWith(
          color: textColor,
          fontWeight: FontWeight.w700,
          fontSize: 10,
        ),
      ),
    );
  }

  Widget _empty(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.huge),
      child: Column(
        children: [
          const Icon(Icons.contact_phone_outlined,
              size: 64, color: AuroraColors.textHint),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('noContactsYet'), style: AuroraText.titleSmall),
          const SizedBox(height: 4),
          Text(
            tr('noContactsSub'),
            style: AuroraText.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AuroraSpacing.lg),
          AuroraButton.primary(
            label: tr('addContact'),
            icon: Icons.add,
            fullWidth: false,
            onPressed: () => _openAdd(context),
          ),
        ],
      ),
    );
  }

  Widget _circleBtn({
    required IconData icon,
    required VoidCallback onTap,
    bool primary = false,
  }) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: primary ? AuroraColors.ember : AuroraColors.ash,
        shape: BoxShape.circle,
        border: Border.all(
          color: primary ? AuroraColors.ember : AuroraColors.border,
        ),
        boxShadow: primary ? AuroraShadows.iconGlow : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Icon(
            icon,
            color: primary ? AuroraColors.pearl : AuroraColors.pearl,
            size: 20,
          ),
        ),
      ),
    );
  }

  void _openAdd(BuildContext context) {
    final bloc = context.read<SosBloc>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: bloc,
        child: const AuroraAddContactSheet(),
      ),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    EmergencyContactModel c,
  ) async {
    final bloc = context.read<SosBloc>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dCtx) => Dialog(
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
              Text(tr('deleteContact'), style: AuroraText.titleMedium),
              const SizedBox(height: AuroraSpacing.sm),
              Text('هل تريد حذف ${c.name}؟', style: AuroraText.bodyMedium),
              const SizedBox(height: AuroraSpacing.xl),
              AuroraButton.danger(
                label: tr('delete'),
                icon: Icons.delete_outline,
                onPressed: () => Navigator.of(dCtx).pop(true),
              ),
              const SizedBox(height: AuroraSpacing.sm),
              AuroraButton.ghost(
                label: tr('cancel'),
                fullWidth: true,
                onPressed: () => Navigator.of(dCtx).pop(false),
              ),
            ],
          ),
        ),
      ),
    );
    if (confirmed == true) {
      bloc.add(SosContactRemoved(c.id));
    }
  }
}
