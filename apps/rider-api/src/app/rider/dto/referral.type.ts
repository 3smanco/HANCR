import { Field, Int, ObjectType } from '@nestjs/graphql';

/** بيانات إحالة الراكب — يعرضها التطبيق في شاشة دعوة الأصدقاء */
@ObjectType()
export class ReferralType {
  @Field({ nullable: true, description: 'كود الإحالة الخاص بالراكب' })
  code?: string;

  @Field(() => Int, { description: 'عدد الأصدقاء المُحالين' })
  referredCount!: number;

  @Field(() => Int, { description: 'عدد الإحالات التي تمّت مكافأتها' })
  rewardedCount!: number;
}
