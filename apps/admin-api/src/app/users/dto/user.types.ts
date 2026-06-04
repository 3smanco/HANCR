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
