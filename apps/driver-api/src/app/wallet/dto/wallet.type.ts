import { ObjectType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import {
  WalletTransactionType,
  WalletTransactionDirection,
  WalletTransactionStatus,
  PaymentGateway,
} from '@hancr/database';

// Register enums with GraphQL (idempotent — NestJS handles duplicates gracefully).
registerEnumType(WalletTransactionType, { name: 'WalletTransactionType' });
registerEnumType(WalletTransactionDirection, { name: 'WalletTransactionDirection' });
registerEnumType(WalletTransactionStatus, { name: 'WalletTransactionStatus' });
registerEnumType(PaymentGateway, { name: 'PaymentGateway' });

@ObjectType()
export class DriverWalletType {
  @Field(() => Float)
  balance!: number;

  @Field()
  currency!: string;
}

@ObjectType()
export class DriverWalletTransactionGqlType {
  @Field(() => Int)
  id!: number;

  @Field(() => WalletTransactionType)
  type!: WalletTransactionType;

  @Field(() => WalletTransactionDirection)
  direction!: WalletTransactionDirection;

  @Field(() => Float)
  amount!: number;

  @Field(() => Float)
  balanceAfter!: number;

  @Field()
  currency!: string;

  @Field(() => WalletTransactionStatus)
  status!: WalletTransactionStatus;

  @Field(() => PaymentGateway)
  gateway!: PaymentGateway;

  @Field({ nullable: true })
  gatewayRef?: string;

  @Field(() => Int, { nullable: true })
  orderId?: number;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt!: Date;

  @Field({ nullable: true })
  completedAt?: Date;
}

@ObjectType()
export class WithdrawalRequestType {
  @Field(() => Int, { description: 'معرّف معاملة السحب (Pending)' })
  transactionId!: number;

  @Field(() => Float, { description: 'القيمة المطلوب سحبها' })
  amount!: number;

  @Field()
  currency!: string;

  @Field(() => WalletTransactionStatus)
  status!: WalletTransactionStatus;

  @Field(() => Float, { description: 'الرصيد بعد الحجز' })
  balanceAfter!: number;
}
