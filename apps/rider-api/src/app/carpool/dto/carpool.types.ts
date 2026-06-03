import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsString,
  Max,
  Min,
} from 'class-validator';

@ObjectType()
export class CarpoolRequestType {
  @Field(() => Int) id!: number;
  @Field() originAddress!: string;
  @Field(() => Float) originLat!: number;
  @Field(() => Float) originLng!: number;
  @Field() destinationAddress!: string;
  @Field(() => Float) destinationLat!: number;
  @Field(() => Float) destinationLng!: number;
  @Field() scheduledAt!: Date;
  @Field(() => Int) maxRiders!: number;
  @Field() trustMode!: string;
  @Field() status!: string;
  @Field(() => Float) discountPercent!: number;
  @Field(() => Int, { nullable: true }) matchId?: number;
  @Field(() => Int, { nullable: true }) orderId?: number;
  @Field(() => Int) serviceId!: number;
  @Field(() => Int) regionId!: number;
  @Field() createdAt!: Date;
}

@InputType()
export class CarpoolRequestInput {
  @Field()
  @IsString()
  originAddress!: string;

  @Field(() => Float)
  @IsLatitude()
  originLat!: number;

  @Field(() => Float)
  @IsLongitude()
  originLng!: number;

  @Field()
  @IsString()
  destinationAddress!: string;

  @Field(() => Float)
  @IsLatitude()
  destinationLat!: number;

  @Field(() => Float)
  @IsLongitude()
  destinationLng!: number;

  /** ISO timestamp */
  @Field()
  @IsString()
  scheduledAt!: string;

  @Field(() => Int)
  @IsInt()
  @Min(2)
  @Max(4)
  maxRiders!: number;

  @Field()
  @IsIn(['open', 'women_only', 'family'])
  trustMode!: string;

  @Field(() => Int)
  @IsInt()
  serviceId!: number;

  @Field(() => Int)
  @IsInt()
  regionId!: number;
}
