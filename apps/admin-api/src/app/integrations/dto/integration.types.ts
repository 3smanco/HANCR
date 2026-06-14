import { Field, Int, ObjectType } from '@nestjs/graphql';

/** قناة تكامل: دفع / رسائل / خرائط. */
export type IntegrationChannel = 'payment' | 'sms' | 'maps';

/** حالة تجهيز المزوّد: live (مفتاح موجود) / pending (بانتظار المالك). */
export type ProviderStatus = 'live' | 'pending';

/** خلية مصفوفة التكامل — مزوّد قناة واحدة لدولة واحدة. */
@ObjectType()
export class IntegrationCell {
  @Field() channel!: string; // payment | sms | maps
  @Field() provider!: string; // اسم المزوّد الموصى به
  /** live = المفتاح مضبوط؛ pending = بانتظار إجراء المالك. */
  @Field() status!: string;
  /** اسم متغيّر البيئة المطلوب (لإرشاد المالك). */
  @Field() envKey!: string;
}

/** صفّ دولة في مصفوفة التكامل (قنواتها). */
@ObjectType()
export class IntegrationCountryRow {
  @Field({ nullable: true }) countryIso?: string;
  @Field() countryName!: string;
  @Field({ nullable: true }) flag?: string;
  @Field() enabled!: boolean;
  @Field(() => [IntegrationCell]) cells!: IntegrationCell[];
}

/**
 * مصفوفة جاهزية التكامل — لكل دولة مُفعَّلة، المزوّد الموصى به لكل قناة
 * (دفع/رسائل/خرائط) وحالة تجهيزه. طبقة تجريد للمالك: تُظهر بالضبط ما يلزم
 * توفيره لكل سوق دون كشف أي مفاتيح.
 */
@ObjectType()
export class IntegrationMatrix {
  @Field(() => [IntegrationCountryRow]) countries!: IntegrationCountryRow[];
  /** عدد القنوات الجاهزة (live) عبر كل الدول. */
  @Field(() => Int) liveCount!: number;
  /** عدد القنوات بانتظار المالك. */
  @Field(() => Int) pendingCount!: number;
}
