import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsString, MinLength } from 'class-validator';

@ObjectType()
export class AdminLoyaltyType {
  @Field(() => Int) riderId!: number;
  @Field() tier!: string; // Bronze | Silver | Gold | Platinum
  @Field(() => Int) totalMiles!: number;
  @Field(() => Int) availableMiles!: number;
  @Field(() => Int) lifetimeMiles!: number;
  @Field(() => Int) freeUpgradesRemaining!: number;
  @Field() hasFreeCancellation!: boolean;
  @Field({ nullable: true }) surgeImmunityUntil?: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class AdjustLoyaltyInput {
  @Field(() => Int) @IsInt() riderId!: number;

  /** Positive to add, negative to deduct */
  @Field(() => Int) @IsInt() delta!: number;

  @Field()
  @IsString()
  @MinLength(3)
  reason!: string;
}
