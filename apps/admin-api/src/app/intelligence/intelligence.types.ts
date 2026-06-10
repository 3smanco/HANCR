import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

/** N11 — حالة محرّك التسعير الديناميكي (surge). */
@ObjectType()
export class SurgeStateType {
  /** عدد الطلبات في آخر 30 دقيقة. */
  @Field(() => Int) recentDemand!: number;

  /** عدد السائقين المتصلين الآن. */
  @Field(() => Int) driversOnline!: number;

  /** المضاعِف المقترح من النظام (طلب/عرض). */
  @Field(() => Float) suggestedMultiplier!: number;

  /** المضاعِف المطبَّق حالياً (من pricingRulesConfig). */
  @Field(() => Float) currentMultiplier!: number;

  /** هل التفعيل التلقائي مُفعَّل؟ */
  @Field() autoSurge!: boolean;
}
