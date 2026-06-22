import 'package:flutter/material.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraRidePicker — bottom sheet لاختيار نوع الرحلة.
/// مستوحى من تصميمك: عناوين tracking في الأعلى + قائمة سيارات
/// + الـ selected له orange glow ring + سعر يمين كل صف.
class AuroraRidePicker extends StatefulWidget {
  final List<RideOption> options;
  final ValueChanged<RideOption>? onConfirm;

  const AuroraRidePicker({
    required this.options,
    this.onConfirm,
    super.key,
  });

  @override
  State<AuroraRidePicker> createState() => _AuroraRidePickerState();
}

class _AuroraRidePickerState extends State<AuroraRidePicker> {
  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.obsidian,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ─── Drag handle ───
          Container(
            margin: const EdgeInsets.symmetric(vertical: AuroraSpacing.md),
            width: 48,
            height: 4,
            decoration: BoxDecoration(
              color: AuroraColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // ─── Title ───
          Text('اختر رحلتك', style: AuroraText.titleMedium),

          const SizedBox(height: AuroraSpacing.md),
          Divider(color: AuroraColors.divider, height: 1),
          const SizedBox(height: AuroraSpacing.md),

          // ─── Options list ───
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
              itemCount: widget.options.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AuroraSpacing.md),
              itemBuilder: (_, i) => _rideRow(widget.options[i], i),
            ),
          ),

          const SizedBox(height: AuroraSpacing.md),

          // ─── Payment row ───
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 24,
                  decoration: BoxDecoration(
                    color: AuroraColors.smoke,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(Icons.credit_card,
                      size: 14, color: AuroraColors.textSecondary),
                ),
                const SizedBox(width: AuroraSpacing.md),
                Expanded(
                  child: Text(
                    '•••• 3008 (Visa)',
                    style: AuroraText.bodyMedium.copyWith(
                      color: AuroraColors.pearl,
                    ),
                  ),
                ),
                Icon(Icons.chevron_right, color: AuroraColors.textSecondary),
              ],
            ),
          ),

          const SizedBox(height: AuroraSpacing.md),
          Divider(color: AuroraColors.divider, height: 1),

          // ─── Bottom CTA + Schedule ───
          Padding(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            child: Row(
              children: [
                Expanded(
                  child: AuroraButton.primary(
                    label: 'اختر ${widget.options[_selected].name}',
                    onPressed: () =>
                        widget.onConfirm?.call(widget.options[_selected]),
                  ),
                ),
                const SizedBox(width: AuroraSpacing.sm),
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AuroraColors.ash,
                    borderRadius: BorderRadius.circular(AuroraRadius.md),
                    border: Border.all(color: AuroraColors.border),
                  ),
                  child: Icon(
                    Icons.schedule,
                    color: AuroraColors.ember,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _rideRow(RideOption o, int idx) {
    final isSelected = _selected == idx;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(
          color: isSelected ? AuroraColors.ember : AuroraColors.border,
          width: isSelected ? 2 : 1,
        ),
        boxShadow: isSelected ? AuroraShadows.selectionGlow : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => setState(() => _selected = idx),
          borderRadius: BorderRadius.circular(AuroraRadius.lg),
          child: Padding(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            child: Row(
              children: [
                // Car icon (placeholder للـ 3D illustration)
                Container(
                  width: 64,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AuroraColors.smoke,
                    borderRadius: BorderRadius.circular(AuroraRadius.sm),
                  ),
                  child: Icon(
                    o.icon,
                    color: AuroraColors.ember,
                    size: 32,
                  ),
                ),
                const SizedBox(width: AuroraSpacing.md),
                // Name + ETA
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(o.name, style: AuroraText.titleSmall),
                          if (o.passengers > 0) ...[
                            const SizedBox(width: AuroraSpacing.sm),
                            Icon(Icons.person,
                                size: 14, color: AuroraColors.textSecondary),
                            const SizedBox(width: 2),
                            Text('${o.passengers}',
                                style: AuroraText.bodySmall.copyWith(
                                  color: AuroraColors.textSecondary,
                                )),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${o.time} • ${o.etaMinutes} د',
                        style: AuroraText.bodySmall,
                      ),
                      if (o.fasterTag) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: AuroraSpacing.sm, vertical: 2),
                          decoration: BoxDecoration(
                            gradient: AuroraColors.emberGradient,
                            borderRadius:
                                BorderRadius.circular(AuroraRadius.xs),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.bolt,
                                  size: 12, color: AuroraColors.pearl),
                              const SizedBox(width: 2),
                              Text(
                                'أسرع',
                                style: AuroraText.caption.copyWith(
                                  color: AuroraColors.pearl,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                // Price
                Text(
                  o.priceLabel,
                  style: AuroraText.titleMedium.copyWith(
                    color: isSelected ? AuroraColors.ember : AuroraColors.pearl,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class RideOption {
  final String name;
  final String time;
  final int etaMinutes;
  final int passengers;
  final String priceLabel;
  final IconData icon;
  final bool fasterTag;

  const RideOption({
    required this.name,
    required this.time,
    required this.etaMinutes,
    required this.passengers,
    required this.priceLabel,
    this.icon = Icons.directions_car,
    this.fasterTag = false,
  });
}
