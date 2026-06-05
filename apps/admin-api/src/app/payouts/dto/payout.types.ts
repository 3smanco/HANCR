import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class EligibleDriverType {
  @Field(() => Int) driverId!: number;
  @Field() driverName!: string;
  @Field({ nullable: true }) phoneNumber?: string;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field(() => Int, { nullable: true }) defaultPayoutMethodId?: number;
  @Field({ nullable: true }) defaultMethodSummary?: string;
}

@ObjectType()
export class PayoutEntryType {
  @Field(() => Int) id!: number;
  @Field(() => Int) sessionId!: number;
  @Field(() => Int) driverId!: number;
  @Field({ nullable: true }) driverName?: string;
  @Field({ nullable: true }) driverPhone?: string;
  @Field(() => Float) amount!: number;
  @Field(() => Int, { nullable: true }) payoutMethodId?: number;
  @Field({ nullable: true }) methodSummary?: string;
  @Field() status!: string;
  @Field({ nullable: true }) gatewayRef?: string;
  @Field({ nullable: true }) errorMessage?: string;
  @Field() createdAt!: Date;
  @Field({ nullable: true }) completedAt?: Date;
}

@ObjectType()
export class PayoutSessionType {
  @Field(() => Int) id!: number;
  @Field(() => Int, { nullable: true }) initiatedBy?: number;
  @Field(() => Float) totalAmount!: number;
  @Field() currency!: string;
  @Field(() => Int) driverCount!: number;
  @Field() mode!: string;
  @Field() status!: string;
  @Field({ nullable: true }) note?: string;
  @Field() createdAt!: Date;
  @Field({ nullable: true }) completedAt?: Date;
}

@ObjectType()
export class PayoutSessionDetailType extends PayoutSessionType {
  @Field(() => [PayoutEntryType]) entries!: PayoutEntryType[];
}

@InputType()
export class CreatePayoutSessionInput {
  @Field(() => [Int])
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  driverIds!: number[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
