import { Field, Float, ObjectType } from '@nestjs/graphql';

/**
 * نتيجة معاينة الكوبون قبل الطلب — يعرضها الراكب لمشاهدة الخصم.
 */
@ObjectType()
export class CouponPreviewType {
  @Field()
  code!: string;

  @Field(() => Float)
  discountAmount!: number;

  @Field(() => Float)
  costAfterCoupon!: number;
}
