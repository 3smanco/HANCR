import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CityEntity } from './city.entity';

/** قاعدة الضريبة لكل دولة (تُستخدم في الفوترة المُوطَّنة). */
export interface CountryTaxRule {
  /** نوع الضريبة المعروض في الفاتورة */
  type: 'VAT' | 'GST' | 'SALES' | 'NONE';
  /** النسبة المئوية (مثال 5 = 5%) */
  rate: number;
  /** التسمية المحلية (اختياري) */
  label?: string;
}

/**
 * الدولة — أعلى مستوى في التسلسل الجغرافي العالمي:
 *   Country → City → Region(zone).
 * تحمل العملة والتوقيت ونظام القياس والقاعدة الضريبية ومتطلبات الوثائق،
 * فتتكيّف الفوترة والتحقّق والعرض تلقائياً حسب الدولة.
 */
@Entity('hancr_country')
export class CountryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** رمز ISO-3166 alpha-2 (QA, SA, AE, GB, US, FR) — فريد. */
  @Column({ length: 2, unique: true })
  iso2!: string;

  /** الاسم بالعربية */
  @Column({ length: 100 })
  name!: string;

  /** الاسم بالإنجليزية */
  @Column({ length: 100, name: 'name_en' })
  nameEn!: string;

  /** عملة الدولة الافتراضية — ISO-4217 (QAR, USD, GBP). */
  @Column({ length: 3 })
  currency!: string;

  /** التوقيت الافتراضي (IANA tz) مثل Asia/Qatar أو Europe/London. */
  @Column({ length: 64, default: 'UTC' })
  timezone!: string;

  /** علم الدولة (إيموجي) للعرض في الشريط العلوي والإنذارات. */
  @Column({ length: 8, nullable: true })
  flag?: string;

  /** رمز الاتصال الدولي (+974, +44). */
  @Column({ length: 8, nullable: true, name: 'dial_code' })
  dialCode?: string;

  /** نظام القياس: متري (كم) أو إمبراطوري (ميل). */
  @Column({ length: 10, default: 'metric' })
  units!: 'metric' | 'imperial';

  /** قاعدة الضريبة للفوترة المُوطَّنة. */
  @Column({ type: 'jsonb', nullable: true, name: 'tax_rule' })
  taxRule?: CountryTaxRule;

  /** متطلبات وثائق السائق لهذه الدولة (مفاتيح يفهمها خط التحقّق). */
  @Column({ type: 'jsonb', default: '[]', name: 'doc_requirements' })
  docRequirements!: string[];

  /** رقم الطوارئ السيادي (999, 911, 112) — لمركز SOS. */
  @Column({ length: 8, nullable: true, name: 'emergency_number' })
  emergencyNumber?: string;

  /** هل الدولة مُفعَّلة للعمليات (الخليج مُفعَّل، البقية جاهزة معطّلة). */
  @Column({ default: false })
  enabled!: boolean;

  /** مدن الدولة */
  @OneToMany(() => CityEntity, (city) => city.country)
  cities!: CityEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
