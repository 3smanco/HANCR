import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** مستوى VIP عالمي يُحتسَب من الإنفاق (بعملة الأساس) وعدد الرحلات. */
export type VipTier = 'standard' | 'silver' | 'gold' | 'platinum';

/** إنفاق الراكب في دولة واحدة (أصلي + محوَّل لعملة الأساس). */
@ObjectType()
export class CountrySpendType {
  @Field() countryIso!: string;
  @Field() countryName!: string;
  @Field({ nullable: true }) flag?: string;
  @Field() currency!: string;
  @Field(() => Int) orders!: number;
  /** الإنفاق بالعملة المحلية. */
  @Field(() => Float) spentNative!: number;
  /** الإنفاق محوَّلاً لعملة الأساس. */
  @Field(() => Float) spentBase!: number;
}

/**
 * إشارة احتيال عبر-حدود: رحلتان في دولتين مختلفتين خلال نافذة زمنية يستحيل
 * قطعها برّاً → الحساب يُستخدم في دولتين معاً (مشاركة/سرقة/تزوير موقع).
 */
@ObjectType()
export class FraudSignalType {
  @Field() kind!: string; // 'cross_border_velocity'
  @Field() severity!: string; // 'high' | 'medium'
  @Field(() => Int) orderIdA!: number;
  @Field(() => Int) orderIdB!: number;
  @Field() countryA!: string;
  @Field() countryB!: string;
  /** الفارق الزمني بالدقائق بين الطلبين. */
  @Field(() => Float) minutesApart!: number;
  @Field() message!: string;
}

/**
 * ملف VIP 360 عالمي (Jet-Setter) — رؤية موحَّدة للراكب عبر كل الدول:
 * الإنفاق مدمجاً بعملة الأساس + موزّعاً لكل دولة + المستوى + إشارات الاحتيال.
 */
@ObjectType()
export class VipProfileType {
  @Field(() => Int) riderId!: number;
  @Field() name!: string;
  @Field() phoneNumber!: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) avatarUrl?: string;
  @Field() banned!: boolean;
  @Field(() => Float) rating!: number;

  /** المستوى المُحتسَب عالمياً. */
  @Field() tier!: string;
  /** إجمالي الإنفاق (عملة الأساس) عبر كل الدول. */
  @Field(() => Float) lifetimeSpendBase!: number;
  @Field() baseCurrency!: string;
  @Field(() => Int) totalRides!: number;
  /** عدد الدول التي استخدم فيها الراكب الخدمة. */
  @Field(() => Int) countriesVisited!: number;

  /** رصيد المحفظة الحالي (عملة الراكب الأساسية). */
  @Field(() => Float) walletBalance!: number;
  @Field() walletCurrency!: string;

  /** توزيع الإنفاق لكل دولة. */
  @Field(() => [CountrySpendType]) byCountry!: CountrySpendType[];
  /** إشارات احتيال عبر-الحدود (فارغة = نظيف). */
  @Field(() => [FraudSignalType]) fraudSignals!: FraudSignalType[];
}
