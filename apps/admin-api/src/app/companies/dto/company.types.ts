import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@ObjectType()
export class AdminCompanyType {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field(() => Float) monthlyCapPerEmployee!: number;
  @Field() status!: string;
  @Field() createdAt!: Date;
  @Field(() => Int) employeeCount!: number;
}

@ObjectType()
export class AdminCompanyEmployeeType {
  @Field(() => Int) id!: number;
  @Field(() => Int) companyId!: number;
  @Field(() => Int) riderId!: number;
  @Field({ nullable: true }) riderName?: string;
  @Field({ nullable: true }) riderPhone?: string;
  @Field(() => Float) monthlySpent!: number;
  @Field() monthlyPeriod!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateCompanyInput {
  @Field() @IsString() name!: string;

  @Field({ nullable: true }) @IsOptional() @IsEmail() contactEmail?: string;

  @Field({ nullable: true }) @IsOptional() @IsString() contactPhone?: string;

  @Field({ defaultValue: 'SAR' }) @IsString() currency!: string;

  @Field(() => Float, { defaultValue: 0 })
  @Min(0)
  monthlyCapPerEmployee!: number;
}

@InputType()
export class UpdateCompanyInput {
  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() contactEmail?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() contactPhone?: string;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  monthlyCapPerEmployee?: number;
  @Field({ nullable: true }) @IsOptional() @IsString() status?: string;
}

@InputType()
export class TopUpCompanyInput {
  @Field(() => Int) @IsInt() companyId!: number;

  @Field(() => Float) @Min(0.01) amount!: number;
}

@InputType()
export class AddEmployeeInput {
  @Field(() => Int) @IsInt() companyId!: number;

  /** يُتاح اختيار الراكب إما بـ ID أو رقم هاتفه (الأدمن أسهل) */
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() riderId?: number;

  @Field({ nullable: true }) @IsOptional() @IsString() riderPhone?: string;
}
