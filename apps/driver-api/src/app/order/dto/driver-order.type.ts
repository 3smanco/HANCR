import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
class GeoPoint {
  @Field(() => Float) lat!: number;
  @Field(() => Float) lng!: number;
}

@ObjectType()
export class DriverOrderType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() status!: string;
  @Field(() => Int, { nullable: true }) driverId?: number;

  /** الراكب */
  @Field(() => Int) riderId!: number;
  @Field({ nullable: true }) riderName?: string;
  @Field({ nullable: true }) riderPhone?: string;
  @Field(() => Float) riderRating!: number;

  /** المسار */
  @Field(() => [GeoPoint], { nullable: true }) points?: GeoPoint[];
  @Field(() => [String]) addresses!: string[];
  @Field(() => Int) distanceBest!: number;
  @Field(() => Int) durationBest!: number;

  /** التسعير */
  @Field(() => Float) costBest!: number;
  @Field(() => Float) costAfterCoupon!: number;
  @Field() currency!: string;
  @Field() paymentMode!: string;

  /** Ride Moods */
  @Field() quietRide!: boolean;
  @Field(() => Int, { nullable: true }) requestedTemperature?: number;
  @Field() audioOff!: boolean;
  @Field() numberMasked!: boolean;
  @Field({ nullable: true }) familyMode?: boolean;
  @Field({ nullable: true }) preferFemaleDriver?: boolean;

  /** D3 — VIP (preferred driver) */
  @Field(() => Int, { nullable: true }) preferredDriverId?: number;

  /** F1 — Bundles / F2 — Corporate (prepaid) */
  @Field(() => Int, { nullable: true }) entitlementId?: number;
  @Field(() => Int, { nullable: true }) companyId?: number;

  /** Hourly Chauffeur */
  @Field(() => Int, { nullable: true }) bookedHours?: number;

  /** G1 — Night Shift */
  @Field({ nullable: true }) nightShift?: boolean;

  /** OTP */
  @Field({ nullable: true }) otpCode?: string;
  @Field({ nullable: true }) receiverName?: string;
  @Field({ nullable: true }) receiverPhone?: string;

  /** Bid */
  @Field() isBidOrder!: boolean;

  @Field({ nullable: true }) etaPickup?: Date;
  @Field({ nullable: true }) startTimestamp?: Date;
  @Field({ nullable: true }) finishTimestamp?: Date;
  @Field() createdOn!: Date;

  // ===== Grocery Run =====
  @Field(() => [DriverShoppingItemType], { nullable: true })
  shoppingList?: DriverShoppingItemType[];

  @Field(() => Float, { nullable: true })
  budget?: number;
}

@ObjectType()
export class DriverShoppingItemType {
  @Field()
  name!: string;

  @Field(() => Int)
  qty!: number;

  @Field({ nullable: true })
  note?: string;
}
