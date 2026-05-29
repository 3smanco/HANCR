import { InputType, Field } from '@nestjs/graphql';
import { IsPhoneNumber, IsNotEmpty } from 'class-validator';

@InputType()
export class SendOtpInput {
  /** رقم الهاتف بالصيغة الدولية — مثال: +97412345678 */
  @Field()
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;
}
