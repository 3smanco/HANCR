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
import { GatewayCredentials } from './gateway-credentials.service';

/**
 * MoyasarGateway — البوابة السعودية الرئيسية.
 *
 * Flow:
 *  1. POST /v1/invoices → returns invoice مع url
 *  2. Redirect customer إلى invoice.url
 *  3. Customer يدفع → Moyasar يستدعي webhook
 *
 * Docs: https://docs.moyasar.com/
 *
 * Env vars:
 *   MOYASAR_API_KEY        — sk_live_... أو sk_test_...
 *   MOYASAR_WEBHOOK_SECRET — secret من dashboard للـ HMAC verification
 *
 * Moyasar يستخدم amounts بالـ halalas (1 SAR = 100 halalas).
 */
@Injectable()
export class MoyasarGateway implements IPaymentGateway {
  readonly name = PaymentGateway.Moyasar;
  private readonly logger = new Logger(MoyasarGateway.name);
  private readonly baseUrl = 'https://api.moyasar.com';

  constructor(
    private readonly config: ConfigService,
    private readonly creds: GatewayCredentials,
  ) {}

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    await this.creds.ensureLoaded();
    const apiKey = this._requireEnv('MOYASAR_API_KEY');

    // Moyasar يحتاج amount بالـ halalas (لا decimals)
    const amountHalalas = Math.round(input.amount * 100);

    const payload = {
      amount: amountHalalas,
      currency: input.currency,
      description: `HANCR — Wallet recharge (ref: ${input.internalRef})`,
      callback_url: input.returnUrl,
      // Moyasar يستخدم meta لربط بالـ internal ref
      metadata: { internal_ref: input.internalRef },
    };

    try {
      const auth = Buffer.from(`${apiKey}:`).toString('base64');
      const response = await fetch(`${this.baseUrl}/v1/invoices`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      const data = (await response.json()) as {
        id?: string;
        url?: string;
        status?: string;
        message?: string;
      };

      if (!response.ok || !data.id || !data.url) {
        throw new Error(
          `Moyasar createCheckout failed: ${data.message ?? 'unknown'} (status: ${response.status})`,
        );
      }

      this.logger.log(
        `Moyasar invoice created: id=${data.id}, ref=${input.internalRef}`,
      );

      return {
        gatewayRef: data.id,
        redirectUrl: data.url,
        gateway: PaymentGateway.Moyasar,
      };
    } catch (e) {
      this.logger.error(`Moyasar error: ${(e as Error).message}`);
      throw e;
    }
  }

  verifyAndParseWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent {
    const secret = this._requireEnv('MOYASAR_WEBHOOK_SECRET');

    // Moyasar يرسل HMAC-SHA256 في X-Moyasar-Signature
    const signature =
      headers['x-moyasar-signature'] ?? headers['X-Moyasar-Signature'];
    if (!signature) {
      throw new WebhookVerificationError('Missing X-Moyasar-Signature header');
    }

    // أمن: HMAC على البايتات الخام كما وصلت، لا على إعادة تسلسل الكائن.
    const { raw, parsed } = extractRawBody(body);
    const expected = createHmac('sha256', secret).update(raw).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new WebhookVerificationError('Invalid HMAC signature');
    }

    const event = parsed as {
      type?: string;
      data?: {
        id?: string;
        status?: string;
        amount?: number;
        currency?: string;
        metadata?: { internal_ref?: string };
      };
    };

    const rawStatus = event.data?.status ?? '';
    let status: 'success' | 'failure' | 'pending' = 'pending';
    if (['paid', 'authorized', 'captured'].includes(rawStatus)) status = 'success';
    else if (['failed', 'expired', 'voided', 'refunded'].includes(rawStatus))
      status = 'failure';

    return {
      gatewayRef: event.data?.id ?? 'unknown',
      internalRef: event.data?.metadata?.internal_ref ?? '',
      status,
      amount: (event.data?.amount ?? 0) / 100, // halalas → SAR
      currency: event.data?.currency ?? 'SAR',
      rawPayload: event as Record<string, unknown>,
    };
  }

  private static readonly FIELDS: Record<string, string> = {
    MOYASAR_API_KEY: 'apiKey',
    MOYASAR_WEBHOOK_SECRET: 'webhookSecret',
  };

  /** يقرأ المفتاح من gateway_config (لوحة التحكم) ثم البيئة. */
  private _requireEnv(key: string): string {
    const field = MoyasarGateway.FIELDS[key] ?? key;
    const value = this.creds.get('moyasar', field, key);
    if (!value || value.startsWith('YOUR_') || value.startsWith('your_')) {
      throw new Error(`${key} is not configured`);
    }
    return value;
  }
}
