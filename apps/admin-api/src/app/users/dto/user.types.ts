import { ObjectType, InputType, Field, Int, Float } from '@nestjs/graphql';

// ─── Rider ──────────────────────────────────────────────────────────────────

@ObjectType()
export class AdminRiderType {
  @Field(() => Int) id!: number;
  @Field() phoneNumber!: string;
  @Field() countryCode!: string;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) avatarUrl?: string;
  @Field() active!: boolean;
  @Field() banned!: boolean;
  @Field({ nullable: true }) banReason?: string;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field(() => Float) rating!: number;
  @Field(() => Int) totalRides!: number;
  @Field({ nullable: true }) lastLoginAt?: Date;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

// ─── N3 — Rider detail bundle (orders/transactions/loyalty/places) ────────

@ObjectType()
export class RiderRecentOrderType {
  @Field(() => Int) id!: number;
  @Field() status!: string;
  @Field(() => Float) costAfterCoupon!: number;
  @Field() currency!: string;
  @Field({ nullable: true }) serviceName?: string;
  @Field(() => Int, { nullable: true }) driverId?: number;
  @Field({ nullable: true }) driverName?: string;
  @Field() createdOn!: Date;
}

@ObjectType()
export class RiderSavedPlaceType {
  @Field(() => Int) id!: number;
  @Field() label!: string;
  @Field() address!: string;
  @Field(() => Float) lat!: number;
  @Field(() => Float) lng!: number;
}

@ObjectType()
export class AdminRiderDetailType {
  @Field(() => AdminRiderType) rider!: AdminRiderType;
  @Field(() => [RiderRecentOrderType]) recentOrders!: RiderRecentOrderType[];
  @Field(() => Int) ordersCompleted!: number;
  @Field(() => Int) ordersCancelled!: number;
  @Field(() => Float) totalSpent!: number;
  @Field(() => [RiderSavedPlaceType]) savedPlaces!: RiderSavedPlaceType[];
}

@ObjectType()
export class RiderListResult {
  @Field(() => [AdminRiderType]) items!: AdminRiderType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}

// ─── Driver ─────────────────────────────────────────────────────────────────

@ObjectType()
export class AdminDriverType {
  @Field(() => Int) id!: number;
  @Field() phoneNumber!: string;
  @Field() countryCode!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) avatarUrl?: string;
  @Field() status!: string;
  @Field() active!: boolean;
  @Field() banned!: boolean;
  @Field(() => Float) rating!: number;
  @Field(() => Int) ratingCount!: number;
  @Field({ nullable: true }) carBrand?: string;
  @Field({ nullable: true }) carModel?: string;
  @Field({ nullable: true }) carColor?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field({ nullable: true }) carYear?: number;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field({ nullable: true }) regionId?: number;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  /** H3 — approvals */
  @Field({ nullable: true }) gender?: string;
  @Field() kidsApproved!: boolean;
  @Field() nightApproved!: boolean;
  /** I1 — multi-status approval */
  @Field() approvalStatus!: string;
  @Field({ nullable: true }) rejectionReason?: string;
}

@ObjectType()
export class DriverListResult {
  @Field(() => [AdminDriverType]) items!: AdminDriverType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

@InputType()
export class BanUserInput {
  @Field(() => Int) userId!: number;
  @Field({ nullable: true }) reason?: string;
}

// ─── A1/A2 — Admin manual create + edit ───────────────────────────────────────

@InputType()
export class AdminCreateRiderInput {
  @Field() phoneNumber!: string;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) email?: string;
  /** يُشتق من الهاتف إن لم يُمرَّر (+966 → SAR …) */
  @Field({ nullable: true }) countryCode?: string;
}

@InputType()
export class AdminUpdateRiderInput {
  @Field(() => Int) id!: number;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) phoneNumber?: string;
}

@InputType()
export class AdminCreateDriverInput {
  @Field() phoneNumber!: string;
  @Field() firstName!: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) countryCode?: string;
  @Field({ nullable: true }) carBrand?: string;
  @Field({ nullable: true }) carModel?: string;
  @Field({ nullable: true }) carColor?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field(() => Int, { nullable: true }) carYear?: number;
  @Field(() => [Int], { nullable: true }) serviceIds?: number[];
  @Field(() => Int, { nullable: true }) regionId?: number;
  /** اعتماد فوري (يتجاوز رفع الوثائق) — لسائقي الأسطول/الاختبار */
  @Field({ nullable: true, defaultValue: false }) approveImmediately?: boolean;
}

@InputType()
export class AdminUpdateDriverInput {
  @Field(() => Int) id!: number;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) phoneNumber?: string;
  @Field({ nullable: true }) carBrand?: string;
  @Field({ nullable: true }) carModel?: string;
  @Field({ nullable: true }) carColor?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field(() => Int, { nullable: true }) carYear?: number;
  @Field(() => Int, { nullable: true }) regionId?: number;
}
