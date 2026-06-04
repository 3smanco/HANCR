import {
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { WalletOwnerType } from '@hancr/database';

registerEnumType(WalletOwnerType, { name: 'WalletOwnerType' });

@ObjectType()
export class WalletBalanceRowType {
  @Field(() => Int) ownerId!: number;
  @Field() ownerType!: string;
  @Field() name!: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => Float) balance!: number;
  @Field() currency!: string;
  @Field({ nullable: true }) status?: string;
}

@ObjectType()
export class WalletBalanceListResult {
  @Field(() => [WalletBalanceRowType]) items!: WalletBalanceRowType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}

@ObjectType()
export class AdminWalletTransactionType {
  @Field(() => Int) id!: number;
  @Field() ownerType!: string;
  @Field(() => Int) ownerId!: number;
  @Field() type!: string;
  @Field() direction!: string;
  @Field(() => Float) amount!: number;
  @Field(() => Float) balanceAfter!: number;
  @Field() currency!: string;
  @Field() status!: string;
  @Field({ nullable: true }) gateway?: string;
  @Field(() => Int, { nullable: true }) orderId?: number;
  @Field({ nullable: true }) description?: string;
  @Field() createdAt!: Date;
  @Field({ nullable: true }) completedAt?: Date;
}

@ObjectType()
export class WalletTransactionsResult {
  @Field(() => [AdminWalletTransactionType])
  items!: AdminWalletTransactionType[];
  @Field(() => Int) total!: number;
  @Field(() => Float) totalCredits!: number;
  @Field(() => Float) totalDebits!: number;
}

@InputType()
export class AdjustWalletInput {
  @Field(() => WalletOwnerType)
  @IsEnum(WalletOwnerType)
  ownerType!: WalletOwnerType;

  @Field(() => Int) @IsInt() ownerId!: number;

  /** موجبة = إضافة (credit) ، سالبة = خصم (debit) */
  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
