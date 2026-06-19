import 'package:flutter/material.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_rides.dart';

/// تبويب النشاط — سجل الرحلات بنمط Aurora.
class RidesTab extends StatelessWidget {
  const RidesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(AuroraSpacing.lg,
                  AuroraSpacing.md, AuroraSpacing.lg, AuroraSpacing.sm),
              child: Text('النشاط', style: AuroraText.displayMedium),
            ),
            Expanded(
              child: AuroraRidesView(
                bottomInset: AuroraBottomNav.height +
                    MediaQuery.of(context).viewPadding.bottom +
                    AuroraSpacing.lg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
