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

/** النطاق الجغرافي للمشغّل (RBAC مُنطقَن). null/فارغ = عالمي. */
@ObjectType()
export class OperatorScopeType {
  @Field(() => [String], { nullable: true }) countries?: string[];
  @Field(() => [Int], { nullable: true }) cities?: number[];
}

@InputType()
export class OperatorScopeInput {
  @Field(() => [String], { nullable: true }) @IsOptional() countries?: string[];
  @Field(() => [Int], { nullable: true }) @IsOptional() cities?: number[];
}

@ObjectType()
export class AdminOperatorType {
  @Field(() => Int) id!: number;
  @Field() email!: string;
  @Field({ nullable: true }) fullName?: string;
  @Field() role!: string;
  /** النطاق الجغرافي (null = عالمي). */
  @Field(() => OperatorScopeType, { nullable: true }) scope?: OperatorScopeType;
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

  @Field(() => OperatorScopeInput, { nullable: true })
  @IsOptional()
  scope?: OperatorScopeInput;
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

  @Field(() => OperatorScopeInput, { nullable: true })
  @IsOptional()
  scope?: OperatorScopeInput;
}

@InputType()
export class ResetOperatorPasswordInput {
  @Field(() => Int) id!: number;
  @Field() @IsString() @MinLength(8) newPassword!: string;
}
