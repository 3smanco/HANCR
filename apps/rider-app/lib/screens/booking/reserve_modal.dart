import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AdvancedReserveModal — مودال حجز مسبق كامل الشاشة (Uber Reserve).
///
/// منتقي تاريخ/وقت Cupertino (بكرات) + تحقّق الساعتين + بطاقة سياسة الإلغاء
/// + زر "Reserve [Category]". يُعيد [DateTime] المختار عبر Navigator.pop،
/// ويتولّى المُستدعي إرسال الطلب (scheduledAt) والتوجيه لتبويب القادمة.
class AdvancedReserveModal extends StatefulWidget {
  /// اسم الفئة المختارة — يظهر في زر التأكيد ("Reserve Economy").
  final String categoryName;
  const AdvancedReserveModal({required this.categoryName, super.key});

  /// يفتح المودال ويُعيد الموعد المختار (أو null عند الإلغاء).
  static Future<DateTime?> show(BuildContext context, String categoryName) {
    return Navigator.of(context).push<DateTime>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => AdvancedReserveModal(categoryName: categoryName),
      ),
    );
  }

  @override
  State<AdvancedReserveModal> createState() => _AdvancedReserveModalState();
}

class _AdvancedReserveModalState extends State<AdvancedReserveModal> {
  static const _minLeadMinutes = 120; // ساعتان

  late DateTime _selected;

  @override
  void initState() {
    super.initState();
    // الافتراضي: الآن + ساعتين، مُقرَّب لأعلى لأقرب 5 دقائق.
    final base = DateTime.now().add(const Duration(minutes: _minLeadMinutes));
    final rounded = base.add(Duration(minutes: (5 - base.minute % 5) % 5));
    _selected = rounded;
  }

  bool get _isValid =>
      _selected.difference(DateTime.now()).inMinutes >= _minLeadMinutes;

  @override
  Widget build(BuildContext context) {
    final df = DateFormat(
        'EEEE d MMMM • h:mm a', LocaleController.instance.value.languageCode);
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: SafeArea(
        child: Column(
          children: [
            // ── الترويسة ──
            Padding(
              padding: const EdgeInsets.fromLTRB(AuroraSpacing.sm,
                  AuroraSpacing.sm, AuroraSpacing.lg, AuroraSpacing.sm),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.close, color: AuroraColors.pearl),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  Expanded(
                    child: Text(
                      tr('reserveRide'),
                      textAlign: TextAlign.center,
                      style: AuroraText.titleMedium,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Divider(color: AuroraColors.divider, height: 1),

            // ── ملخّص الموعد المختار ──
            Padding(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              child: Text(
                df.format(_selected),
                textAlign: TextAlign.center,
                style: AuroraText.titleLarge.copyWith(color: AuroraColors.ember),
              ),
            ),

            // ── منتقي البكرات (Cupertino) ──
            Expanded(
              child: CupertinoTheme(
                data: CupertinoThemeData(
                  brightness: Brightness.dark,
                  textTheme: CupertinoTextThemeData(
                    dateTimePickerTextStyle:
                        TextStyle(color: AuroraColors.pearl, fontSize: 20),
                  ),
                ),
                child: CupertinoDatePicker(
                  mode: CupertinoDatePickerMode.dateAndTime,
                  use24hFormat: false,
                  minimumDate:
                      DateTime.now().add(const Duration(minutes: _minLeadMinutes)),
                  maximumDate: DateTime.now().add(const Duration(days: 30)),
                  initialDateTime: _selected,
                  minuteInterval: 5,
                  onDateTimeChanged: (dt) => setState(() => _selected = dt),
                ),
              ),
            ),

            // ── رسالة التحقّق (تظهر فقط عند عدم الصلاحية) ──
            if (!_isValid)
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.xs),
                child: Text(
                  tr('reserveAtLeast2h'),
                  textAlign: TextAlign.center,
                  style: AuroraText.bodySmall.copyWith(color: AuroraColors.danger),
                ),
              ),

            // ── بطاقة سياسة الإلغاء ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
              child: Container(
                padding: const EdgeInsets.all(AuroraSpacing.md),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(color: AuroraColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline,
                        size: 18, color: AuroraColors.textSecondary),
                    const SizedBox(width: AuroraSpacing.sm),
                    Expanded(
                      child: Text(
                        tr('cancellationPolicyText'),
                        style: AuroraText.bodySmall
                            .copyWith(color: AuroraColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── زر التأكيد اللاصق ──
            Padding(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              child: AuroraButton.primary(
                label: '${tr('reservePrefix')} ${widget.categoryName}',
                icon: Icons.event_available,
                onPressed:
                    _isValid ? () => Navigator.of(context).pop(_selected) : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
