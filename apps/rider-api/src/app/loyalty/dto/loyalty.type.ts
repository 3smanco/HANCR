import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class LoyaltyType {
  @Field(() => Int)
  id!: number;

  @Field(() => Float)
  totalMiles!: number;

  @Field(() => Float)
  availableMiles!: number;

  @Field(() => Float)
  lifetimeMiles!: number;

  /** المستوى: Bronze | Silver | Gold | Platinum */
  @Field()
  tier!: string;

  /** حصانة Surge Pricing حتى هذا التاريخ */
  @Field({ nullable: true })
  surgeImmunityUntil?: Date;

  @Field(() => Int)
  freeUpgradesRemaining!: number;

  @Field()
  hasFreeCancellation!: boolean;

  @Field()
  updatedAt!: Date;
}
