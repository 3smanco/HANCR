// Smoke test — يتأكَّد أنّ تطبيق السائق ينطلق بدون استثناءات.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hancr_driver/app.dart';
import 'package:hancr_driver/core/motion/motion_tokens.dart';

void main() {
  testWidgets('HancrDriverApp boots without exceptions', (
    WidgetTester tester,
  ) async {
    tester.binding.platformDispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(
          disableAnimations: true,
          reduceMotion: true,
        );
    Motion.reduceMotion = true;
    addTearDown(() {
      tester.binding.platformDispatcher.clearAccessibilityFeaturesTestValue();
      Motion.reduceMotion = false;
    });

    await tester.pumpWidget(const HancrCaptainApp());
    expect(find.byType(MaterialApp), findsWidgets);
  });
}
