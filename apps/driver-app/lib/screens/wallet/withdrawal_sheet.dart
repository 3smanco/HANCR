import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/wallet/wallet_bloc.dart';
import '../../blocs/wallet/wallet_event.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// WithdrawalSheet — bottom-sheet لطلب سحب رصيد.
///
/// مراحل:
///  1. اختيار نسبة سريعة (25%/50%/الكل) أو إدخال يدوي
///  2. التحقق من الحد الأدنى (50) والحد الأقصى (10000) والرصيد
///  3. تأكيد → إرسال WalletWithdrawalRequested
class WithdrawalSheet extends StatefulWidget {
  final double availableBalance;
  final String currency;

  const WithdrawalSheet({
    required this.availableBalance,
    required this.currency,
    super.key,
  });

  @override
  State<WithdrawalSheet> createState() => _WithdrawalSheetState();
}

class _WithdrawalSheetState extends State<WithdrawalSheet> {
  static const double minWithdrawal = 50;
  static const double maxWithdrawal = 10000;

  double? _selectedAmount;
  final _customController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // افتراضياً اختر "كل الرصيد" إن كان ضمن الحدود
    if (widget.availableBalance >= minWithdrawal) {
      _selectedAmount = widget.availableBalance > maxWithdrawal
          ? maxWithdrawal
          : widget.availableBalance;
    }
  }

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  double? get _effectiveAmount {
    final custom = double.tryParse(_customController.text);
    return custom != null && custom > 0 ? custom : _selectedAmount;
  }

  String? _validate(double? amount) {
    if (amount == null || amount <= 0) return 'أدخل مبلغاً صحيحاً';
    if (amount < minWithdrawal) {
      return 'الحد الأدنى للسحب: ${minWithdrawal.toStringAsFixed(0)} ${widget.currency}';
    }
    if (amount > maxWithdrawal) {
      return 'الحد الأقصى للسحب: ${maxWithdrawal.toStringAsFixed(0)} ${widget.currency}';
    }
    if (amount > widget.availableBalance) {
      return 'الرصيد المتاح: ${widget.availableBalance.toStringAsFixed(2)} ${widget.currency}';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    final padding = MediaQuery.of(context).viewInsets.bottom;
    final amount = _effectiveAmount;
    final error = amount != null ? _validate(amount) : null;
    final isValid = error == null && amount != null;

    return Container(
      decoration: const BoxDecoration(
        color: HancrColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(bottom: padding),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: HancrColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'طلب سحب',
                style: TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'الرصيد المتاح: ${fmt.format(widget.availableBalance)} ${widget.currency}',
                style: const TextStyle(
                  color: HancrColors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),

              // ───── Quick percent buttons ─────
              const Text(
                'اختر نسبة من رصيدك',
                style: TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _PercentButton(
                      label: '25%',
                      onTap: () => _selectPercent(0.25),
                      selected: _isSelected(0.25),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _PercentButton(
                      label: '50%',
                      onTap: () => _selectPercent(0.50),
                      selected: _isSelected(0.50),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _PercentButton(
                      label: 'الكل',
                      onTap: () => _selectPercent(1.0),
                      selected: _isSelected(1.0),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // ───── Custom amount ─────
              TextField(
                controller: _customController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => setState(() {
                  _selectedAmount = null;
                }),
                decoration: InputDecoration(
                  labelText: 'أو أدخل مبلغاً مخصصاً',
                  prefixIcon: const Icon(Icons.edit_outlined, size: 18),
                  suffix: Text(widget.currency),
                  errorText: error,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ───── Info card ─────
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: HancrColors.infoBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline,
                        color: HancrColors.info, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'سيُحوَّل المبلغ إلى حسابك البنكي المسجَّل خلال 1-3 أيام عمل بعد موافقة الإدارة. سيُحجز المبلغ من رصيدك فور تقديم الطلب.',
                        style: TextStyle(
                          color: HancrColors.textPrimary,
                          fontSize: 12,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              HancrButton.primary(
                label: amount != null && error == null
                    ? 'اطلب سحب ${fmt.format(amount)} ${widget.currency}'
                    : 'اختر مبلغ السحب',
                onPressed: isValid
                    ? () {
                        context.read<WalletBloc>().add(
                              WalletWithdrawalRequested(amount),
                            );
                        Navigator.of(context).pop();
                      }
                    : null,
                icon: Icons.account_balance_rounded,
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'الحدّ الأدنى ${minWithdrawal.toStringAsFixed(0)} ${widget.currency} • الحدّ الأقصى ${maxWithdrawal.toStringAsFixed(0)} ${widget.currency}',
                  style: const TextStyle(
                    color: HancrColors.textHint,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectPercent(double pct) {
    final raw = widget.availableBalance * pct;
    final capped = raw > maxWithdrawal ? maxWithdrawal : raw;
    setState(() {
      _selectedAmount = capped;
      _customController.clear();
    });
  }

  bool _isSelected(double pct) {
    if (_customController.text.isNotEmpty) return false;
    if (_selectedAmount == null) return false;
    final expected = widget.availableBalance * pct;
    final capped = expected > maxWithdrawal ? maxWithdrawal : expected;
    return (_selectedAmount! - capped).abs() < 0.01;
  }
}

class _PercentButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _PercentButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? HancrColors.violet : HancrColors.surfaceMute,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? HancrColors.violet : HancrColors.border,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : HancrColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
