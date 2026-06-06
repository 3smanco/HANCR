import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * إعداد التطبيق — محرك Server-Driven UI
 * كل شيء في التطبيق يأتي من هنا: الألوان، الخدمات، الميزات
 * يُحدَّث من لوحة التحكم ويُبث فوراً للتطبيقات المفتوحة
 */
@Entity('hancr_app_config')
export class AppConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * مفتاح الإعداد — نوع واحد لكل مفتاح
   * 'main' = الإعداد الرئيسي العام
   * 'rider' = خاص بتطبيق الراكب
   * 'driver' = خاص بتطبيق السائق
   */
  @Column({ unique: true, name: 'config_key' })
  configKey!: string;

  /**
   * إعدادات الثيم البصري
   * {
   *   economySkin: { background, text, accent, border },
   *   vipSkin: { background, text, accent, border },
   *   typography: { fontFamily, sizes },
   *   borderRadius: { buttons, cards }
   * }
   */
  @Column({ type: 'jsonb', default: '{}', name: 'theme_config' })
  themeConfig!: Record<string, unknown>;

  /**
   * إعداد الشاشة الرئيسية
   * {
   *   banners: [{ id, imageUrl, link, expiresAt }],
   *   servicesGrid: [{ serviceId, order, visible }],
   *   welcomeMessage: { ar, en },
   *   announcements: []
   * }
   */
  @Column({ type: 'jsonb', default: '{}', name: 'home_screen_config' })
  homeScreenConfig!: Record<string, unknown>;

  /**
   * Feature Flags — تفعيل/تعطيل الميزات
   * {
   *   bid_mode: { enabled: bool, regions: ['QA'] },
   *   ai_voice: { enabled: bool },
   *   multi_modal: { enabled: bool, regions: ['QA'] },
   *   guest_booking: { enabled: bool },
   *   hancr_shield: { enabled: bool }
   * }
   */
  @Column({ type: 'jsonb', default: '{}', name: 'feature_flags' })
  featureFlags!: Record<string, unknown>;

  /**
   * إعدادات نظام الولاء
   * {
   *   milesPerKm: { RideSharing: 1.0, HourlyChauffeur: 1.5, PackageDelivery: 0.5 },
   *   tierThresholds: { Silver: 100, Gold: 300, Platinum: 700 },
   *   redemptionRate: 0.01
   * }
   */
  @Column({ type: 'jsonb', default: '{}', name: 'loyalty_config' })
  loyaltyConfig!: Record<string, unknown>;

  /**
   * K3 — SMS provider config
   * {
   *   provider: 'twilio' | 'vonage' | 'local',
   *   senderId: string,
   *   active: boolean,
   *   // credentials are NEVER stored here — they live in .env.prod
   * }
   */
  @Column({ type: 'jsonb', default: '{}', name: 'sms_config' })
  smsConfig!: Record<string, unknown>;

  /**
   * K3 — Payment gateway config (one row keyed by gateway code)
   * {
   *   hyperpay: { enabled: bool, regions: ['SA'], displayName: 'HyperPay' },
   *   moyasar:  { enabled: bool, regions: ['SA'] },
   *   stripe:   { enabled: bool, regions: ['AE','QA'] },
   *   applepay: { enabled: bool, regions: ['SA','AE'] }
   * }
   */
  @Column({ type: 'jsonb', default: '{}', name: 'gateway_config' })
  gatewayConfig!: Record<string, unknown>;

  /** الإصدار — للـ force update */
  @Column({ default: '1.0.0' })
  version!: string;

  /** آخر من عدّل الإعداد */
  @Column({ nullable: true, name: 'updated_by' })
  updatedBy?: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
