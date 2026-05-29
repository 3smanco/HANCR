import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  WalletService,
  PaymentGatewayService,
  WebhookVerificationError,
} from '@hancr/wallet';
import {
  PaymentGateway,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';

/**
 * WalletWebhookController — يستقبل إشعارات بوابات الدفع.
 *
 * Endpoint: POST /wallet/webhook/:gateway
 *
 * Flow:
 *  1. Gateway يرسل POST مع payload + signature في headers
 *  2. PaymentGatewayService.parseWebhook يتحقق من التوقيع ويستخرج الحدث
 *  3. نجلب الـ Pending transaction بـ internalRef
 *  4. لو success → ننشئ Completed credit + نُحدِّث الـ Pending → Completed
 *  5. لو failure → نُحدِّث الـ Pending → Failed
 *
 * SECURITY NOTE: في الإنتاج، parseWebhook يجب أن يتحقق من HMAC signature.
 * أيضاً يجب وضع endpoint خلف whitelist للـ gateway IPs.
 */
@Controller('wallet/webhook')
export class WalletWebhookController {
  private readonly logger = new Logger(WalletWebhookController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  @Post(':gateway')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('gateway') gatewayParam: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ): Promise<{ received: boolean; status: string }> {
    const gateway = this._parseGateway(gatewayParam);
    this.logger.log(`Webhook received from ${gateway}`);

    // HMAC verification — يرمي WebhookVerificationError لو signature غير صحيح
    let event;
    try {
      event = this.paymentGateway.verifyAndParseWebhook(gateway, headers, body);
    } catch (e) {
      if (e instanceof WebhookVerificationError) {
        this.logger.error(`Webhook verification failed: ${e.message}`);
        // نرجع 401 صريح للـ gateway → فهم أن signature غلط
        throw new BadRequestException('Invalid webhook signature');
      }
      throw e;
    }

    if (!event.internalRef) {
      this.logger.error(`Webhook missing internal_ref — cannot match transaction`);
      throw new BadRequestException('Missing internal_ref');
    }

    const transactionId = parseInt(event.internalRef, 10);
    if (Number.isNaN(transactionId)) {
      throw new BadRequestException(`Invalid internal_ref: ${event.internalRef}`);
    }

    // نجلب الـ pending transaction للتحقق من ownerId/amount
    const allTxs = await this.walletService.getTransactionById(transactionId);
    if (!allTxs) {
      this.logger.error(`Transaction #${transactionId} not found`);
      throw new BadRequestException(`Transaction not found`);
    }

    // Idempotency: لو الـ transaction بالفعل Completed/Failed → نتجاهل
    if (allTxs.status !== WalletTransactionStatus.Pending) {
      this.logger.warn(
        `Transaction #${transactionId} is already ${allTxs.status} — ignoring webhook`,
      );
      return { received: true, status: 'already_processed' };
    }

    if (event.status === 'success') {
      // ننشئ Completed Credit للرصيد الفعلي
      await this.walletService.credit({
        ownerType: allTxs.ownerType,
        ownerId: allTxs.ownerId,
        type: WalletTransactionType.Recharge,
        amount: Number(allTxs.amount),
        currency: allTxs.currency,
        gateway: allTxs.gateway,
        gatewayRef: event.gatewayRef,
        description: `Recharge confirmed via webhook (orig tx #${transactionId})`,
        status: WalletTransactionStatus.Completed,
      });
      // نُحدِّث الـ Pending → Completed
      await this.walletService.updateTransactionStatus(
        transactionId,
        WalletTransactionStatus.Completed,
        { webhookReceivedAt: new Date().toISOString() },
      );
      return { received: true, status: 'completed' };
    }

    if (event.status === 'failure') {
      await this.walletService.updateTransactionStatus(
        transactionId,
        WalletTransactionStatus.Failed,
        { failureReason: event.rawPayload },
      );
      return { received: true, status: 'failed' };
    }

    // pending → no-op
    return { received: true, status: 'pending' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private _parseGateway(value: string): PaymentGateway {
    const normalized = Object.values(PaymentGateway).find(
      (g) => g.toLowerCase() === value.toLowerCase(),
    );
    if (!normalized) {
      throw new BadRequestException(`Unknown gateway: ${value}`);
    }
    return normalized;
  }

}
