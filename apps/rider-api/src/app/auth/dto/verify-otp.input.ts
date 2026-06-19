import { InputType, Field } from '@nestjs/graphql';
import {
  IsPhoneNumber,
  IsNotEmpty,
  Length,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class VerifyOtpInput {
  /** رقم الهاتف */
  @Field()
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  /** رمز OTP (4 أرقام) */
  @Field()
  @IsNotEmpty()
  @Length(4, 6)
  code!: string;

  /** كود إحالة اختياري (عند التسجيل لأول مرة) */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referralCode?: string;

  /**
   * رمز ربط مؤقّت من دخول Google/الإيميل — عند وجوده يُربط الإيميل/googleId
   * بحساب الهاتف (إنشاءً أو دمجاً) بعد التحقق الناجح من OTP.
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pendingToken?: string;

  /** اسم الجهاز (لعرضه في قائمة الأجهزة) */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  deviceName?: string;

  /** المنصّة: android / ios / web */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 16)
  platform?: string;
}
