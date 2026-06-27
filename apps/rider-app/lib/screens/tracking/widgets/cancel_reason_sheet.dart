import 'package:flutter/material.dart';

import '../../../core/i18n/app_localization.dart';
import '../../../core/theme/aurora_theme.dart';
import '../../../core/widgets/aurora/aurora_button.dart';

/// خيار سبب إلغاء: code ثابت يُخزَّن في الخادم + مفتاح ترجمة للعرض.
class _Reason {
  const _Reason(this.code, this.trKey);
  final String code;
  final String trKey;
}

const _reasons = <_Reason>[
  _Reason('waited_too_long', 'cancelReasonWaited'),
  _Reason('changed_mind', 'cancelReasonChangedMind'),
  _Reason('driver_asked', 'cancelReasonDriverAsked'),
  _Reason('wrong_pickup', 'cancelReasonWrongPickup'),
  _Reason('found_other', 'cancelReasonFoundOther'),
  _Reason('other', 'cancelReasonOther'),
];

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  CancelReasonSheet — ورقة سبب الإلغاء (Phase E)                ║
/// ║                                                               ║
/// ║  تعرض أسباب الإلغاء + تحذير الرسم عند إسناد السائق، وتُعيد       ║
/// ║  الـ code المختار عند التأكيد (أو '' بلا سبب)، و null عند        ║
/// ║  التراجع (إغلاق دون تأكيد).                                     ║
/// ╚══════════════════════════════════════════════════════════════╝
class CancelReasonSheet extends StatefulWidget {
  const CancelReasonSheet({required this.feeApplies, super.key});

  /// هل سيُطبَّق رسم إلغاء (السائق مُسنَد/وصل)؟
  final bool feeApplies;

  /// يعرض الورقة ويُعيد سبب الإلغاء المختار (code) أو '' أو null عند التراجع.
  static Future<String?> show(BuildContext context, {required bool feeApplies}) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => CancelReasonSheet(feeApplies: feeApplies),
    );
  }

  @override
  State<CancelReasonSheet> createState() => _CancelReasonSheetState();
}

class _CancelReasonSheetState extends State<CancelReasonSheet> {
  String? _selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
        border: Border(top: BorderSide(color: AuroraColors.borderGlow)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AuroraColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AuroraSpacing.lg),
              Text(tr('cancelReasonTitle'), style: AuroraText.titleMedium),
              const SizedBox(height: AuroraSpacing.md),

              // الأسباب
              ..._reasons.map(_reasonTile),

              if (widget.feeApplies) ...[
                const SizedBox(height: AuroraSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AuroraSpacing.md),
                  decoration: BoxDecoration(
                    color: AuroraColors.warningBg,
                    borderRadius: BorderRadius.circular(AuroraRadius.md),
                    border: Border.all(
                        color: AuroraColors.warning.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded,
                          size: 18, color: AuroraColors.warning),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(
                        child: Text(
                          tr('cancelFeeWarning'),
                          style: AuroraText.bodySmall
                              .copyWith(color: AuroraColors.textPrimary),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: AuroraSpacing.lg),
              AuroraButton.danger(
                label: tr('confirmCancel'),
                onPressed: () => Navigator.of(context).pop(_selected ?? ''),
                icon: Icons.close_rounded,
              ),
              const SizedBox(height: AuroraSpacing.sm),
              AuroraButton.ghost(
                label: tr('keepRide'),
                onPressed: () => Navigator.of(context).pop(),
                fullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _reasonTile(_Reason r) {
    final selected = _selected == r.code;
    return Padding(
      padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          onTap: () => setState(() => _selected = r.code),
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: AuroraSpacing.md, vertical: AuroraSpacing.md),
            decoration: BoxDecoration(
              color: selected ? AuroraColors.ash : AuroraColors.coal,
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              border: Border.all(
                color: selected ? AuroraColors.ember : AuroraColors.border,
                width: selected ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  selected
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
                  size: 20,
                  color: selected ? AuroraColors.ember : AuroraColors.textHint,
                ),
                const SizedBox(width: AuroraSpacing.md),
                Expanded(
                  child: Text(tr(r.trKey), style: AuroraText.bodyLarge),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
