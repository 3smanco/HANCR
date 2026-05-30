import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/wallet/wallet_bloc.dart';
import '../../blocs/wallet/wallet_event.dart';
import '../../core/models/wallet_model.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraAddFundsSheet — مستوحاة من تصميمك "Add Funds":
///  - زر إغلاق دائري + Balance pill في الأعلى
///  - عنوان كبير "Add Funds"
///  - حقل مبلغ ضخم مع orange ring
///  - 3 quick amount buttons
///  - Payment method selector
///  - Add funds button (primary glow)
class AuroraAddFundsSheet extends StatefulWidget {
  final String currency;
  final double currentBalance;

  const AuroraAddFundsSheet({
    required this.currency,
    required this.currentBalance,
    super.key,
  });

  @override
  State<AuroraAddFundsSheet> createState() => _AuroraAddFundsSheetState();
}

class _AuroraAddFundsSheetState extends State<AuroraAddFundsSheet> {
  static const _quick = [50, 100, 200];

  final _ctrl = TextEditingController(text: '25');
  PaymentGateway _gateway = PaymentGateway.hyperPay;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  double get _amount => double.tryParse(_ctrl.text) ?? 0;
  bool get _isValid => _amount >= 25 && _amount <= 5000;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        showBottomHalo: true,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.xxl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ─── Top row ───
                const SizedBox(height: AuroraSpacing.md),
                _topBar(),

                const SizedBox(height: AuroraSpacing.xxl),

                // ─── Title ───
                Text('إضافة رصيد', style: AuroraText.displayMedium),
                const SizedBox(height: AuroraSpacing.sm),
                Text(
                  'كم تريد أن تُضيف إلى محفظتك؟',
                  style: AuroraText.bodyLarge.copyWith(
                    color: AuroraColors.textSecondary,
                  ),
                ),

                const SizedBox(height: AuroraSpacing.xl),

                // ─── Amount input مع orange ring ───
                _amountInput(),

                const SizedBox(height: AuroraSpacing.sm),

                // ─── Progress hint ───
                _progressHint(),

                const SizedBox(height: AuroraSpacing.sm),
                Text(
                  'أدخل مبلغاً بين 25 و 5,000 ${widget.currency}',
                  style: AuroraText.bodySmall,
                ),

                const SizedBox(height: AuroraSpacing.lg),

                // ─── Quick amounts ───
                Row(
                  children: _quick
                      .map((q) => Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(
                                left: q == _quick.first ? 0 : AuroraSpacing.sm,
                              ),
                              child: _quickButton(q.toDouble()),
                            ),
                          ))
                      .toList(),
                ),

                const Spacer(),

                // ─── Terms ───
                TextButton(
                  onPressed: () => showDialog<void>(
                    context: context,
                    builder: (_) => AlertDialog(
                      backgroundColor: AuroraColors.ash,
                      title: Text('الشروط والأحكام',
                          style: AuroraText.titleSmall),
                      content: Text(
                        'يُضاف الرصيد إلى محفظتك فوراً بعد تأكيد الدفع. الرصيد غير قابل للاسترداد نقداً ويُستخدم في رحلات HANCR فقط.',
                        style: AuroraText.bodySmall,
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: Text('حسناً',
                              style: TextStyle(color: AuroraColors.ember)),
                        ),
                      ],
                    ),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AuroraColors.textSecondary,
                    alignment: Alignment.centerLeft,
                  ),
                  child: const Text(
                    'تطبَّق الشروط',
                    style: TextStyle(decoration: TextDecoration.underline),
                  ),
                ),

                const SizedBox(height: AuroraSpacing.md),

                // ─── Payment method row ───
                _paymentRow(),

                const SizedBox(height: AuroraSpacing.md),

                // ─── CTA ───
                AuroraButton.primary(
                  label: 'إضافة الرصيد',
                  onPressed: _isValid ? _confirm : null,
                ),

                const SizedBox(height: AuroraSpacing.md),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _topBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Close button
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            shape: BoxShape.circle,
            border: Border.all(color: AuroraColors.border),
            boxShadow: AuroraShadows.iconGlow,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => Navigator.of(context).pop(),
              customBorder: const CircleBorder(),
              child: const Icon(
                Icons.close,
                color: AuroraColors.ember,
                size: 18,
              ),
            ),
          ),
        ),

        // Balance pill
        Container(
          padding: const EdgeInsets.symmetric(
              horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.pill),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  gradient: AuroraColors.emberGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.attach_money,
                    size: 14, color: AuroraColors.pearl),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                'الرصيد: ${widget.currentBalance.toStringAsFixed(2)} ${widget.currency}',
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _amountInput() {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.ember, width: 1.5),
        boxShadow: AuroraShadows.iconGlow,
      ),
      padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
      child: Row(
        children: [
          Text(
            widget.currency,
            style: AuroraText.displayMedium.copyWith(
              color: AuroraColors.ember,
              fontSize: 28,
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: TextField(
              controller: _ctrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d{0,5}(\.\d{0,2})?')),
              ],
              onChanged: (_) => setState(() {}),
              textAlign: TextAlign.center,
              style: AuroraText.displayMedium.copyWith(
                color: AuroraColors.pearl,
                fontSize: 34,
              ),
              decoration: const InputDecoration(
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _progressHint() {
    // شريط تقدُّم بسيط (5% من المبلغ مقابل max 500)
    final pct = (_amount / 500).clamp(0.0, 1.0);
    return Container(
      height: 4,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(2),
      ),
      child: FractionallySizedBox(
        widthFactor: pct,
        alignment: Alignment.centerLeft,
        child: Container(
          decoration: BoxDecoration(
            gradient: AuroraColors.emberGradient,
            borderRadius: BorderRadius.circular(2),
            boxShadow: AuroraShadows.iconGlow,
          ),
        ),
      ),
    );
  }

  Widget _quickButton(double value) {
    final selected = _amount == value;
    return GestureDetector(
      onTap: () => setState(() => _ctrl.text = value.toStringAsFixed(0)),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 88,
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
            color: selected ? AuroraColors.ember : AuroraColors.border,
            width: selected ? 1.5 : 1,
          ),
          boxShadow: selected ? AuroraShadows.iconGlow : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: AuroraColors.emberGradient,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.attach_money,
                size: 16,
                color: AuroraColors.pearl,
              ),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            Text(
              '${widget.currency} ${value.toStringAsFixed(0)}',
              style: AuroraText.titleSmall.copyWith(
                color: AuroraColors.pearl,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _paymentRow() {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 24,
            decoration: BoxDecoration(
              gradient: AuroraColors.emberGradient,
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Center(
              child: Icon(Icons.credit_card,
                  color: AuroraColors.pearl, size: 14),
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Text(
              _gateway.label,
              style: AuroraText.bodyMedium.copyWith(
                color: AuroraColors.pearl,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Icon(Icons.chevron_right, color: AuroraColors.textSecondary),
        ],
      ),
    );
  }

  void _confirm() {
    context.read<WalletBloc>().add(
          WalletRechargeStarted(
            amount: _amount,
            gateway: _gateway,
          ),
        );
    Navigator.of(context).pop();
  }
}
