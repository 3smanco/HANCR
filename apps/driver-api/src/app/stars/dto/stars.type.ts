import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class StarsType {
  @Field(() => Int) id!: number;
  @Field(() => Float) totalStars!: number;
  @Field(() => Float) currentCommissionPercent!: number;
  @Field(() => Int) completedRides!: number;
  @Field(() => Float) averageRating!: number;
  @Field(() => Float) starsFromRating!: number;
  @Field(() => Float) starsFromLongTrips!: number;
  @Field(() => Float) starsFromPeakHours!: number;
  @Field(() => Float) starsFromNoCancel!: number;
  @Field(() => Int) noCancelStreakWeeks!: number;

  /** المستوى التالي: عدد النجوم المطلوبة للوصول إلى نسبة عمولة أقل */
  @Field(() => Float) starsToNextLevel!: number;
  @Field(() => Float) nextCommissionPercent!: number;

  @Field() updatedAt!: Date;
}
