import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@ObjectType()
export class FlightTrackingType {
  @Field(() => Int) id!: number;
  @Field() flightNumber!: string;
  @Field() flightDate!: string;
  @Field() pickupAddress!: string;
  @Field(() => Float) pickupLat!: number;
  @Field(() => Float) pickupLng!: number;
  @Field({ nullable: true }) scheduledArrival?: Date;
  @Field(() => Int) serviceId!: number;
  @Field(() => Int) regionId!: number;
  @Field() pickupTriggered!: boolean;
  @Field(() => Int, { nullable: true }) orderId?: number;
  @Field() status!: string;
  @Field() createdAt!: Date;
}

@InputType()
export class FlightTrackingInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'flightNumber alphanumeric only' })
  flightNumber!: string;

  /** YYYY-MM-DD */
  @Field()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'flightDate must be YYYY-MM-DD' })
  flightDate!: string;

  @Field()
  @IsString()
  pickupAddress!: string;

  @Field(() => Float)
  @IsLatitude()
  pickupLat!: number;

  @Field(() => Float)
  @IsLongitude()
  pickupLng!: number;

  @Field(() => Int)
  @IsInt()
  serviceId!: number;

  @Field(() => Int)
  @IsInt()
  regionId!: number;
}
