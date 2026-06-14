import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** عدد الأعضاء في مستوى ولاء واحد + أميالهم المتاحة. */
@ObjectType()
export class TierBucket {
  @Field() tier!: string; // Bronze | Silver | Gold | Platinum
  @Field(() => Int) members!: number;
  /** الأميال المتاحة (غير المستبدَلة) لهذا المستوى. */
  @Field(() => Float) availableMiles!: number;
}

/**
 * نظرة عالمية على برنامج Hancr Miles — توزيع المستويات + إجمالي الأميال
 * القائمة (التزام مالي) مُقيَّمة بعملة الأساس. استبدال عبر الدول = قيمة موحَّدة.
 */
@ObjectType()
export class GlobalLoyaltyOverview {
  @Field(() => Int) totalMembers!: number;
  @Field(() => [TierBucket]) tiers!: TierBucket[];
  /** إجمالي الأميال المتاحة عبر كل الأعضاء. */
  @Field(() => Float) totalAvailableMiles!: number;
  /** قيمة استبدال الأميال القائمة (التزام) بعملة الأساس. */
  @Field(() => Float) liabilityBase!: number;
  @Field() baseCurrency!: string;
  /** قيمة الميل الواحد بعملة الأساس (للشفافية). */
  @Field(() => Float) mileValueBase!: number;
}
