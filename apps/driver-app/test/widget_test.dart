// Smoke test — يتأكَّد أنّ تطبيق السائق ينطلق بدون استثناءات.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hancr_driver/app.dart';

void main() {
  testWidgets('HancrDriverApp boots without exceptions',
      (WidgetTester tester) async {
    await tester.pumpWidget(const HancrCaptainApp());
    expect(find.byType(MaterialApp), findsWidgets);
  });
}
