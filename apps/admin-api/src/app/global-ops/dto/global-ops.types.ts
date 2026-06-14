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
