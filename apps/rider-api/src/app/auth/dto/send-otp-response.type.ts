import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SendOtpResponse {
  @Field()
  success!: boolean;

  @Field()
  message!: string;

  /** في بيئة التطوير فقط — رمز OTP للاختبار */
  @Field({ nullable: true })
  devOtp?: string;
}
