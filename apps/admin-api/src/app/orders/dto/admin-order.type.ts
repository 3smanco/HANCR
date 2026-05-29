import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class AdminOrderType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() status!: string;
  @Field() currency!: string;

  @Field(() => Int) riderId!: number;
  @Field({ nullable: true }) riderPhone?: string;

  @Field(() => Int, { nullable: true }) driverId?: number;
  @Field({ nullable: true }) driverPhone?: string;

  @Field(() => Int) serviceId!: number;
  @Field({ nullable: true }) serviceName?: string;

  @Field(() => Int) regionId!: number;
  @Field({ nullable: true }) regionName?: string;

  @Field(() => Float) costBest!: number;
  @Field(() => Float) costAfterCoupon!: number;
  @Field(() => Float) paidAmount!: number;
  @Field(() => Float) providerShare!: number;

  @Field(() => Int) distanceBest!: number;
  @Field(() => Int) durationBest!: number;

  @Field() isBidOrder!: boolean;
  @Field({ nullable: true }) paymentMode?: string;

  @Field({ nullable: true }) startTimestamp?: Date;
  @Field({ nullable: true }) finishTimestamp?: Date;
  @Field() createdOn!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
export class OrderListResult {
  @Field(() => [AdminOrderType]) items!: AdminOrderType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}
