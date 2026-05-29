// =============================================
// @hancr/wallet — Wallet ledger + Payment gateways
// =============================================

export { WalletModule } from './lib/wallet.module';
export { WalletService } from './lib/wallet.service';
export {
  PaymentGatewayService,
  type CreateCheckoutInput,
  type CheckoutResult,
  type WebhookEvent,
  type IPaymentGateway,
  WebhookVerificationError,
} from './lib/payment-gateway.service';
export {
  type CreateTransactionInput,
  type WalletOperationResult,
  InsufficientBalanceError,
} from './lib/dto/transaction.dto';

// Gateway implementations (للاختبار + dependency injection المتقدِّم)
export { HyperPayGateway } from './lib/gateways/hyperpay.gateway';
export { MoyasarGateway } from './lib/gateways/moyasar.gateway';
export { StripeGateway } from './lib/gateways/stripe.gateway';
