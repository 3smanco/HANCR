import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class SendEmailOtpInput {
  /** البريد الإلكتروني — يُرسَل إليه رمز التحقق */
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
