import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** إلحاح حجز مسبق: imminent (<2س) / soon (<24س) / scheduled. */
export type BookingUrgency = 'imminent' | 'soon' | 'scheduled';

/** حجز مسبق قادم مُثرى بالدولة والتوقيت المحلي. */
@ObjectType()
export class UpcomingBooking {
  @Field(() => Int) orderId!: number;
  @Field(() => Int, { nullable: true }) riderId?: number;
  @Field(() => Int) regionId!: number;
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
  @Field({ nullable: true }) flag?: string;
  /** توقيت المنطقة/الدولة (IANA) لعرض الوقت المحلي. */
  @Field({ nullable: true }) timezone?: string;
  /** موعد الالتقاط المجدول (UTC). */
  @Field() pickupAt!: Date;
  /** دقائق حتى الالتقاط (سالب = فات). */
  @Field(() => Int) minutesUntil!: number;
  @Field() urgency!: string;
  @Field(() => Float, { nullable: true }) fare?: number;
  @Field({ nullable: true }) currency?: string;
}

/** تجميع الحجوزات القادمة لكل دولة. */
@ObjectType()
export class CrossCityCountryGroup {
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
  @Field({ nullable: true }) flag?: string;
  @Field({ nullable: true }) timezone?: string;
  @Field(() => Int) count!: number;
}

/**
 * مركز العمليات عبر-المدن — كل الحجوزات المسبقة القادمة عبر النطاق، مُثراة
 * بالتوقيت المحلي لكل سوق، مُرتَّبة بموعد الالتقاط + تجميع لكل دولة.
 */
@ObjectType()
export class CrossCityOps {
  @Field(() => [UpcomingBooking]) bookings!: UpcomingBooking[];
  @Field(() => [CrossCityCountryGroup]) byCountry!: CrossCityCountryGroup[];
  @Field(() => Int) total!: number;
  @Field(() => Int) imminentCount!: number;
}
