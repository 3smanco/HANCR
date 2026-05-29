// Smoke test — يتأكَّد أنّ التطبيق ينطلق ويعرض الـ Splash بدون استثناءات.
//
// لا يحاول اختبار GraphQL/Map لأنها تتطلَّب بيئة integration كاملة.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hancr_rider/app.dart';

void main() {
  testWidgets('HancrRiderApp boots without exceptions',
      (WidgetTester tester) async {
    await tester.pumpWidget(const HancrRiderApp());
    // أوّل frame فقط — Splash screen يجب أن يظهر
    expect(find.byType(MaterialApp), findsWidgets);
  });
}
