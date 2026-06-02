import { ObjectType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import {
  WalletTransactionType,
  WalletTransactionDirection,
  WalletTransactionStatus,
  PaymentGateway,
} from '@hancr/database';

// Register enums with GraphQL
registerEnumType(WalletTransactionType, { name: 'WalletTransactionType' });
registerEnumType(WalletTransactionDirection, { name: 'WalletTransactionDirection' });
registerEnumType(WalletTransactionStatus, { name: 'WalletTransactionStatus' });
registerEnumType(PaymentGateway, { name: 'PaymentGateway' });

@ObjectType()
export class WalletType {
  @Field(() => Float)
  balance!: number;

  @Field()
  currency!: string;
}

@ObjectType()
export class WalletTransactionGqlType {
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
export class RechargeCheckoutType {
  @Field(() => Int, { description: 'معرّف المعاملة الداخلي (Pending)' })
  transactionId!: number;

  @Field({ description: 'معرّف المعاملة في الـ gateway' })
  gatewayRef!: string;

  @Field({ nullable: true, description: 'URL لإعادة توجيه المستخدم (HyperPay/Moyasar)' })
  redirectUrl?: string;

  @Field({ nullable: true, description: 'Client secret (Stripe/Apple Pay/Google Pay)' })
  clientSecret?: string;

  @Field(() => PaymentGateway)
  gateway!: PaymentGateway;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field({
    nullable: true,
    description:
      'إذا true: شُحنت المحفظة فوراً (محاكاة) لأن الدفع بالبطاقة معطّل بعد',
  })
  simulated?: boolean;
}
