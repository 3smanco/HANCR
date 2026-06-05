import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// ─── Announcements ─────────────────────────────────────────────────────────

@ObjectType()
export class AnnouncementType {
  @Field(() => Int) id!: number;
  @Field() title!: string;
  @Field() body!: string;
  @Field() target!: string;
  @Field({ nullable: true }) url?: string;
  @Field() startsAt!: Date;
  @Field({ nullable: true }) endsAt?: Date;
  @Field() active!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateAnnouncementInput {
  @Field() @IsString() @MinLength(3) title!: string;

  @Field() @IsString() @MinLength(5) body!: string;

  @Field({ defaultValue: 'all' })
  @IsString()
  @IsIn(['all', 'rider', 'driver'])
  target!: string;

  @Field({ nullable: true }) @IsOptional() @IsString() url?: string;

  @Field({ nullable: true }) @IsOptional() startsAt?: Date;

  @Field({ nullable: true }) @IsOptional() endsAt?: Date;
}

@InputType()
export class UpdateAnnouncementInput {
  @Field(() => Int) id!: number;

  @Field({ nullable: true }) @IsOptional() @IsString() title?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() body?: string;
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'rider', 'driver'])
  target?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() url?: string;
  @Field({ nullable: true }) @IsOptional() startsAt?: Date;
  @Field({ nullable: true }) @IsOptional() endsAt?: Date;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() active?: boolean;
}

// ─── Gift Batches ──────────────────────────────────────────────────────────

@ObjectType()
export class GiftBatchType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field(() => Float) amount!: number;
  @Field() currency!: string;
  @Field(() => Int) totalCount!: number;
  @Field(() => Int) claimedCount!: number;
  @Field({ nullable: true }) expiresAt?: Date;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateGiftBatchInput {
  @Field() @IsString() @MinLength(2) name!: string;
  @Field(() => Float) @Min(0.01) amount!: number;
  @Field({ defaultValue: 'SAR' }) @IsString() currency!: string;
  @Field(() => Int) @IsInt() @Min(1) totalCount!: number;
  @Field({ nullable: true }) @IsOptional() expiresAt?: Date;
}

@ObjectType()
export class GiftBatchExportResult {
  @Field(() => GiftBatchType) batch!: GiftBatchType;
  @Field(() => [String]) codes!: string[];
}

// ─── Referrals stats ───────────────────────────────────────────────────────

@ObjectType()
export class ReferralStatRow {
  @Field(() => Int) riderId!: number;
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) referralCode?: string;
  @Field(() => Int) invitedCount!: number;
}

@ObjectType()
export class ReferralStatsResult {
  @Field(() => Int) totalInvited!: number;
  @Field(() => [ReferralStatRow]) topReferrers!: ReferralStatRow[];
}
