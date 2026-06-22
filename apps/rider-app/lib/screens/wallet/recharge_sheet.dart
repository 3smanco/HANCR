import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/wallet/wallet_bloc.dart';
import '../../blocs/wallet/wallet_event.dart';
import '../../core/models/wallet_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// RechargeSheet — bottom-sheet لشحن المحفظة.
///
/// المراحل:
///  1. اختيار مبلغ سريع (50/100/200/500) أو إدخال يدوي
///  2. اختيار بوابة الدفع
///  3. تأكيد → يرسل WalletRechargeStarted → الـ checkout يظهر في الشاشة الرئيسية
class RechargeSheet extends StatefulWidget {
  final String currency;
  const RechargeSheet({required this.currency, super.key});

  @override
  State<RechargeSheet> createState() => _RechargeSheetState();
}

class _RechargeSheetState extends State<RechargeSheet> {
  static const _quickAmounts = [50.0, 100.0, 200.0, 500.0];
  double? _selectedAmount = 100;
  final _customController = TextEditingController();
  PaymentGateway _gateway = PaymentGateway.hyperPay;

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  double? get _effectiveAmount {
    final custom = double.tryParse(_customController.text);
    return custom != null && custom > 0 ? custom : _selectedAmount;
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.of(context).viewInsets.bottom;
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
                'شحن المحفظة',
                style: TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'اختر مبلغ الشحن وبوابة الدفع',
                style: TextStyle(
                  color: HancrColors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),

              // ───── Quick amounts ─────
              Text(
                'مبالغ سريعة (${widget.currency})',
                style: const TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _quickAmounts.map((amt) {
                  final selected =
                      _selectedAmount == amt && _customController.text.isEmpty;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedAmount = amt;
                        _customController.clear();
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 18, vertical: 12),
                      decoration: BoxDecoration(
                        color: selected
                            ? HancrColors.violet
                            : HancrColors.surfaceMute,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected
                              ? HancrColors.violet
                              : HancrColors.border,
                        ),
                      ),
                      child: Text(
                        amt.toStringAsFixed(0),
                        style: TextStyle(
                          color:
                              selected ? Colors.white : HancrColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),

              // ───── Custom amount ─────
              TextField(
                controller: _customController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => setState(() => _selectedAmount = null),
                decoration: InputDecoration(
                  labelText: 'أو أدخل مبلغاً مخصصاً',
                  prefixIcon: const Icon(Icons.edit_outlined, size: 18),
                  suffix: Text(widget.currency),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // ───── Gateway ─────
              const Text(
                'بوابة الدفع',
                style: TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Column(
                children: [
                  _GatewayOption(
                    gateway: PaymentGateway.hyperPay,
                    selected: _gateway == PaymentGateway.hyperPay,
                    onTap: () =>
                        setState(() => _gateway = PaymentGateway.hyperPay),
                  ),
                  _GatewayOption(
                    gateway: PaymentGateway.moyasar,
                    selected: _gateway == PaymentGateway.moyasar,
                    onTap: () =>
                        setState(() => _gateway = PaymentGateway.moyasar),
                  ),
                  _GatewayOption(
                    gateway: PaymentGateway.applePay,
                    selected: _gateway == PaymentGateway.applePay,
                    onTap: () =>
                        setState(() => _gateway = PaymentGateway.applePay),
                  ),
                  _GatewayOption(
                    gateway: PaymentGateway.googlePay,
                    selected: _gateway == PaymentGateway.googlePay,
                    onTap: () =>
                        setState(() => _gateway = PaymentGateway.googlePay),
                  ),
                ],
              ),

              const SizedBox(height: 24),
              HancrButton.primary(
                label: _effectiveAmount != null
                    ? 'اشحن ${_effectiveAmount!.toStringAsFixed(0)} ${widget.currency}'
                    : 'اختر مبلغاً للشحن',
                onPressed: _effectiveAmount != null && _effectiveAmount! > 0
                    ? () {
                        context.read<WalletBloc>().add(
                              WalletRechargeStarted(
                                amount: _effectiveAmount!,
                                gateway: _gateway,
                              ),
                            );
                        Navigator.of(context).pop();
                      }
                    : null,
                icon: Icons.lock_outline,
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'الحد الأقصى للمرة الواحدة: 5,000 ${widget.currency}',
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
}

class _GatewayOption extends StatelessWidget {
  final PaymentGateway gateway;
  final bool selected;
  final VoidCallback onTap;

  const _GatewayOption({
    required this.gateway,
    required this.selected,
    required this.onTap,
  });

  IconData get _icon {
    switch (gateway) {
      case PaymentGateway.applePay:
        return Icons.apple;
      case PaymentGateway.googlePay:
        return Icons.g_mobiledata;
      case PaymentGateway.stripe:
        return Icons.credit_card;
      case PaymentGateway.hyperPay:
      case PaymentGateway.moyasar:
        return Icons.payment;
      default:
        return Icons.account_balance_wallet_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: selected ? HancrColors.violetLight : HancrColors.surfaceMute,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? HancrColors.violet : HancrColors.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                _icon,
                color: selected
                    ? HancrColors.violetDeep
                    : HancrColors.textSecondary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  gateway.label,
                  style: TextStyle(
                    color: HancrColors.textPrimary,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ),
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? HancrColors.violet : HancrColors.textHint,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
