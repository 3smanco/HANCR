import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../core/models/sos_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import 'add_driver_contact_sheet.dart';

/// DriverEmergencyContactsScreen — إدارة جهات الطوارئ للسائق.
class DriverEmergencyContactsScreen extends StatelessWidget {
  const DriverEmergencyContactsScreen({super.key});

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
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        title: const Text('جهات الطوارئ 🛡️'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            tooltip: 'إضافة جهة',
            onPressed: () => _openAddSheet(context),
          ),
        ],
      ),
      body: BlocConsumer<SosBloc, SosState>(
        listenWhen: (p, c) => c is SosLoaded && c.toast != null,
        listener: (ctx, state) {
          if (state is SosLoaded && state.toast != null) {
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(state.toast!),
                backgroundColor: HancrColors.violet,
              ),
            );
            ctx.read<SosBloc>().add(const SosToastCleared());
          }
        },
        builder: (context, state) {
          if (state is SosInitial || state is SosLoading) {
            return const Center(
              child: CircularProgressIndicator(color: HancrColors.violet),
            );
          }
          if (state is SosError) {
            return _ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<SosBloc>().add(const SosLoadRequested()),
            );
          }
          if (state is SosLoaded) {
            return RefreshIndicator(
              color: HancrColors.violet,
              onRefresh: () async {
                context.read<SosBloc>().add(const SosLoadRequested());
                await Future<void>.delayed(const Duration(milliseconds: 500));
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                children: [
                  const _InfoCard(),
                  const SizedBox(height: 16),
                  if (state.contacts.isEmpty)
                    _EmptyContacts(onAdd: () => _openAddSheet(context))
                  else
                    ...state.contacts.map(
                      (c) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _ContactTile(
                          contact: c,
                          onDelete: () => _confirmDelete(context, c),
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  void _openAddSheet(BuildContext context) {
    final bloc = context.read<SosBloc>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: bloc,
        child: const AddDriverContactSheet(),
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
      builder: (dialogCtx) => AlertDialog(
        title: const Text('حذف جهة الطوارئ'),
        content: Text('هل تريد حذف ${c.name} (${c.phoneNumber})؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(true),
            style: TextButton.styleFrom(foregroundColor: HancrColors.error),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      bloc.add(SosContactRemoved(c.id));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Info Card
// ─────────────────────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  const _InfoCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: HancrColors.brandGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.shield_outlined, color: Colors.white, size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'سلامتك أولويتنا',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'عند الضغط على زر الطوارئ أثناء الرحلة، نُرسل رسالة فورية بموقعك وتفاصيل السيارة لجهات الطوارئ المسجَّلة.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Tile
// ─────────────────────────────────────────────────────────────────────────────

class _ContactTile extends StatelessWidget {
  final EmergencyContactModel contact;
  final VoidCallback onDelete;

  const _ContactTile({required this.contact, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return HancrCard(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: HancrColors.violetLight,
          child: Text(
            contact.name.isNotEmpty ? contact.name[0] : '?',
            style: const TextStyle(
              color: HancrColors.violetDeep,
              fontWeight: FontWeight.w700,
              fontSize: 18,
            ),
          ),
        ),
        title: Text(
          contact.name,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              contact.phoneNumber,
              style: const TextStyle(
                color: HancrColors.textSecondary,
                fontSize: 12,
                fontFamily: 'monospace',
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                _MiniChip(
                  label: contact.relation.label,
                  color: HancrColors.violetLight,
                  textColor: HancrColors.violetDeep,
                ),
                if (contact.autoShareTrips) ...[
                  const SizedBox(width: 6),
                  const _MiniChip(
                    label: '📍 مشاركة تلقائية',
                    color: Color(0xFFD1FAE5),
                    textColor: HancrColors.success,
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: HancrColors.error),
          onPressed: onDelete,
        ),
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;

  const _MiniChip({
    required this.label,
    required this.color,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyContacts extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyContacts({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          const Icon(Icons.contact_phone_outlined,
              size: 64, color: HancrColors.textHint),
          const SizedBox(height: 12),
          const Text(
            'لم تضف جهات طوارئ بعد',
            style: TextStyle(
              color: HancrColors.textSecondary,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'أضف الأشخاص الذين تثق بهم ليتم إشعارهم في حالات الطوارئ',
            style: TextStyle(color: HancrColors.textHint, fontSize: 12),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          HancrButton.primary(
            label: 'إضافة جهة طوارئ',
            onPressed: onAdd,
            icon: Icons.add_rounded,
            fullWidth: false,
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 64, color: HancrColors.error),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: HancrColors.textSecondary),
            ),
            const SizedBox(height: 16),
            HancrButton.primary(
              label: 'إعادة المحاولة',
              onPressed: onRetry,
              fullWidth: false,
            ),
          ],
        ),
      ),
    );
  }
}
