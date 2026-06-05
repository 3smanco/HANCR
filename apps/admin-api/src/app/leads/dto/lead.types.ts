import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export const LEAD_TYPES = [
  'driver_signup',
  'business',
  'contact',
  'careers',
] as const;
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'rejected',
] as const;

@ObjectType()
export class AdminLeadType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field() name!: string;
  @Field() email!: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) company?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) message?: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
}

@ObjectType()
export class LeadListResult {
  @Field(() => [AdminLeadType]) items!: AdminLeadType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
  @Field(() => Int) newCount!: number;
  @Field(() => Int) contactedCount!: number;
}

@InputType()
export class SubmitLeadInput {
  @Field()
  @IsString()
  @IsIn(LEAD_TYPES as unknown as string[])
  type!: string;

  @Field()
  @IsString()
  @Length(2, 100)
  name!: string;

  @Field()
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  company?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}

@InputType()
export class UpdateLeadStatusInput {
  @Field(() => Int) leadId!: number;

  @Field()
  @IsString()
  @IsIn(LEAD_STATUSES as unknown as string[])
  status!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  note?: string;
}
