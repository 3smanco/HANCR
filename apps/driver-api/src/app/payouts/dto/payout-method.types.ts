import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

@ObjectType()
export class PayoutMethodType {
  @Field(() => Int) id!: number;
  @Field() type!: string;
  @Field({ nullable: true }) accountName?: string;
  @Field({ nullable: true }) iban?: string;
  @Field({ nullable: true }) bankName?: string;
  @Field({ nullable: true }) phoneNumber?: string;
  @Field() isDefault!: boolean;
  @Field() createdAt!: Date;
}

@InputType()
export class AddPayoutMethodInput {
  @Field()
  @IsString()
  @IsIn(['bank', 'mada', 'stcpay'])
  type!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  iban?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}

@ObjectType()
export class DriverEarningsSummaryType {
  @Field() currency!: string;
  @Field(() => Int) availableBalance!: number;
  @Field(() => Int) pendingPayoutAmount!: number;
  @Field(() => Int) totalEarnedAllTime!: number;
}
