import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentGateway } from '@hancr/database';
import {
  IPaymentGateway,
  CreateCheckoutInput,
  CheckoutResult,
  WebhookEvent,
  WebhookVerificationError,
  extractRawBody,
} from './gateway.interface';

/**
 * StripeGateway — يخدم Stripe + ApplePay + GooglePay (كلها عبر Payment Intent).
 *
 * Flow:
 *  1. POST /v1/payment_intents → returns { id, client_secret }
 *  2. Frontend (Flutter/Web) يستخدم client_secret مع Stripe SDK
 *  3. عند نجاح الدفع → Stripe يستدعي webhookUrl
 *  4. verifyAndParseWebhook يتحقق من Stripe-Signature
 *
 * Docs: https://stripe.com/docs/api/payment_intents
 *
 * Env vars:
 *   STRIPE_SECRET_KEY     — sk_live_... أو sk_test_...
 *   STRIPE_WEBHOOK_SECRET — whsec_... من dashboard
 *
 * Stripe يستخدم amounts بالـ smallest currency unit (cents/halalas).
 */
@Injectable()
export class StripeGateway implements IPaymentGateway {
  readonly name = PaymentGateway.Stripe;
  private readonly logger = new Logger(StripeGateway.name);
  private readonly baseUrl = 'https://api.stripe.com';

  // العملات الـ zero-decimal (لا تُضرب بـ 100)
  private static readonly ZERO_DECIMAL = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
    'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
  ]);

  constructor(private readonly config: ConfigService) {}

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const apiKey = this._requireEnv('STRIPE_SECRET_KEY');

    const isZeroDecimal = StripeGateway.ZERO_DECIMAL.has(input.currency);
    const amount = isZeroDecimal
      ? Math.round(input.amount)
      : Math.round(input.amount * 100);

    const params = new URLSearchParams({
      amount: amount.toString(),
      currency: input.currency.toLowerCase(),
      'metadata[internal_ref]': input.internalRef,
      'automatic_payment_methods[enabled]': 'true',
      description: `HANCR — Wallet recharge ${input.internalRef}`,
    });

    if (input.customer?.email) {
      params.append('receipt_email', input.customer.email);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/payment_intents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Version': '2024-11-20.acacia',
        },
        body: params.toString(),
        // مهلة: اتصال معلّق لا يحبس الطلب/الحدث للأبد.
        signal: AbortSignal.timeout(10_000),
      });

      const data = (await response.json()) as {
        id?: string;
        client_secret?: string;
        error?: { message?: string };
      };

      if (!response.ok || !data.id || !data.client_secret) {
        throw new Error(
          `Stripe PI failed: ${data.error?.message ?? 'unknown'}`,
        );
      }

      this.logger.log(`Stripe PaymentIntent created: ${data.id}`);

      return {
        gatewayRef: data.id,
        clientSecret: data.client_secret,
        gateway: this.name,
      };
    } catch (e) {
      this.logger.error(`Stripe error: ${(e as Error).message}`);
      throw e;
    }
  }

  verifyAndParseWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent {
    const secret = this._requireEnv('STRIPE_WEBHOOK_SECRET');

    // Stripe signature format: t=timestamp,v1=signature
    const sigHeader = headers['stripe-signature'] ?? headers['Stripe-Signature'];
    if (!sigHeader) {
      throw new WebhookVerificationError('Missing Stripe-Signature header');
    }

    const parts = sigHeader.split(',').reduce<Record<string, string>>(
      (acc, p) => {
        const [k, v] = p.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      },
      {},
    );

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) {
      throw new WebhookVerificationError('Malformed Stripe-Signature');
    }

    // تحقق من الـ timestamp (يجب أن يكون ضمن 5 دقائق)
    const tsAge = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
    if (tsAge > 300) {
      throw new WebhookVerificationError(`Webhook too old (${tsAge}s)`);
    }

    // أمن: التوقيع يُحسب على البايتات الخام كما وصلت، لا على إعادة تسلسل الكائن.
    const { raw, parsed } = extractRawBody(body);
    const payload = `${timestamp}.${raw}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new WebhookVerificationError('Invalid Stripe signature');
    }

    const event = parsed as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          status?: string;
          amount?: number;
          currency?: string;
          metadata?: { internal_ref?: string };
        };
      };
    };

    const pi = event.data?.object ?? {};
    const eventType = event.type ?? '';

    let status: 'success' | 'failure' | 'pending' = 'pending';
    if (
      eventType === 'payment_intent.succeeded' ||
      pi.status === 'succeeded'
    )
      status = 'success';
    else if (
      eventType === 'payment_intent.payment_failed' ||
      pi.status === 'canceled' ||
      pi.status === 'requires_payment_method'
    )
      status = 'failure';

    const currency = (pi.currency ?? 'usd').toUpperCase();
    const isZeroDecimal = StripeGateway.ZERO_DECIMAL.has(currency);
    const amount = isZeroDecimal
      ? pi.amount ?? 0
      : (pi.amount ?? 0) / 100;

    return {
      gatewayRef: pi.id ?? 'unknown',
      internalRef: pi.metadata?.internal_ref ?? '',
      status,
      amount,
      currency,
      rawPayload: event as Record<string, unknown>,
    };
  }

  private _requireEnv(key: string): string {
    const value = this.config.get<string>(key);
    if (!value || value.startsWith('YOUR_') || value.startsWith('your_')) {
      throw new Error(`${key} is not configured`);
    }
    return value;
  }
}
