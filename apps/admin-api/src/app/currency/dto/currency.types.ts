import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class RateEntry {
  @Field() currency!: string;
  /** السعر لكل 1 من عملة الأساس (USD). */
  @Field(() => Float) rate!: number;
}

@ObjectType()
export class ExchangeRatesType {
  /** عملة الأساس للأسعار (USD). */
  @Field() base!: string;
  /** عملة العرض الأساسية الموحّدة للوحة. */
  @Field() displayBase!: string;
  /** مصدر الأسعار: live | fallback. */
  @Field() source!: string;
  /** آخر مزامنة ناجحة (null إن احتياطي). */
  @Field({ nullable: true }) lastSync?: Date;
  /** عدد العملات المتاحة. */
  @Field() count!: number;
  /** الأسعار. */
  @Field(() => [RateEntry]) rates!: RateEntry[];
}
