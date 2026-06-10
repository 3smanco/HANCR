import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/** N10 — ربح يوم واحد (لرسم الأرباح + الأهداف اليومية). */
@ObjectType()
export class DailyEarningType {
  /** YYYY-MM-DD */
  @Field() date!: string;

  @Field(() => Float) amount!: number;
}

/** N10 — منطقة طلب ساخنة (heatmap). */
@ObjectType()
export class DemandZoneType {
  @Field(() => Float) lat!: number;
  @Field(() => Float) lng!: number;

  /** عدد الطلبات الأخيرة في هذه المنطقة (كثافة). */
  @Field(() => Int) weight!: number;
}
