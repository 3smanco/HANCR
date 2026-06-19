import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// تفاصيل CO₂ — تقدير الأثر البيئي لرحلات الراكب.
/// تجميلي/تقديري: يُحتسب من إجمالي الرحلات بمتوسطات معروفة (لا backend).
class Co2DetailsScreen extends StatelessWidget {
  const Co2DetailsScreen({super.key});

  // متوسطات تقديرية: ~8 كم/رحلة، انبعاث سيارة بنزين ~0.18 كجم/كم،
  // ومشاركة الرحلة توفّر ~12% منها (تقدير محافظ).
  static const double _kmPerRide = 8.0;
  static const double _kgPerKm = 0.18;
  static const double _savedFactor = 0.12;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('co2Title'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: BlocBuilder<RiderBloc, RiderState>(
            builder: (context, state) {
              final rides =
                  state is RiderLoaded ? state.rider.totalRides : 0;
              final km = rides * _kmPerRide;
              final totalKg = km * _kgPerKm;
              final savedKg = totalKg * _savedFactor;
              final trees = savedKg / 21.0; // شجرة تمتص ~21 كجم CO₂ سنوياً

              return ListView(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                children: [
                  // بطاقة الإجمالي
                  Container(
                    padding: const EdgeInsets.all(AuroraSpacing.xl),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AuroraColors.success.withValues(alpha: 0.30),
                          AuroraColors.coal,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(AuroraRadius.lg),
                      border: Border.all(
                          color: AuroraColors.success.withValues(alpha: 0.4)),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.eco,
                            color: AuroraColors.success, size: 44),
                        const SizedBox(height: AuroraSpacing.md),
                        Text('${savedKg.toStringAsFixed(1)} ${tr('kg')}',
                            style: AuroraText.displayMedium
                                .copyWith(color: AuroraColors.success)),
                        const SizedBox(height: 4),
                        Text(tr('co2SavedLabel'),
                            style: AuroraText.bodyMedium),
                      ],
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),
                  _statRow(Icons.directions_car_outlined, tr('co2Rides'),
                      '$rides'),
                  _statRow(Icons.route_outlined, tr('co2Distance'),
                      '${km.toStringAsFixed(0)} ${tr('km')}'),
                  _statRow(Icons.cloud_outlined, tr('co2Total'),
                      '${totalKg.toStringAsFixed(1)} ${tr('kg')}'),
                  _statRow(Icons.park_outlined, tr('co2Trees'),
                      trees.toStringAsFixed(1)),
                  const SizedBox(height: AuroraSpacing.lg),
                  Container(
                    padding: const EdgeInsets.all(AuroraSpacing.lg),
                    decoration: BoxDecoration(
                      color: AuroraColors.ash,
                      borderRadius: BorderRadius.circular(AuroraRadius.md),
                      border: Border.all(color: AuroraColors.border),
                    ),
                    child: Text(tr('co2Note'),
                        style: AuroraText.bodySmall.copyWith(height: 1.5)),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _statRow(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AuroraColors.success, size: 22),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(child: Text(label, style: AuroraText.bodyMedium)),
          Text(value,
              style: AuroraText.titleSmall.copyWith(color: AuroraColors.pearl)),
        ],
      ),
    );
  }
}
