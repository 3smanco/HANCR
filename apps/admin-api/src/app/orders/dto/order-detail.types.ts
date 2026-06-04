import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GeoPointType {
  @Field(() => Float) lat!: number;
  @Field(() => Float) lng!: number;
}

@ObjectType()
export class AdminOrderActivityType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminOrderMessageType {
  @Field(() => Int) id!: number;
  @Field() senderType!: string;
  @Field(() => Int) senderId!: number;
  @Field() message!: string;
  @Field() sentAt!: Date;
}

@ObjectType()
export class AdminNearbyDriverType {
  @Field(() => Int) driverId!: number;
  @Field() driverName!: string;
  @Field({ nullable: true }) driverPhone?: string;
  @Field(() => Float) distanceMeters!: number;
  @Field(() => Int) etaMinutes!: number;
  @Field() status!: string;
}

@ObjectType()
export class AdminOrderDetailType {
  // Base order fields
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() status!: string;
  @Field() currency!: string;
  @Field(() => Int) riderId!: number;
  @Field({ nullable: true }) riderName?: string;
  @Field({ nullable: true }) riderPhone?: string;
  @Field(() => Int, { nullable: true }) driverId?: number;
  @Field({ nullable: true }) driverName?: string;
  @Field({ nullable: true }) driverPhone?: string;
  @Field(() => Int) serviceId!: number;
  @Field({ nullable: true }) serviceName?: string;
  @Field(() => Int) regionId!: number;

  // Route
  @Field(() => [GeoPointType], { nullable: true }) points?: GeoPointType[];
  @Field(() => [String]) addresses!: string[];
  @Field(() => Int) distanceBest!: number;
  @Field(() => Int) durationBest!: number;

  // Pricing
  @Field(() => Float) costBest!: number;
  @Field(() => Float) costAfterCoupon!: number;
  @Field(() => Float) paidAmount!: number;
  @Field(() => Float) providerShare!: number;
  @Field(() => Float) discountAmount!: number;
  @Field({ nullable: true }) couponCode?: string;
  @Field({ nullable: true }) paymentMode?: string;

  // New-service signals
  @Field({ nullable: true }) familyMode?: boolean;
  @Field({ nullable: true }) preferFemaleDriver?: boolean;
  @Field({ nullable: true }) nightShift?: boolean;
  @Field(() => Int, { nullable: true }) preferredDriverId?: number;
  @Field(() => Int, { nullable: true }) bookedHours?: number;
  @Field(() => Int, { nullable: true }) entitlementId?: number;
  @Field(() => Int, { nullable: true }) companyId?: number;

  // Timestamps
  @Field({ nullable: true }) startTimestamp?: Date;
  @Field({ nullable: true }) finishTimestamp?: Date;
  @Field({ nullable: true }) etaPickup?: Date;
  @Field() createdOn!: Date;

  // Related collections
  @Field(() => [AdminOrderActivityType])
  activities!: AdminOrderActivityType[];

  @Field(() => [AdminOrderMessageType])
  messages!: AdminOrderMessageType[];
}
