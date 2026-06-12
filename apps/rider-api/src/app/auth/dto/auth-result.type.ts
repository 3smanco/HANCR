import { ObjectType, Field } from '@nestjs/graphql';
import { RiderType } from '../../rider/dto/rider.type';

/**
 * AuthResult — نتيجة موحّدة للدخول بالإيميل/Google.
 *
 * حالتان:
 *  - دخول كامل: `accessToken` + `rider` (needsPhone=false).
 *  - يحتاج ربط هاتف: `needsPhone=true` + `pendingToken` (رمز قصير الأجل
 *    يُمرَّر لاحقاً مع verifyOtp لإكمال إنشاء/دمج الحساب بالهاتف).
 */
@ObjectType()
export class AuthResult {
  @Field()
  success!: boolean;

  /** يحتاج المستخدم لربط رقم هاتف قبل إكمال الحساب */
  @Field()
  needsPhone!: boolean;

  /** رمز مؤقّت (15 دقيقة) يحمل الإيميل/googleId — يُمرَّر مع verifyOtp */
  @Field({ nullable: true })
  pendingToken?: string;

  /** JWT — موجود فقط عند الدخول الكامل (needsPhone=false) */
  @Field({ nullable: true })
  accessToken?: string;

  /** بيانات الراكب — موجودة فقط عند الدخول الكامل */
  @Field(() => RiderType, { nullable: true })
  rider?: RiderType;

  @Field({ nullable: true })
  isNewUser?: boolean;

  @Field({ nullable: true })
  message?: string;
}
