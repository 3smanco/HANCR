import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { GeoPointType } from './geo-point.input';

@ObjectType()
export class OrderType {
  @Field(() => Int)
  id!: number;

  @Field()
  type!: string;

  @Field()
  status!: string;

  /** التسعير */
  @Field(() => Float)
  costBest!: number;

  @Field(() => Float)
  costAfterCoupon!: number;

  @Field(() => Float, { nullable: true })
  discountAmount?: number;

  @Field({ nullable: true })
  couponCode?: string;

  @Field(() => Float)
  paidAmount!: number;

  @Field(() => Float)
  tipAmount!: number;

  @Field()
  currency!: string;

  /** المسار */
  @Field(() => Int)
  distanceBest!: number;

  @Field(() => Int)
  durationBest!: number;

  @Field(() => [GeoPointType], { nullable: true })
  points?: GeoPointType[];

  /** مسار الطريق الفعلي (يتبع الشوارع) لرسمه على خريطة التتبّع. */
  @Field(() => [GeoPointType], { nullable: true })
  directions?: GeoPointType[];

  @Field(() => [String])
  addresses!: string[];

  /** Ride Moods */
  @Field()
  quietRide!: boolean;

  @Field(() => Int, { nullable: true })
  requestedTemperature?: number;

  @Field()
  audioOff!: boolean;

  @Field()
  numberMasked!: boolean;

  /** OTP */
  @Field({ nullable: true })
  otpCode?: string;

  @Field({ nullable: true })
  receiverPhone?: string;

  @Field({ nullable: true })
  receiverName?: string;

  /** Bid */
  @Field()
  isBidOrder!: boolean;

  @Field(() => Int, { nullable: true })
  bidId?: number;

  @Field(() => Int, { nullable: true })
  poolGroupId?: number;

  /** بيانات السائق (مختصرة) */
  @Field(() => Int, { nullable: true })
  driverId?: number;

  @Field({ nullable: true })
  driverName?: string;

  @Field({ nullable: true })
  driverPhone?: string;

  @Field({ nullable: true })
  carBrand?: string;

  @Field({ nullable: true })
  carModel?: string;

  @Field({ nullable: true })
  carColor?: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field({ nullable: true })
  driverAvatarUrl?: string;

  @Field(() => Float, { nullable: true })
  driverRating?: number;

  /** معرّف الراكب */
  @Field(() => Int)
  riderId!: number;

  @Field(() => Int)
  serviceId!: number;

  @Field(() => Int)
  regionId!: number;

  @Field({ nullable: true })
  etaPickup?: Date;

  @Field({ nullable: true })
  startTimestamp?: Date;

  @Field({ nullable: true })
  finishTimestamp?: Date;

  @Field({ nullable: true })
  expectedTimestamp?: Date;

  @Field()
  createdOn!: Date;

  @Field()
  updatedAt!: Date;

  // ===== Grocery Run =====
  @Field(() => [ShoppingListItemType], { nullable: true })
  shoppingList?: ShoppingListItemType[];

  @Field(() => Float, { nullable: true })
  budget?: number;
}

@ObjectType()
export class ShoppingListItemType {
  @Field()
  name!: string;

  @Field(() => Int)
  qty!: number;

  @Field({ nullable: true })
  note?: string;
}
