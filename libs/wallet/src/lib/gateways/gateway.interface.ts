/**
 * IPaymentGateway — العقد الموحَّد لكل بوابات الدفع.
 *
 * كل gateway (HyperPay, Moyasar, Stripe, ...) ينفِّذ نفس الـ interface
 * → سهولة الاختبار + إضافة بوابات جديدة + استبدال أحدها بـ stub في dev.
 */
import { PaymentGateway } from '@hancr/database';

export interface CreateCheckoutInput {
  amount: number; // بالعملة الكاملة (مثل 100.50 SAR)
  currency: string; // ISO 4217 (SAR, AED, USD, ...)
  internalRef: string; // ID المعاملة الداخلي (للـ webhook matching)
  customer?: { email?: string; name?: string; phone?: string };
  returnUrl?: string;
  webhookUrl?: string;
}

export interface CheckoutResult {
  gatewayRef: string;
  redirectUrl?: string;
  clientSecret?: string;
  gateway: PaymentGateway;
}

export interface WebhookEvent {
  gatewayRef: string;
  internalRef: string;
  status: 'success' | 'failure' | 'pending';
  amount: number;
  currency: string;
  rawPayload: Record<string, unknown>;
}

export interface IPaymentGateway {
  readonly name: PaymentGateway;

  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;

  /**
   * verify HMAC/signature + parse الـ webhook payload.
   * يرمي إذا التوقيع غير صحيح (هذا حرج للأمان!).
   */
  verifyAndParseWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent;
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(`Webhook verification failed: ${message}`);
    this.name = 'WebhookVerificationError';
  }
}
