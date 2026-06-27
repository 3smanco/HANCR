import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway } from '@hancr/database';
import { HyperPayGateway } from './gateways/hyperpay.gateway';
import { MoyasarGateway } from './gateways/moyasar.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { GatewayCredentials } from './gateways/gateway-credentials.service';
import {
  CreateCheckoutInput,
  CheckoutResult,
  WebhookEvent,
  IPaymentGateway,
} from './gateways/gateway.interface';

// Re-export للـ backward compatibility
export {
  type CreateCheckoutInput,
  type CheckoutResult,
  type WebhookEvent,
  type IPaymentGateway,
  WebhookVerificationError,
} from './gateways/gateway.interface';

/**
 * PaymentGatewayService — registry موحَّد لكل البوابات.
 *
 * يَستخدم الـ implementations الحقيقية (HyperPay/Moyasar/Stripe) إذا كانت
 * الـ credentials configured، وإلا يقع على stub mode (للـ dev).
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly gateways: Map<PaymentGateway, IPaymentGateway>;

  constructor(
    private readonly config: ConfigService,
    private readonly creds: GatewayCredentials,
    private readonly hyperPay: HyperPayGateway,
    private readonly moyasar: MoyasarGateway,
    private readonly stripe: StripeGateway,
  ) {
    this.gateways = new Map<PaymentGateway, IPaymentGateway>([
      [PaymentGateway.HyperPay, hyperPay],
      [PaymentGateway.Moyasar, moyasar],
      [PaymentGateway.Stripe, stripe],
      [PaymentGateway.ApplePay, stripe], // عبر Stripe Payment Intent
      [PaymentGateway.GooglePay, stripe], // عبر Stripe Payment Intent
    ]);
  }

  /** Stub mode عند غياب أي مفاتيح (DB أو env). يُحدَّث ديناميكياً من اللوحة. */
  private isStub(): boolean {
    return !this.creds.hasAny();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Create checkout
  // ─────────────────────────────────────────────────────────────────────────

  async createCheckout(
    gateway: PaymentGateway,
    input: CreateCheckoutInput,
  ): Promise<CheckoutResult> {
    const impl = this.gateways.get(gateway);
    if (!impl) {
      throw new Error(`Unsupported gateway: ${gateway}`);
    }

    await this.creds.ensureLoaded();
    if (this.isStub()) {
      return this._createStubCheckout(gateway, input);
    }

    try {
      return await impl.createCheckout(input);
    } catch (e) {
      const isProd = this.config.get<string>('NODE_ENV') === 'production';
      this.logger.error(
        `Gateway ${gateway} failed: ${(e as Error).message}`,
      );
      if (isProd) throw e;
      // dev/staging: fall back على stub
      this.logger.warn('Falling back to stub mode (non-production)');
      return this._createStubCheckout(gateway, input);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Webhook handling مع HMAC verification
  // ─────────────────────────────────────────────────────────────────────────

  /** parseWebhook — للـ backward compat. */
  parseWebhook(
    gateway: PaymentGateway,
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent {
    return this.verifyAndParseWebhook(gateway, headers, body);
  }

  /**
   * verifyAndParseWebhook — HMAC verification + parse.
   * يرمي WebhookVerificationError لو signature غير صحيح (لا تَتجاهل الـ exception!).
   */
  verifyAndParseWebhook(
    gateway: PaymentGateway,
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent {
    if (this.isStub()) {
      this.logger.warn(
        `[stub] Webhook NOT verified for ${gateway}. لا تستخدم في الإنتاج!`,
      );
      return this._parseStubWebhook(body);
    }

    const impl = this.gateways.get(gateway);
    if (!impl) {
      throw new Error(`Unsupported gateway: ${gateway}`);
    }
    return impl.verifyAndParseWebhook(headers, body);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stub mode (dev only)
  // ─────────────────────────────────────────────────────────────────────────

  private _createStubCheckout(
    gateway: PaymentGateway,
    _input: CreateCheckoutInput,
  ): CheckoutResult {
    const suffix = Math.random().toString(36).slice(2, 10);
    if (
      gateway === PaymentGateway.Stripe ||
      gateway === PaymentGateway.ApplePay ||
      gateway === PaymentGateway.GooglePay
    ) {
      return {
        gatewayRef: `pi_stub_${suffix}`,
        clientSecret: `pi_stub_${suffix}_secret`,
        gateway,
      };
    }
    const prefix =
      gateway === PaymentGateway.HyperPay
        ? 'hpay'
        : gateway === PaymentGateway.Moyasar
        ? 'moy'
        : 'stub';
    const ref = `${prefix}_${suffix}`;
    return {
      gatewayRef: ref,
      redirectUrl: `https://stub.hancr.local/pay?ref=${ref}`,
      gateway,
    };
  }

  private _parseStubWebhook(body: unknown): WebhookEvent {
    const payload = body as {
      id?: string;
      status?: string;
      amount?: number;
      currency?: string;
      internal_ref?: string;
    };
    const raw = payload.status?.toLowerCase() ?? '';
    let status: 'success' | 'failure' | 'pending' = 'pending';
    if (['paid', 'success', 'succeeded', 'completed'].includes(raw))
      status = 'success';
    else if (['failed', 'declined', 'rejected', 'expired'].includes(raw))
      status = 'failure';

    return {
      gatewayRef: payload.id ?? 'stub',
      internalRef: payload.internal_ref ?? '',
      status,
      amount: payload.amount ?? 0,
      currency: payload.currency ?? 'SAR',
      rawPayload: payload as Record<string, unknown>,
    };
  }
}
