import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  PayoutGatewayName,
  PayoutGatewayService,
  PayoutWebhookVerificationError,
} from './payout-gateway.service';
import { PayoutsService } from './payouts.service';

/**
 * N4 — Payout gateway webhook endpoint.
 *
 *   POST /payouts/webhook/:gateway   (gateway = stripe | hyperpay | moyasar | manual)
 *
 * Mirrors the L2 wallet webhook pattern. The gateway POSTs here when a
 * payout settles or fails; we verify the signature, look up the entry by
 * internalRef (== PayoutEntryEntity.id), and flip its status.
 *
 * Security: HMAC verification is delegated to PayoutGatewayService and
 * the endpoint should also be IP-whitelisted at nginx where practical.
 */
@Controller('payouts/webhook')
export class PayoutsWebhookController {
  private readonly logger = new Logger(PayoutsWebhookController.name);

  constructor(
    private readonly gateway: PayoutGatewayService,
    private readonly payouts: PayoutsService,
  ) {}

  @Post(':gateway')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('gateway') gatewayParam: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ): Promise<{ received: boolean; status: string }> {
    const gateway = this.parseGateway(gatewayParam);
    this.logger.log(`Payout webhook received from ${gateway}`);

    let event;
    try {
      event = this.gateway.verifyAndParseWebhook(gateway, headers, body);
    } catch (e) {
      if (e instanceof PayoutWebhookVerificationError) {
        this.logger.error(`Webhook verification failed: ${e.message}`);
        throw new BadRequestException('Invalid webhook signature');
      }
      throw e;
    }

    if (!event.internalRef) {
      // Unrelated/no-op event — return OK so the gateway doesn't retry.
      return { received: true, status: 'ignored' };
    }

    const result = await this.payouts.handleWebhookEvent(
      event.internalRef,
      event.status,
      event.gatewayRef || undefined,
      event.errorMessage,
    );

    if (!result.matched) {
      throw new BadRequestException('Unknown internalRef');
    }
    return {
      received: true,
      status: result.alreadyResolved ? 'already_processed' : event.status,
    };
  }

  private parseGateway(value: string): PayoutGatewayName {
    const allowed: PayoutGatewayName[] = [
      'stripe',
      'hyperpay',
      'moyasar',
      'manual',
    ];
    const v = value.toLowerCase() as PayoutGatewayName;
    if (!allowed.includes(v)) {
      throw new BadRequestException(`Unknown gateway: ${value}`);
    }
    return v;
  }
}
