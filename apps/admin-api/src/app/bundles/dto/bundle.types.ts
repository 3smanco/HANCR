import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

@ObjectType()
export class AdminBundleType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field(() => Int) ridesCount!: number;
  @Field(() => Float) price!: number;
  @Field() currency!: string;
  @Field(() => Int) validityDays!: number;
  @Field(() => Float) maxDistanceKm!: number;
  @Field(() => Int) regionId!: number;
  @Field() active!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateBundleInput {
  @Field() @IsString() name!: string;

  @Field(() => Int) @IsInt() @Min(1) ridesCount!: number;

  @Field(() => Float) @Min(0) price!: number;

  @Field({ defaultValue: 'SAR' }) @IsString() currency!: string;

  @Field(() => Int, { defaultValue: 30 }) @IsInt() @Min(1) validityDays!: number;

  @Field(() => Float, { defaultValue: 0 }) @Min(0) maxDistanceKm!: number;

  @Field(() => Int) @IsInt() regionId!: number;
}

@InputType()
export class UpdateBundleInput {
  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  ridesCount?: number;

  @Field(() => Float, { nullable: true }) @IsOptional() @Min(0) price?: number;

  @Field({ nullable: true }) @IsOptional() @IsString() currency?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  maxDistanceKm?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @Field({ nullable: true }) @IsOptional() @IsBoolean() active?: boolean;
}
