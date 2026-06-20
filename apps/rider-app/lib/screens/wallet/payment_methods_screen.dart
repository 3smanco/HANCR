import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/graphql/gql/company_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/services/storage_service.dart';
import '../../core/widgets/aurora/aurora.dart';

/// طرق الدفع — خيارات حقيقية من PaymentMode (نقد/محفظة/شركة) مع تحديد
/// الافتراضي. إضافة بطاقة معلّقة على تفعيل بوابة الدفع (owner action).
class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  String _default = 'Cash';
  double? _walletBalance;
  String _currency = 'SAR';
  Map<String, dynamic>? _company;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _default = await StorageService.getPaymentDefault() ?? 'Cash';
    try {
      final client = await GraphQLClientManager.get();
      final wallet = await client.query(QueryOptions(
        document: gql(walletQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final w = wallet.data?['myWallet'] as Map<String, dynamic>?;
      if (w != null) {
        _walletBalance = (w['balance'] as num?)?.toDouble();
        _currency = w['currency'] as String? ?? 'SAR';
      }
      final comp = await client.query(QueryOptions(
        document: gql(myCompanyQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      _company = comp.data?['myCompany'] as Map<String, dynamic>?;
    } catch (_) {
      // تجاهل — تبقى الخيارات الأساسية
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _setDefault(String mode) async {
    setState(() => _default = mode);
    await StorageService.savePaymentDefault(mode);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('paymentMethods'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: _loading
              ? Center(
                  child: CircularProgressIndicator(color: AuroraColors.ember))
              : ListView(
                  padding: const EdgeInsets.all(AuroraSpacing.lg),
                  children: [
                    _method('Cash', Icons.payments_outlined, tr('payCash'),
                        tr('payCashSub')),
                    _method(
                        'Wallet',
                        Icons.account_balance_wallet_outlined,
                        tr('payWallet'),
                        _walletBalance == null
                            ? tr('payWalletSub')
                            : '${_walletBalance!.toStringAsFixed(2)} $_currency'),
                    if (_company != null)
                      _method(
                          'Company',
                          Icons.business_center_outlined,
                          _company?['companyName'] as String? ??
                              tr('payCompany'),
                          tr('payCompanySub')),
                    const SizedBox(height: AuroraSpacing.md),
                    AuroraListRow(
                      icon: Icons.add_card,
                      title: tr('addCard'),
                      subtitle: tr('addCardSoon'),
                      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(tr('addCardSoon')),
                          backgroundColor: AuroraColors.smoke,
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _method(String mode, IconData icon, String title, String sub) {
    final sel = _default == mode;
    return GestureDetector(
      onTap: () => _setDefault(mode),
      child: Container(
        margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        decoration: BoxDecoration(
          color: sel ? AuroraColors.smoke : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
              color: sel ? AuroraColors.ember : AuroraColors.border,
              width: sel ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: AuroraColors.ember, size: 24),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(sub, style: AuroraText.bodySmall),
                ],
              ),
            ),
            if (sel)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AuroraColors.ember.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                ),
                child: Text(tr('defaultLabel'),
                    style:
                        AuroraText.caption.copyWith(color: AuroraColors.ember)),
              ),
          ],
        ),
      ),
    );
  }
}
