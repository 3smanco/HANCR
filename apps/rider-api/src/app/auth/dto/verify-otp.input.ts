import { InputType, Field } from '@nestjs/graphql';
import { IsPhoneNumber, IsNotEmpty, Length } from 'class-validator';

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
}
