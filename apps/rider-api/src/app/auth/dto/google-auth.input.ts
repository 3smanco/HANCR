import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

@InputType()
export class GoogleAuthInput {
  /** Google ID token (JWT) المستخرَج من Google Sign-In على العميل */
  @Field()
  @IsNotEmpty()
  @IsString()
  idToken!: string;

  /** كود إحالة اختياري (عند التسجيل لأول مرة) */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
