import { ObjectType, Field } from '@nestjs/graphql';

/** ناتج بدء إعداد 2FA — يُعرض كرمز QR في التطبيق */
@ObjectType()
export class TwoFactorSetupType {
  /** السرّ (base32) لإدخاله يدوياً في المُصادِق */
  @Field()
  secret!: string;

  /** otpauth:// URI لتوليد رمز QR */
  @Field()
  otpauthUri!: string;
}

/** أكواد الاسترداد — تُعرض مرّة واحدة فقط بعد التفعيل */
@ObjectType()
export class TwoFactorRecoveryType {
  @Field(() => [String])
  recoveryCodes!: string[];
}
