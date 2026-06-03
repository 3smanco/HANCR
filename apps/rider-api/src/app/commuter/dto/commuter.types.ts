import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

@ObjectType()
export class CommuterSubscriptionType {
  @Field(() => Int) id!: number;
  @Field() homeAddress!: string;
  @Field(() => Float) homeLat!: number;
  @Field(() => Float) homeLng!: number;
  @Field() workAddress!: string;
  @Field(() => Float) workLat!: number;
  @Field(() => Float) workLng!: number;
  @Field({ nullable: true }) outboundTime?: string;
  @Field({ nullable: true }) returnTime?: string;
  @Field(() => [Int]) daysOfWeek!: number[];
  @Field() planType!: string;
  @Field() active!: boolean;
  @Field(() => Int) serviceId!: number;
  @Field(() => Int) regionId!: number;
  @Field(() => Int) leadMinutes!: number;
  @Field() createdAt!: Date;
  /** commuter | school | campus | medical */
  @Field() subscriptionType!: string;
  @Field({ nullable: true }) childName?: string;
  @Field({ nullable: true }) parentPhone?: string;
  @Field({ nullable: true }) medicalNotes?: string;
  @Field() wheelchairNeeded!: boolean;
  /** daily | weekly | biweekly | monthly */
  @Field() recurrence!: string;
  @Field(() => Int, { nullable: true }) preferredDriverId?: number;
  @Field() nightShift!: boolean;
}

@InputType()
export class CommuterSubscriptionInput {
  @Field()
  @IsString()
  homeAddress!: string;

  @Field(() => Float)
  @IsLatitude()
  homeLat!: number;

  @Field(() => Float)
  @IsLongitude()
  homeLng!: number;

  @Field()
  @IsString()
  workAddress!: string;

  @Field(() => Float)
  @IsLatitude()
  workLat!: number;

  @Field(() => Float)
  @IsLongitude()
  workLng!: number;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'outboundTime must be HH:mm' })
  outboundTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'returnTime must be HH:mm' })
  returnTime?: string;

  @Field(() => [Int])
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek!: number[];

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['daily', 'monthly'])
  planType?: string;

  @Field(() => Int)
  @IsInt()
  serviceId!: number;

  @Field(() => Int)
  @IsInt()
  regionId!: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  leadMinutes?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['commuter', 'school', 'campus', 'medical'])
  subscriptionType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  childName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  wheelchairNeeded?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly'])
  recurrence?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  preferredDriverId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  nightShift?: boolean;
}

@InputType()
export class CommuterUpdateInput {
  @Field({ nullable: true }) @IsOptional() @IsBoolean() active?: boolean;
  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  outboundTime?: string;
  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  returnTime?: string;
  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  daysOfWeek?: number[];
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  leadMinutes?: number;
}
