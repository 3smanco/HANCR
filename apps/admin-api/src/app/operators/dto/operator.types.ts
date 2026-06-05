import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const ADMIN_ROLES = [
  'super',
  'ops',
  'finance',
  'marketing',
  'support',
] as const;

@ObjectType()
export class AdminOperatorType {
  @Field(() => Int) id!: number;
  @Field() email!: string;
  @Field({ nullable: true }) fullName?: string;
  @Field() role!: string;
  @Field() active!: boolean;
  @Field({ nullable: true }) lastLoginAt?: Date;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateOperatorInput {
  @Field() @IsEmail() email!: string;

  @Field() @IsString() @MinLength(8) password!: string;

  @Field({ nullable: true }) @IsOptional() @IsString() fullName?: string;

  @Field()
  @IsString()
  @IsIn(ADMIN_ROLES as unknown as string[])
  role!: string;
}

@InputType()
export class UpdateOperatorInput {
  @Field(() => Int) id!: number;

  @Field({ nullable: true }) @IsOptional() @IsString() fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(ADMIN_ROLES as unknown as string[])
  role?: string;

  @Field({ nullable: true }) @IsOptional() @IsBoolean() active?: boolean;
}

@InputType()
export class ResetOperatorPasswordInput {
  @Field(() => Int) id!: number;
  @Field() @IsString() @MinLength(8) newPassword!: string;
}
