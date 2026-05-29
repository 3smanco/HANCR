import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field(() => Int) totalRiders!: number;
  @Field(() => Int) totalDrivers!: number;
  @Field(() => Int) activeDrivers!: number;
  @Field(() => Int) pendingDriverApprovals!: number;
  @Field(() => Int) totalOrders!: number;
  @Field(() => Int) completedOrders!: number;
  @Field(() => Int) canceledOrders!: number;
  @Field(() => Float) totalRevenue!: number;
  @Field(() => Float) platformRevenue!: number;
}

@ObjectType()
export class RevenueStats {
  @Field() date!: Date;
  @Field(() => Int) orderCount!: number;
  @Field(() => Float) revenue!: number;
  @Field(() => Float) platformRevenue!: number;
}
