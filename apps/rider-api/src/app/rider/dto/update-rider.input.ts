import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class UpdateRiderInput {
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  fcmToken?: string;

  @Field({ nullable: true })
  @IsOptional()
  avatarUrl?: string;

  /** رمز "الفريق" (الدولة) المختار — تجميلي، يُزامن مع الخادم */
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(4)
  teamCode?: string;
}
