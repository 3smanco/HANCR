import { ObjectType, InputType, Field, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { IsOptional } from 'class-validator';

@ObjectType()
export class AdminServiceType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field() serviceType!: string;

  @Field(() => Float) baseFare!: number;
  @Field(() => Float) perHundredMeters!: number;
  @Field(() => Float) perMinuteDrive!: number;
  @Field(() => Float) perMinuteWait!: number;
  @Field(() => Float) minimumFee!: number;
  @Field(() => Float, { nullable: true }) hourlyRate?: number;
  @Field(() => Float, { nullable: true }) extraMinuteRate?: number;

  @Field(() => Float) providerSharePercent!: number;
  @Field(() => Float) prepayPercent!: number;
  @Field(() => Float) cancellationTotalFee!: number;
  @Field(() => Float) cancellationDriverShare!: number;

  @Field(() => Int) searchRadius!: number;
  @Field({ nullable: true }) availableTimeFrom?: string;
  @Field({ nullable: true }) availableTimeTo?: string;
  @Field() bidModeEnabled!: boolean;
  @Field() enabled!: boolean;
  @Field(() => Int) displayOrder!: number;
  @Field({ nullable: true }) iconUrl?: string;
  @Field() isVip!: boolean;

  @Field(() => Int) regionId!: number;

  @Field(() => GraphQLJSON, { nullable: true }) timeMultipliers?: unknown;
  @Field(() => GraphQLJSON, { nullable: true }) weekdayMultipliers?: unknown;
  @Field(() => GraphQLJSON, { nullable: true }) dateRangeMultipliers?: unknown;

  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class CreateServiceInput {
  @Field() name!: string;
  @Field() nameEn!: string;
  @Field() serviceType!: string;
  @Field(() => Int) regionId!: number;

  @Field(() => Float) baseFare!: number;
  @Field(() => Float) perHundredMeters!: number;
  @Field(() => Float) perMinuteDrive!: number;
  @Field(() => Float) perMinuteWait!: number;
  @Field(() => Float) minimumFee!: number;
  @Field(() => Float, { nullable: true }) hourlyRate?: number;
  @Field(() => Float, { nullable: true }) extraMinuteRate?: number;

  @Field(() => Float, { nullable: true }) providerSharePercent?: number;
  @Field({ nullable: true }) bidModeEnabled?: boolean;
  @Field({ nullable: true }) isVip?: boolean;
  @Field({ nullable: true }) iconUrl?: string;
  @Field(() => Int, { nullable: true }) displayOrder?: number;
}

@InputType()
export class UpdateServiceInput {
  @IsOptional() @Field({ nullable: true }) name?: string;
  @IsOptional() @Field({ nullable: true }) nameEn?: string;
  @IsOptional() @Field(() => Float, { nullable: true }) baseFare?: number;
  @IsOptional() @Field(() => Float, { nullable: true }) perHundredMeters?: number;
  @IsOptional() @Field(() => Float, { nullable: true }) perMinuteDrive?: number;
  @IsOptional() @Field(() => Float, { nullable: true }) perMinuteWait?: number;
  @IsOptional() @Field(() => Float, { nullable: true }) minimumFee?: number;
  @IsOptional() @Field(() => Float, { nullable: true }) providerSharePercent?: number;
  @IsOptional() @Field(() => Float, { nullable: true }) cancellationTotalFee?: number;
  @IsOptional() @Field({ nullable: true }) enabled?: boolean;
  @IsOptional() @Field({ nullable: true }) bidModeEnabled?: boolean;
  @IsOptional() @Field({ nullable: true }) isVip?: boolean;
  @IsOptional() @Field({ nullable: true }) iconUrl?: string;
  @IsOptional() @Field(() => Int, { nullable: true }) displayOrder?: number;
  @IsOptional() @Field({ nullable: true }) availableTimeFrom?: string;
  @IsOptional() @Field({ nullable: true }) availableTimeTo?: string;
  @IsOptional() @Field(() => GraphQLJSON, { nullable: true }) timeMultipliers?: unknown;
  @IsOptional() @Field(() => GraphQLJSON, { nullable: true }) weekdayMultipliers?: unknown;
  @IsOptional() @Field(() => GraphQLJSON, { nullable: true }) dateRangeMultipliers?: unknown;
}
