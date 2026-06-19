import { ObjectType, Field } from '@nestjs/graphql';
import { RiderType } from '../../rider/dto/rider.type';

@ObjectType()
export class AuthPayload {
  /** JWT Access Token — صالح لـ 7 أيام */
  @Field()
  accessToken!: string;

  /** بيانات الراكب */
  @Field(() => RiderType)
  rider!: RiderType;

  /** هل هذا حساب جديد (أول تسجيل) */
  @Field()
  isNewUser!: boolean;

  /** هل يلزم تحقّق بخطوتين قبل إصدار الجلسة (accessToken يكون فارغاً حينها) */
  @Field({ defaultValue: false })
  twoFactorRequired!: boolean;

  /** رمز مؤقّت يُمرَّر إلى verifyTwoFactor لإكمال الدخول */
  @Field({ nullable: true })
  pendingToken?: string;
}
