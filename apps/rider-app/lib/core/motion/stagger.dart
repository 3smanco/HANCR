import 'package:flutter/widgets.dart';
import 'entrance.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Stagger — دخول متدرّج لمجموعة عناصر                          ║
/// ║                                                               ║
/// ║  يلفّ كل ابن بـ fadeSlideIn(index) تلقائياً → موجة دخول        ║
/// ║  أنيقة للأقسام والقوائم القصيرة. للقوائم الطويلة استعمل         ║
/// ║  ListView.builder + .fadeSlideIn(index: i) يدوياً (أداء).      ║
/// ╚══════════════════════════════════════════════════════════════╝
class StaggerColumn extends StatelessWidget {
  const StaggerColumn({
    super.key,
    required this.children,
    this.crossAxisAlignment = CrossAxisAlignment.stretch,
    this.mainAxisSize = MainAxisSize.min,
    this.spacing = 0,
    this.dy = 18,
  });

  final List<Widget> children;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;
  final double spacing;
  final double dy;

  @override
  Widget build(BuildContext context) {
    final out = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      out.add(children[i].fadeSlideIn(index: i, dy: dy));
      if (spacing > 0 && i != children.length - 1) {
        out.add(SizedBox(height: spacing));
      }
    }
    return Column(
      crossAxisAlignment: crossAxisAlignment,
      mainAxisSize: mainAxisSize,
      children: out,
    );
  }
}
