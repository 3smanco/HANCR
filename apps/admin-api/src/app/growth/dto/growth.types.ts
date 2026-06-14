import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * نتيجة محاكاة عرض جغرافي — هل ينطبق الكوبون على طلب افتراضي، وكم الخصم،
 * ولماذا رُفِض إن رُفِض. تُمكّن مُسوّق العروض من اختبار السياج الجغرافي والقيود.
 */
@ObjectType()
export class OfferSimulationType {
  @Field() code!: string;
  @Field() valid!: boolean;
  /** سبب الرفض (إن وُجد): expired/region/min_fare/max_uses/inactive… */
  @Field({ nullable: true }) reason?: string;
  /** مبلغ الخصم المحسوب. */
  @Field(() => Float) discount!: number;
  /** الأجرة بعد الخصم. */
  @Field(() => Float) finalFare!: number;
  @Field() currency!: string;
  @Field({ nullable: true }) countryIso?: string;
  @Field({ nullable: true }) countryName?: string;
}

/** تغطية عرض: عدد المناطق/الدول التي يسري فيها الكوبون. */
@ObjectType()
export class OfferReachType {
  @Field() code!: string;
  /** هل العرض عالمي (بلا سياج جغرافي)؟ */
  @Field() global!: boolean;
  /** عدد المناطق المستهدَفة (0 = عالمي). */
  @Field(() => Int) regionCount!: number;
  /** الدول المُغطّاة (أكواد iso2). */
  @Field(() => [String]) countries!: string[];
}
