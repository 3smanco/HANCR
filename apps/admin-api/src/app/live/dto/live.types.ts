import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LiveDriverType {
  @Field(() => Int) driverId!: number;
  @Field({ nullable: true }) driverName?: string;
  @Field({ nullable: true }) driverPhone?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field({ nullable: true }) carBrand?: string;
  @Field({ nullable: true }) carModel?: string;
  @Field(() => Float) lat!: number;
  @Field(() => Float) lng!: number;
  @Field(() => Float) heading!: number;
  @Field() status!: string;
  @Field(() => Int) currentOrderId!: number;
  /** منطقة السائق (إن عُرِفت) — للفلترة بالنطاق. */
  @Field(() => Int, { nullable: true }) regionId?: number;
  /** دولة السائق (iso2) — لفلترة الخريطة المسطّحة لكل دولة. */
  @Field({ nullable: true }) countryIso?: string;
}

@ObjectType()
export class LiveDriversResult {
  @Field(() => Int) total!: number;
  @Field(() => Int) idle!: number;
  @Field(() => Int) inRide!: number;
  @Field(() => [LiveDriverType]) drivers!: LiveDriverType[];
}
