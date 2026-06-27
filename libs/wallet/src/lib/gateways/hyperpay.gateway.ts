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
 * HyperPayGateway — البوابة الرئيسية في الخليج.
 *
 * Flow:
 *  1. POST /v1/checkouts → returns { id, status }
 *  2. Redirect customer to widget مع id
 *  3. Customer completes → HyperPay يستدعي webhookUrl
 *  4. verifyAndParseWebhook() يتحقق من signature ويُرجع status
 *
 * Docs: https://wordpresshyperpay.docs.oppwa.com/integrations/server-to-server
 *
 * Env vars المطلوبة:
 *   HYPERPAY_ACCESS_TOKEN — من dashboard HyperPay
 *   HYPERPAY_ENTITY_ID    — لكل عملة entity منفصل
 *   HYPERPAY_BASE_URL     — eu-test.oppwa.com (test) أو eu-prod.oppwa.com (live)
 *   HYPERPAY_WEBHOOK_SECRET — للـ HMAC verification
 */
@Injectable()
export class HyperPayGateway implements IPaymentGateway {
  readonly name = PaymentGateway.HyperPay;
  private readonly logger = new Logger(HyperPayGateway.name);

  constructor(
    private readonly config: ConfigService,
    private readonly creds: GatewayCredentials,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Create checkout
  // ─────────────────────────────────────────────────────────────────────────

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    await this.creds.ensureLoaded();
    const accessToken = this._requireEnv('HYPERPAY_ACCESS_TOKEN');
    const entityId = this._requireEnv('HYPERPAY_ENTITY_ID');
    const baseUrl =
      this.creds.get('hyperpay', 'baseUrl', 'HYPERPAY_BASE_URL') ??
      'https://eu-test.oppwa.com';

    const params = new URLSearchParams({
      entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency,
      paymentType: 'DB', // Debit
      merchantTransactionId: input.internalRef,
      'customer.email': input.customer?.email ?? `${input.internalRef}@hancr.com`,
      'customer.givenName': input.customer?.name?.split(' ')[0] ?? 'Customer',
      'customer.surname':
        input.customer?.name?.split(' ').slice(1).join(' ') || 'HANCR',
    });

    // notificationUrl ضروري لـ webhook
    if (input.webhookUrl) {
      params.append('notificationUrl', input.webhookUrl);
    }
    if (input.returnUrl) {
      params.append('shopperResultUrl', input.returnUrl);
    }

    try {
      const response = await fetch(`${baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(10_000),
      });

      const data = (await response.json()) as {
        id?: string;
        result?: { code?: string; description?: string };
      };

      // HyperPay codes: 000.200.100 = checkout created successfully
      const code = data.result?.code ?? '';
      const isSuccess = /^(000\.200|000\.000|000\.100\.1)/.test(code);

      if (!isSuccess || !data.id) {
        throw new Error(
          `HyperPay createCheckout failed: ${data.result?.description ?? 'unknown'} (code: ${code})`,
        );
      }

      this.logger.log(
        `HyperPay checkout created: id=${data.id}, ref=${input.internalRef}`,
      );

      // Redirect URL للـ widget — العميل يحمِّل JS widget و يدفع
      const redirectUrl = `${baseUrl}/v1/paymentWidgets.js?checkoutId=${data.id}`;

      return {
        gatewayRef: data.id,
        redirectUrl,
        gateway: PaymentGateway.HyperPay,
      };
    } catch (e) {
      this.logger.error(`HyperPay error: ${(e as Error).message}`);
      throw e;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Webhook verification + parse
  // ─────────────────────────────────────────────────────────────────────────

  verifyAndParseWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent {
    const secret = this._requireEnv('HYPERPAY_WEBHOOK_SECRET');

    // HyperPay يُرسل signature في X-Initialization-Vector + X-Authentication-Tag
    // الفعلي يستخدم AES-GCM لفك التشفير. هنا نُبسِّط بـ HMAC-SHA256 fallback.
    // في الإنتاج: استخدم HyperPay official npm package أو نفِّذ الـ decryption.
    const signature = headers['x-signature'] ?? headers['x-hyperpay-signature'];
    if (!signature) {
      throw new WebhookVerificationError('Missing X-Signature header');
    }

    // أمن: HMAC على البايتات الخام كما وصلت، لا على إعادة تسلسل الكائن.
    const { raw, parsed } = extractRawBody(body);
    const expectedSig = createHmac('sha256', secret).update(raw).digest('hex');

    if (!timingSafeEqualString(signature, expectedSig)) {
      throw new WebhookVerificationError('Invalid HMAC signature');
    }

    const payloadObj = parsed as {
      id?: string;
      merchantTransactionId?: string;
      result?: { code?: string };
      amount?: string;
      currency?: string;
    };

    const code = payloadObj.result?.code ?? '';
    let status: 'success' | 'failure' | 'pending' = 'pending';
    if (/^(000\.000|000\.100\.1|000\.[36]00)/.test(code)) status = 'success';
    else if (/^(000\.400|800|900)/.test(code)) status = 'failure';

    return {
      gatewayRef: payloadObj.id ?? 'unknown',
      internalRef: payloadObj.merchantTransactionId ?? '',
      status,
      amount: parseFloat(payloadObj.amount ?? '0'),
      currency: payloadObj.currency ?? 'SAR',
      rawPayload: payloadObj as Record<string, unknown>,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private static readonly FIELDS: Record<string, string> = {
    HYPERPAY_ACCESS_TOKEN: 'accessToken',
    HYPERPAY_ENTITY_ID: 'entityId',
    HYPERPAY_WEBHOOK_SECRET: 'webhookSecret',
  };

  /** يقرأ المفتاح من gateway_config (لوحة التحكم) ثم البيئة. */
  private _requireEnv(key: string): string {
    const field = HyperPayGateway.FIELDS[key] ?? key;
    const value = this.creds.get('hyperpay', field, key);
    if (!value || value.startsWith('YOUR_') || value.startsWith('your_')) {
      throw new Error(`${key} is not configured`);
    }
    return value;
  }
}

// ─── timing-safe string comparison ───
function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
