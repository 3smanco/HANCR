import 'package:flutter/widgets.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  CountUpText — عدّاد رقمي متحرك                                ║
/// ║                                                               ║
/// ║  يُحرّك الرقم من القيمة السابقة إلى الجديدة (أرصدة/أجرة/أرباح).║
/// ║  مثال: CountUpText(value: 125.5, prefix: '', suffix: ' ر.س')  ║
/// ║  يحترم reduce-motion (يقفز فوراً للقيمة).                      ║
/// ╚══════════════════════════════════════════════════════════════╝
/// عدّاد متحرك: يعدّ من 0 → [value] عند الظهور، ومن القيمة السابقة → الجديدة
/// عند التغيّر. يحترم reduce-motion (يقفز فوراً).
class CountUpText extends StatefulWidget {
  const CountUpText({
    super.key,
    required this.value,
    this.style,
    this.prefix = '',
    this.suffix = '',
    this.fractionDigits = 0,
    this.duration,
    this.curve = Motion.decelerate,
    this.textAlign,
  });

  final double value;
  final TextStyle? style;
  final String prefix;
  final String suffix;
  final int fractionDigits;
  final Duration? duration;
  final Curve curve;
  final TextAlign? textAlign;

  @override
  State<CountUpText> createState() => _CountUpTextState();
}

class _CountUpTextState extends State<CountUpText> {
  double _from = 0;

  @override
  void didUpdateWidget(CountUpText old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) _from = old.value;
  }

  @override
  Widget build(BuildContext context) {
    final d = Motion.dur(widget.duration ?? Motion.slow);
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: _from, end: widget.value),
      duration: d,
      curve: widget.curve,
      builder: (context, v, _) => Text(
        '${widget.prefix}${v.toStringAsFixed(widget.fractionDigits)}${widget.suffix}',
        style: widget.style,
        textAlign: widget.textAlign,
      ),
    );
  }
}

/// نسخة تتعقّب التغيّر: تبدأ من القيمة القديمة نحو الجديدة عند كل تحديث.
class AnimatedCountUp extends StatefulWidget {
  const AnimatedCountUp({
    super.key,
    required this.value,
    this.style,
    this.prefix = '',
    this.suffix = '',
    this.fractionDigits = 0,
    this.duration,
    this.curve = Motion.decelerate,
    this.textAlign,
  });

  final double value;
  final TextStyle? style;
  final String prefix;
  final String suffix;
  final int fractionDigits;
  final Duration? duration;
  final Curve curve;
  final TextAlign? textAlign;

  @override
  State<AnimatedCountUp> createState() => _AnimatedCountUpState();
}

class _AnimatedCountUpState extends State<AnimatedCountUp> {
  double _from = 0;

  @override
  void initState() {
    super.initState();
    _from = 0;
  }

  @override
  void didUpdateWidget(AnimatedCountUp old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) _from = old.value;
  }

  @override
  Widget build(BuildContext context) {
    final d = Motion.dur(widget.duration ?? Motion.slow);
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: _from, end: widget.value),
      duration: d,
      curve: widget.curve,
      builder: (context, v, _) => Text(
        '${widget.prefix}${v.toStringAsFixed(widget.fractionDigits)}${widget.suffix}',
        style: widget.style,
        textAlign: widget.textAlign,
      ),
    );
  }
}
