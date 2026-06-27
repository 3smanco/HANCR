import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WalletTransactionEntity,
  RiderEntity,
  DriverEntity,
  AppConfigEntity,
} from '@hancr/database';
import { WalletService } from './wallet.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { GatewayCredentials } from './gateways/gateway-credentials.service';
import { HyperPayGateway } from './gateways/hyperpay.gateway';
import { MoyasarGateway } from './gateways/moyasar.gateway';
import { StripeGateway } from './gateways/stripe.gateway';

/**
 * @hancr/wallet — يوفِّر:
 *  - `WalletService` — credit/debit/listTransactions
 *  - `PaymentGatewayService` — registry لكل gateways
 *  - Gateway implementations: HyperPay, Moyasar, Stripe (+ApplePay/GooglePay)
 *
 * `@Global()` لأن المحفظة تُستخدم في الـ 3 APIs بدون استيراد متكرر.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      WalletTransactionEntity,
      RiderEntity,
      DriverEntity,
      AppConfigEntity,
    ]),
  ],
  providers: [
    WalletService,
    PaymentGatewayService,
    GatewayCredentials,
    HyperPayGateway,
    MoyasarGateway,
    StripeGateway,
  ],
  exports: [WalletService, PaymentGatewayService, TypeOrmModule],
})
export class WalletModule {}
