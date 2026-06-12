import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  Length,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class VerifyEmailOtpInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** رمز OTP المرسَل للبريد */
  @Field()
  @IsNotEmpty()
  @Length(4, 6)
  code!: string;

  /** كود إحالة اختياري (عند التسجيل لأول مرة) */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
