import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

@ObjectType()
export class AdminFleetType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field({ nullable: true }) ownerName?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field(() => Float) commissionPercent!: number;
  @Field(() => [Int]) exclusivityRegionIds!: number[];
  @Field() active!: boolean;
  @Field(() => Int) driverCount!: number;
  @Field() createdAt!: Date;
}

@ObjectType()
export class FleetDriverType {
  @Field(() => Int) driverId!: number;
  @Field() driverName!: string;
  @Field({ nullable: true }) phoneNumber?: string;
  @Field({ nullable: true }) plateNumber?: string;
  @Field() approvalStatus!: string;
}

@InputType()
export class CreateFleetInput {
  @Field() @IsString() @MinLength(2) name!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() ownerName?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() contactPhone?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() contactEmail?: string;
  @Field({ defaultValue: 'SAR' }) @IsString() currency!: string;

  @Field(() => Float, { defaultValue: 0 })
  @Min(0)
  @Max(100)
  commissionPercent!: number;

  @Field(() => [Int], { defaultValue: [] })
  @IsArray()
  @IsInt({ each: true })
  exclusivityRegionIds!: number[];
}

@InputType()
export class UpdateFleetInput {
  @Field(() => Int) id!: number;
  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() ownerName?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() contactPhone?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() contactEmail?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  exclusivityRegionIds?: number[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@InputType()
export class TopUpFleetInput {
  @Field(() => Int) fleetId!: number;
  @Field(() => Float) @Min(0.01) amount!: number;
}

@InputType()
export class AssignDriverToFleetInput {
  @Field(() => Int) fleetId!: number;
  @Field(() => Int) @IsInt() driverId!: number;
}
