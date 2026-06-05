import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

@ObjectType()
export class CancelReasonType {
  @Field(() => Int) id!: number;
  @Field() code!: string;
  @Field() labelAr!: string;
  @Field() labelEn!: string;
  @Field() appliesTo!: string;
  @Field(() => Int) sortOrder!: number;
  @Field() active!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class UpsertCancelReasonInput {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() id?: number;
  @Field() @IsString() @MinLength(2) code!: string;
  @Field() @IsString() labelAr!: string;
  @Field() @IsString() labelEn!: string;

  @Field()
  @IsString()
  @IsIn(['rider', 'driver', 'both'])
  appliesTo!: string;

  @Field(() => Int, { defaultValue: 0 }) @IsInt() sortOrder!: number;
  @Field({ defaultValue: true }) @IsBoolean() active!: boolean;
}

@ObjectType()
export class ReviewParameterType {
  @Field(() => Int) id!: number;
  @Field() code!: string;
  @Field() labelAr!: string;
  @Field() labelEn!: string;
  @Field() target!: string;
  @Field(() => Int) sortOrder!: number;
  @Field() active!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class UpsertReviewParameterInput {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() id?: number;
  @Field() @IsString() @MinLength(2) code!: string;
  @Field() @IsString() labelAr!: string;
  @Field() @IsString() labelEn!: string;

  @Field()
  @IsString()
  @IsIn(['driver', 'rider'])
  target!: string;

  @Field(() => Int, { defaultValue: 0 }) @IsInt() sortOrder!: number;
  @Field({ defaultValue: true }) @IsBoolean() active!: boolean;
}
