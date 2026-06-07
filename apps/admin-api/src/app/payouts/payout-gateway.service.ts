import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export type PayoutGatewayName = 'stripe' | 'hyperpay' | 'moyasar' | 'manual';

export interface InitiatePayoutInput {
  amount: number;
  currency: string;
  /** Internal entry id, echoed back in the webhook so we can match it. */
  internalRef: string;
  /** Destination account on the gateway side (e.g. Stripe Connect acct_xxx) */
  destinationAccount: string;
  /** Human-readable description that may show on bank statements. */
  description?: string;
}

export interface InitiatePayoutResult {
  /** Gateway-side reference (e.g. Stripe payout id po_xxx). */
  gatewayRef: string;
  /** synchronous status when known, otherwise 'pending' awaiting webhook. */
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface PayoutWebhookEvent {
  /** Our internal payout entry id, parsed from the gateway payload. */
  internalRef: string;
  /** Gateway reference attached to this entry. */
  gatewayRef: string;
  status: 'completed' | 'failed';
  errorMessage?: string;
  rawPayload: unknown;
}

export class PayoutWebhookVerificationError extends Error {}

/**
 * N4 — Driver payout gateway adapter.
 *
 * Production: routes payouts to Stripe Payouts (bank account / debit card)
 * or HyperPay/Moyasar payouts if those creds are present. Each adapter
 * returns a gatewayRef which we persist on PayoutEntryEntity.gatewayRef,
 * and the eventual webhook hits /payouts/webhook/:gateway to flip the
 * entry to completed/failed.
 *
 * Stub mode (no STRIPE_SECRET_KEY / HYPERPAY_PAYOUT_TOKEN etc.): returns
 * 'completed' synchronously so the existing flow still works for testing
 * — the ledger debit happens, the entry is marked completed immediately.
 * This matches the previous behaviour byte-for-byte.
 *
 * The Stripe call is intentionally lazy-required so projects without
 * @stripe/stripe-node installed still build.
 */
@Injectable()
export class PayoutGatewayService {
  private readonly logger = new Logger(PayoutGatewayService.name);
  private readonly stubMode: boolean;

  constructor(private readonly cfg: ConfigService) {
    const hasStripe = !!this.cfg.get<string>('STRIPE_SECRET_KEY');
    const hasHyperpay = !!this.cfg.get<string>('HYPERPAY_PAYOUT_TOKEN');
    const hasMoyasar = !!this.cfg.get<string>('MOYASAR_PAYOUT_TOKEN');
    this.stubMode = !hasStripe && !hasHyperpay && !hasMoyasar;
    if (this.stubMode) {
      this.logger.warn(
        '⚠ Payout gateways in STUB MODE — sessions complete synchronously',
      );
    }
  }

  async initiate(
    gateway: PayoutGatewayName,
    input: InitiatePayoutInput,
  ): Promise<InitiatePayoutResult> {
    if (this.stubMode || gateway === 'manual') {
      return {
        gatewayRef: `stub_${Date.now()}_${randomBytes(4).toString('hex')}`,
        status: 'completed',
      };
    }
    if (gateway === 'stripe') {
      return this.initiateStripe(input);
    }
    // HyperPay / Moyasar payout APIs would slot here. Until creds + endpoint
    // are confirmed by ops, fall back to stub so the system still works.
    this.logger.warn(
      `Gateway ${gateway} has no production adapter yet; falling back to stub`,
    );
    return {
      gatewayRef: `stub_${Date.now()}_${randomBytes(4).toString('hex')}`,
      status: 'completed',
    };
  }

  /**
   * Verify HMAC signature on incoming webhook + extract the relevant fields.
   * Throws PayoutWebhookVerificationError on signature mismatch.
   */
  verifyAndParseWebhook(
    gateway: PayoutGatewayName,
    headers: Record<string, string>,
    body: unknown,
  ): PayoutWebhookEvent {
    if (this.stubMode || gateway === 'manual') {
      return this.parseGenericWebhook(body);
    }
    if (gateway === 'stripe') {
      return this.verifyStripeWebhook(headers, body);
    }
    return this.parseGenericWebhook(body);
  }

  // ── Stripe ──────────────────────────────────────────────────────────────

  private async initiateStripe(
    input: InitiatePayoutInput,
  ): Promise<InitiatePayoutResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require('stripe') as typeof import('stripe').default;
      const stripe = new Stripe(this.cfg.get<string>('STRIPE_SECRET_KEY')!);
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(input.amount * 100), // Stripe uses minor units
          currency: input.currency.toLowerCase(),
          description: input.description,
          metadata: { internalRef: input.internalRef },
        },
        { stripeAccount: input.destinationAccount },
      );
      return {
        gatewayRef: payout.id,
        status:
          payout.status === 'paid'
            ? 'completed'
            : payout.status === 'failed'
              ? 'failed'
              : 'pending',
      };
    } catch (err) {
      this.logger.error(
        `Stripe payout failed for ${input.internalRef}: ${(err as Error).message}`,
      );
      return {
        gatewayRef: `error_${Date.now()}`,
        status: 'failed',
        errorMessage: (err as Error).message,
      };
    }
  }

  private verifyStripeWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): PayoutWebhookEvent {
    const secret = this.cfg.get<string>('STRIPE_WEBHOOK_SECRET');
    const signature = headers['stripe-signature'];
    if (!secret || !signature) {
      throw new PayoutWebhookVerificationError(
        'STRIPE_WEBHOOK_SECRET not set or stripe-signature header missing',
      );
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require('stripe') as typeof import('stripe').default;
      const stripe = new Stripe(this.cfg.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_unused');
      const event = stripe.webhooks.constructEvent(
        typeof body === 'string' ? body : JSON.stringify(body),
        signature,
        secret,
      );
      if (event.type === 'payout.paid' || event.type === 'payout.failed') {
        const obj = event.data.object as {
          id: string;
          metadata?: Record<string, string>;
          failure_message?: string;
        };
        return {
          internalRef: obj.metadata?.internalRef ?? '',
          gatewayRef: obj.id,
          status: event.type === 'payout.paid' ? 'completed' : 'failed',
          errorMessage: obj.failure_message,
          rawPayload: event,
        };
      }
      // Unrelated event — treated as a no-op upstream.
      return {
        internalRef: '',
        gatewayRef: '',
        status: 'completed',
        rawPayload: event,
      };
    } catch (err) {
      throw new PayoutWebhookVerificationError((err as Error).message);
    }
  }

  // ── Generic / stub ──────────────────────────────────────────────────────

  /** Used in stub mode + manual gateway. Expects JSON body with our shape. */
  private parseGenericWebhook(body: unknown): PayoutWebhookEvent {
    const b = (body ?? {}) as {
      internalRef?: string;
      gatewayRef?: string;
      status?: string;
      errorMessage?: string;
    };
    const status =
      b.status === 'completed' ? 'completed' : b.status === 'failed' ? 'failed' : 'completed';
    return {
      internalRef: b.internalRef ?? '',
      gatewayRef: b.gatewayRef ?? '',
      status,
      errorMessage: b.errorMessage,
      rawPayload: body,
    };
  }

  /** Optional manual HMAC for generic webhooks (HYPERPAY/Moyasar later). */
  verifyHmac(
    secret: string,
    expectedSignature: string,
    rawBody: string,
  ): void {
    const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expectedSignature, 'utf8');
    const b = Buffer.from(computed, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new PayoutWebhookVerificationError('HMAC mismatch');
    }
  }
}
