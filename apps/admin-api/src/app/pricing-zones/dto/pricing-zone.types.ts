import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

@ObjectType()
export class AdminPricingZoneType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field(() => Int) regionId!: number;
  @Field(() => Int) serviceId!: number;
  @Field(() => Int, { nullable: true }) fleetId?: number;
  @Field(() => Float) baseFare!: number;
  @Field(() => Float) perKm!: number;
  @Field(() => Float) perMinute!: number;
  @Field(() => Float) multiplier!: number;
  @Field({ nullable: true }) startsAt?: Date;
  @Field({ nullable: true }) endsAt?: Date;
  @Field() active!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class UpsertPricingZoneInput {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() id?: number;
  @Field() @IsString() @MinLength(2) name!: string;
  @Field(() => Int) @IsInt() regionId!: number;
  @Field(() => Int) @IsInt() serviceId!: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() fleetId?: number;
  @Field(() => Float, { defaultValue: 0 }) @Min(0) baseFare!: number;
  @Field(() => Float, { defaultValue: 0 }) @Min(0) perKm!: number;
  @Field(() => Float, { defaultValue: 0 }) @Min(0) perMinute!: number;

  @Field(() => Float, { defaultValue: 1.0 })
  @Min(0.1)
  @Max(10)
  multiplier!: number;

  @Field({ nullable: true }) @IsOptional() startsAt?: Date;
  @Field({ nullable: true }) @IsOptional() endsAt?: Date;
  @Field({ defaultValue: true }) @IsBoolean() active!: boolean;
}
