import 'package:flutter/services.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — Haptics                                                  ║
/// ║  كل ردود الفعل اللمسية تمرّ من هنا (نقطة تحكم واحدة + إمكان     ║
/// ║  تعطيلها من الإعدادات). تفشل بصمت على المنصّات بلا دعم.         ║
/// ╚══════════════════════════════════════════════════════════════╝
class Haptics {
  Haptics._();

  /// مفتاح عام لتعطيل كل النبضات (يُربط بإعداد المستخدم لاحقاً).
  static bool enabled = true;

  static Future<void> _run(Future<void> Function() f) async {
    if (!enabled) return;
    try {
      await f();
    } catch (_) {
      /* منصّة بلا دعم haptics — تجاهل */
    }
  }

  static Future<void> light() => _run(HapticFeedback.lightImpact);
  static Future<void> medium() => _run(HapticFeedback.mediumImpact);
  static Future<void> heavy() => _run(HapticFeedback.heavyImpact);
  static Future<void> selection() => _run(HapticFeedback.selectionClick);

  /// نمط نجاح: خفيفة ثم متوسطة (رحلة مكتملة/دفع ناجح).
  static Future<void> success() async {
    await light();
    await Future<void>.delayed(const Duration(milliseconds: 90));
    await medium();
  }

  /// نمط تحذير: نبضة متوسطة مفردة.
  static Future<void> warning() => medium();

  /// نمط خطأ: نبضتان ثقيلتان (SOS/إلغاء/فشل).
  static Future<void> error() async {
    await heavy();
    await Future<void>.delayed(const Duration(milliseconds: 120));
    await heavy();
  }
}
