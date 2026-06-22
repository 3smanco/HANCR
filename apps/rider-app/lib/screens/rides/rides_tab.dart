import 'package:flutter/material.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_rides.dart';

/// تبويب النشاط — تبويبان: القادمة (مجدولة) + السابقة (السجل).
class RidesTab extends StatelessWidget {
  const RidesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final bottomInset = AuroraBottomNav.height +
        MediaQuery.of(context).viewPadding.bottom +
        AuroraSpacing.lg;
    return AuroraBackground(
      child: SafeArea(
        bottom: false,
        child: DefaultTabController(
          length: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(AuroraSpacing.lg,
                    AuroraSpacing.md, AuroraSpacing.lg, AuroraSpacing.sm),
                child: Text('النشاط', style: AuroraText.displayMedium),
              ),
              TabBar(
                labelColor: AuroraColors.ember,
                unselectedLabelColor: AuroraColors.textSecondary,
                indicatorColor: AuroraColors.ember,
                labelStyle: AuroraText.titleSmall,
                tabs: [
                  Tab(text: tr('upcoming')),
                  Tab(text: tr('past')),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    UpcomingRidesView(bottomInset: bottomInset),
                    AuroraRidesView(bottomInset: bottomInset),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
