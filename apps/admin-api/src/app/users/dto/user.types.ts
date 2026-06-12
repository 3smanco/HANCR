import { ObjectType, InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

const PHONE_RE = /^\+\d{8,15}$/;

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
  @Field() @Matches(PHONE_RE, { message: 'رقم جوال دولي غير صحيح' }) phoneNumber!: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) firstName?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) lastName?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() email?: string;
  /** يُشتق من الهاتف إن لم يُمرَّر (+966 → SAR …) */
  @Field({ nullable: true }) @IsOptional() @MaxLength(5) countryCode?: string;
}

@InputType()
export class AdminUpdateRiderInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) firstName?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) lastName?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() email?: string;
  @Field({ nullable: true }) @IsOptional() @Matches(PHONE_RE) phoneNumber?: string;
}

@InputType()
export class AdminCreateDriverInput {
  @Field() @Matches(PHONE_RE, { message: 'رقم جوال دولي غير صحيح' }) phoneNumber!: string;
  @Field() @MaxLength(60) firstName!: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) lastName?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(5) countryCode?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(40) carBrand?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(40) carModel?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(30) carColor?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(20) plateNumber?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() carYear?: number;
  @Field(() => [Int], { nullable: true }) @IsOptional() serviceIds?: number[];
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() regionId?: number;
  /** اعتماد فوري (يتجاوز رفع الوثائق) — لسائقي الأسطول/الاختبار */
  @Field({ nullable: true, defaultValue: false }) @IsOptional() approveImmediately?: boolean;
}

@InputType()
export class AdminUpdateDriverInput {
  @Field(() => Int) @IsInt() id!: number;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) firstName?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(60) lastName?: string;
  @Field({ nullable: true }) @IsOptional() @Matches(PHONE_RE) phoneNumber?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(40) carBrand?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(40) carModel?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(30) carColor?: string;
  @Field({ nullable: true }) @IsOptional() @MaxLength(20) plateNumber?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() carYear?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() regionId?: number;
}
