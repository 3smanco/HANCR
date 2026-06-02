import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * نتيجة استبدال نقاط الولاء برصيد محفظة.
 */
@ObjectType()
export class RedeemResultType {
  @Field()
  success!: boolean;

  @Field(() => Int)
  redeemedMiles!: number;

  @Field(() => Float)
  creditedAmount!: number;

  @Field()
  currency!: string;

  @Field(() => Float)
  remainingMiles!: number;
}
