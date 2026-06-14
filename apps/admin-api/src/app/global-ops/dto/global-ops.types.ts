import { Field, Int, ObjectType, Float } from '@nestjs/graphql';

/** إحصاء حيّ لكل دولة — يغذّي العرض الكلّي (Geo-Radar) في غرفة العمليات. */
@ObjectType()
export class CountryLiveStats {
  @Field(() => Int) countryId!: number;
  @Field() iso2!: string;
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field({ nullable: true }) flag?: string;
  @Field() currency!: string;
  @Field() timezone!: string;
  @Field(() => Float, { nullable: true }) centerLat?: number;
  @Field(() => Float, { nullable: true }) centerLng?: number;
  @Field() enabled!: boolean;
  /** سائقون نشطون (Online/Busy) في الدولة. */
  @Field(() => Int) onlineDrivers!: number;
  /** طلبات قيد التنفيذ في الدولة. */
  @Field(() => Int) activeOrders!: number;
}

@ObjectType()
export class GlobalLiveOverview {
  @Field(() => [CountryLiveStats]) countries!: CountryLiveStats[];
  @Field(() => Int) totalOnlineDrivers!: number;
  @Field(() => Int) totalActiveOrders!: number;
  @Field(() => Int) activeCountries!: number;
}

/** أرباح دولة في الفترة — أصلية + محوَّلة لعملة الأساس. */
@ObjectType()
export class CountryRevenue {
  @Field(() => Int) countryId!: number;
  @Field() iso2!: string;
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field({ nullable: true }) flag?: string;
  @Field() currency!: string;
  @Field(() => Int) orders!: number;
  /** إجمالي الأجرة بالعملة المحلية. */
  @Field(() => Float) revenueNative!: number;
  /** نفس المبلغ بعملة الأساس (USD). */
  @Field(() => Float) revenueBase!: number;
  /** حصة المنصّة بالعملة المحلية. */
  @Field(() => Float) platformNative!: number;
  /** حصة المنصّة بعملة الأساس. */
  @Field(() => Float) platformBase!: number;
  /** نمو الأرباح % مقابل الفترة السابقة المماثلة (بالعملة المحلية). */
  @Field(() => Float) growthPct!: number;
}

@ObjectType()
export class GlobalRevenueMatrix {
  @Field(() => [CountryRevenue]) countries!: CountryRevenue[];
  /** عملة العرض الأساسية الموحّدة. */
  @Field() baseCurrency!: string;
  @Field(() => Float) totalRevenueBase!: number;
  @Field(() => Float) totalPlatformBase!: number;
  @Field(() => Int) periodDays!: number;
  /** مصدر أسعار الصرف (live | fallback). */
  @Field() fxSource!: string;
  @Field({ nullable: true }) fxLastSync?: Date;
}
