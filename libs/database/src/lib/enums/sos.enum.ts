/**
 * حالة حادثة الطوارئ
 *
 * Active     = الحادثة نشطة (للتوّ تم تفعيلها)
 * Resolved   = تم التعامل معها (السائق/الراكب آمن)
 * Cancelled  = إنذار خاطئ (false alarm) — أُلغي يدوياً
 * Escalated  = صعَّدها الأدمن (تواصلت معه الشرطة)
 */
export enum SosStatus {
  Active = 'Active',
  Resolved = 'Resolved',
  Cancelled = 'Cancelled',
  Escalated = 'Escalated',
}

/**
 * من فعَّل الإنذار
 */
export enum SosTriggeredBy {
  Rider = 'Rider',
  Driver = 'Driver',
  System = 'System', // مثل: route deviation auto-trigger
}

/**
 * علاقة جهة الطوارئ بالمستخدم
 */
export enum EmergencyContactRelation {
  Family = 'Family',
  Friend = 'Friend',
  Spouse = 'Spouse',
  Colleague = 'Colleague',
  Other = 'Other',
}
