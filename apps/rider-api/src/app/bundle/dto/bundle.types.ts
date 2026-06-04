import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RideBundleType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field(() => Int) ridesCount!: number;
  @Field(() => Float) price!: number;
  @Field() currency!: string;
  @Field(() => Int) validityDays!: number;
  @Field(() => Float) maxDistanceKm!: number;
  @Field(() => Int) regionId!: number;
  @Field() active!: boolean;
}

@ObjectType()
export class RiderEntitlementType {
  @Field(() => Int) id!: number;
  @Field(() => Int) bundleId!: number;
  @Field() bundleName!: string;
  @Field(() => Int) ridesTotal!: number;
  @Field(() => Int) ridesRemaining!: number;
  @Field(() => Float) maxDistanceKm!: number;
  @Field() expiresAt!: Date;
  @Field(() => Float) amountPaid!: number;
  @Field() currency!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class PurchaseResultType {
  @Field() success!: boolean;
  @Field(() => RiderEntitlementType) entitlement!: RiderEntitlementType;
  @Field(() => Float) newWalletBalance!: number;
}
