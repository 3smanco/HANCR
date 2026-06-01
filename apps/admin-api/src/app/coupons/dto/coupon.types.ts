import {
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponType } from '@hancr/database';

registerEnumType(CouponType, { name: 'CouponType' });

@ObjectType()
export class AdminCouponType {
  @Field(() => Int) id!: number;
  @Field() code!: string;
  @Field(() => CouponType) type!: CouponType;
  @Field(() => Float) value!: number;
  @Field(() => Float) maxDiscount!: number;
  @Field(() => Float) minFare!: number;
  @Field(() => Int) maxUses!: number;
  @Field(() => Int) usedCount!: number;
  @Field(() => Int) perUserLimit!: number;
  @Field(() => [Int]) regionIds!: number[];
  @Field({ nullable: true }) expiresAt?: Date;
  @Field() active!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateCouponInput {
  @Field()
  @IsString()
  code!: string;

  @Field(() => CouponType)
  @IsEnum(CouponType)
  type!: CouponType;

  @Field(() => Float)
  @Min(0)
  value!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  minFare?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  perUserLimit?: number;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  regionIds?: number[];

  @Field({ nullable: true })
  @IsOptional()
  expiresAt?: Date;
}

@InputType()
export class UpdateCouponInput {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  value?: number;

  @Field(() => CouponType, { nullable: true })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  minFare?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  perUserLimit?: number;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  regionIds?: number[];

  @Field({ nullable: true })
  @IsOptional()
  expiresAt?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
