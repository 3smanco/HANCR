import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// TripEndScreen — تقييم الرحلة المنتهية + بقشيش اختياري
///
/// Returns: `Map\<String, dynamic\>` بـ:
///   - rating: int 1-5
///   - tags: List of strings
///   - comment: String?
///   - tip: double
/// أو `null` إذا تم التخطّي.
class TripEndScreen extends StatefulWidget {
  const TripEndScreen({
    required this.driverName,
    required this.fareAmount,
    this.driverPhotoUrl,
    this.vehicleLabel,
    super.key,
  });

  final String driverName;
  final double fareAmount;
  final String? driverPhotoUrl;
  final String? vehicleLabel; // e.g., "Toyota Camry • AX 451"

  @override
  State<TripEndScreen> createState() => _TripEndScreenState();
}

class _TripEndScreenState extends State<TripEndScreen> {
  int _rating = 0;
  final Set<String> _selectedTags = {};
  final TextEditingController _commentCtrl = TextEditingController();
  double _tip = 0;
  bool _submitting = false;

  static const _positiveTags = [
    'قيادة آمنة',
    'سيارة نظيفة',
    'في الوقت المحدّد',
    'خدمة ممتازة',
    'محادثة لطيفة',
    'مسار مثالي',
  ];

  static const _negativeTags = [
    'وصول متأخر',
    'سيارة غير نظيفة',
    'قيادة سريعة',
    'مسار غير مثالي',
    'عدم احترام',
    'مشاكل في الجهاز',
  ];

  static const _tipOptions = [5.0, 10.0, 15.0];

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('قيّم رحلتك أولاً')),
      );
      return;
    }
    setState(() => _submitting = true);
    Navigator.of(context).pop({
      'rating': _rating,
      'tags': _selectedTags.toList(),
      'comment': _commentCtrl.text.trim(),
      'tip': _tip,
    });
  }

  void _skip() {
    Navigator.of(context).pop();
  }

  List<String> get _availableTags =>
      _rating >= 4 ? _positiveTags : _negativeTags;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        leading: const SizedBox.shrink(),
        actions: [
          TextButton(
            onPressed: _skip,
            child: const Text(
              'تخطّي',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: HancrColors.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: HancrSpacing.sm),
        ],
        title: const Text('تقييم الرحلة'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(HancrSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Hero: driver card ──
            HancrCard.elevated(
              child: Column(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: HancrColors.violetGradient,
                      border: Border.all(color: Colors.white, width: 4),
                      boxShadow: HancrShadows.violetGlow,
                    ),
                    child: widget.driverPhotoUrl != null
                        ? ClipOval(
                            child: Image.network(
                              widget.driverPhotoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _initialAvatar(),
                            ),
                          )
                        : _initialAvatar(),
                  ),
                  const SizedBox(height: HancrSpacing.md),
                  Text(
                    'كيف كانت رحلتك مع ${widget.driverName}؟',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: HancrColors.textPrimary,
                    ),
                  ),
                  if (widget.vehicleLabel != null) ...[
                    const SizedBox(height: HancrSpacing.xs),
                    Text(
                      widget.vehicleLabel!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: HancrColors.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: HancrSpacing.lg),
                  // Stars
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (i) {
                      final filled = i < _rating;
                      return GestureDetector(
                        onTap: () => setState(() {
                          _rating = i + 1;
                          _selectedTags.clear();
                        }),
                        child: AnimatedScale(
                          duration: const Duration(milliseconds: 200),
                          scale: filled ? 1.05 : 1,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              filled
                                  ? Icons.star_rounded
                                  : Icons.star_outline_rounded,
                              size: 44,
                              color: filled
                                  ? const Color(0xFFFBBF24)
                                  : HancrColors.borderStrong,
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                  if (_rating > 0) ...[
                    const SizedBox(height: HancrSpacing.sm),
                    Text(
                      _ratingLabel(_rating),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _rating >= 4
                            ? HancrColors.success
                            : HancrColors.warning,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: HancrSpacing.lg),

            // ── Tags ──
            if (_rating > 0) ...[
              Text(
                _rating >= 4 ? 'ما الذي أعجبك؟' : 'ساعدنا في التحسين',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: HancrColors.textPrimary,
                ),
              ),
              const SizedBox(height: HancrSpacing.md),
              Wrap(
                spacing: HancrSpacing.sm,
                runSpacing: HancrSpacing.sm,
                children: _availableTags.map((tag) {
                  final selected = _selectedTags.contains(tag);
                  return GestureDetector(
                    onTap: () => setState(() {
                      if (selected) {
                        _selectedTags.remove(tag);
                      } else {
                        _selectedTags.add(tag);
                      }
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                        horizontal: HancrSpacing.md,
                        vertical: HancrSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: selected
                            ? HancrColors.violetLight
                            : HancrColors.surfaceMute,
                        borderRadius: BorderRadius.circular(HancrRadius.pill),
                        border: Border.all(
                          color: selected
                              ? HancrColors.violet
                              : Colors.transparent,
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (selected) ...[
                            Icon(
                              Icons.check_rounded,
                              size: 14,
                              color: HancrColors.violetDeep,
                            ),
                            const SizedBox(width: 4),
                          ],
                          Text(
                            tag,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: selected
                                  ? HancrColors.violetDeep
                                  : HancrColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: HancrSpacing.lg),

              // Comment (optional)
              TextField(
                controller: _commentCtrl,
                maxLines: 3,
                maxLength: 200,
                decoration: InputDecoration(
                  hintText: _rating >= 4
                      ? 'شارك تجربتك (اختياري)'
                      : 'أخبرنا بالتفاصيل (اختياري)',
                  counterText: '',
                ),
              ),
              const SizedBox(height: HancrSpacing.lg),

              // Tip (only positive ratings)
              if (_rating >= 4) ...[
                Row(
                  children: [
                    Icon(
                      Icons.volunteer_activism_rounded,
                      size: 18,
                      color: HancrColors.violet,
                    ),
                    const SizedBox(width: HancrSpacing.sm),
                    const Text(
                      'بقشيش للسائق',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: HancrColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    if (_tip > 0)
                      HancrBadge.success(
                        '+${_tip.toStringAsFixed(0)} ر.س',
                      ),
                  ],
                ),
                const SizedBox(height: HancrSpacing.sm),
                const Text(
                  '100% من البقشيش يذهب للسائق مباشرة',
                  style: TextStyle(
                    fontSize: 12,
                    color: HancrColors.textSecondary,
                  ),
                ),
                const SizedBox(height: HancrSpacing.md),
                Row(
                  children: [
                    ..._tipOptions.map((amount) {
                      final selected = _tip == amount;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(
                            right: HancrSpacing.sm,
                          ),
                          child: _TipChip(
                            label: '${amount.toStringAsFixed(0)} ر.س',
                            selected: selected,
                            onTap: () => setState(
                              () => _tip = selected ? 0 : amount,
                            ),
                          ),
                        ),
                      );
                    }),
                    Expanded(
                      child: _TipChip(
                        label: 'مخصّص',
                        selected: false,
                        onTap: () async {
                          final value = await _showCustomTipDialog();
                          if (value != null) setState(() => _tip = value);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: HancrSpacing.lg),
              ],
            ],

            // ── Fare summary ──
            HancrCard(
              child: Column(
                children: [
                  _row('المبلغ المدفوع', '${widget.fareAmount.toStringAsFixed(2)} ر.س'),
                  if (_tip > 0) ...[
                    const SizedBox(height: HancrSpacing.xs),
                    _row('بقشيش', '+${_tip.toStringAsFixed(2)} ر.س',
                        accent: HancrColors.success),
                  ],
                  const Divider(height: HancrSpacing.lg),
                  _row(
                    'الإجمالي',
                    '${(widget.fareAmount + _tip).toStringAsFixed(2)} ر.س',
                    bold: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: HancrSpacing.xl),

            // ── Submit ──
            HancrButton.primary(
              label: 'إرسال التقييم',
              icon: Icons.send_rounded,
              loading: _submitting,
              onPressed: _submit,
            ),
            const SizedBox(height: HancrSpacing.md),
          ],
        ),
      ),
    );
  }

  Widget _initialAvatar() {
    final initial = widget.driverName.isNotEmpty
        ? widget.driverName[0].toUpperCase()
        : 'H';
    return Center(
      child: Text(
        initial,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 32,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _row(String label, String value,
      {bool bold = false, Color? accent}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
            color: bold ? HancrColors.textPrimary : HancrColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: bold ? 16 : 14,
            fontWeight: FontWeight.w800,
            color: accent ?? HancrColors.textPrimary,
          ),
        ),
      ],
    );
  }

  String _ratingLabel(int rating) {
    switch (rating) {
      case 5:
        return 'ممتاز ⭐';
      case 4:
        return 'جيد جداً';
      case 3:
        return 'مقبول';
      case 2:
        return 'ضعيف';
      case 1:
        return 'سيء';
    }
    return '';
  }

  Future<double?> _showCustomTipDialog() async {
    final ctrl = TextEditingController();
    return showDialog<double>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('بقشيش مخصّص'),
          content: TextField(
            controller: ctrl,
            keyboardType: TextInputType.number,
            autofocus: true,
            decoration: const InputDecoration(
              hintText: 'المبلغ بالريال',
              prefixIcon: Icon(Icons.payments_rounded),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () {
                final v = double.tryParse(ctrl.text);
                Navigator.pop(ctx, v);
              },
              child: const Text('تأكيد'),
            ),
          ],
        );
      },
    );
  }
}

class _TipChip extends StatelessWidget {
  const _TipChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 48,
      decoration: BoxDecoration(
        color: selected ? HancrColors.violet : HancrColors.surfaceMute,
        borderRadius: BorderRadius.circular(HancrRadius.md),
        border: Border.all(
          color: selected ? HancrColors.violet : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(HancrRadius.md),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: selected ? Colors.white : HancrColors.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
