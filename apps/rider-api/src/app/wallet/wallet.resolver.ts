import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Throttle } from '@nestjs/throttler';
import {
  WalletService,
  PaymentGatewayService,
} from '@hancr/wallet';
import {
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
  PaymentGateway,
  AppConfigEntity,
} from '@hancr/database';
import {
  WalletType,
  WalletTransactionGqlType,
  RechargeCheckoutType,
} from './dto/wallet.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

/** مفتاح تفعيل الدفع بالبطاقة عبر بوابات الدفع (HyperPay…). معطّل افتراضياً. */
const CARD_PAYMENTS_FLAG = 'payments_card_enabled';

@Resolver(() => WalletType)
export class WalletResolver {
  constructor(
    private readonly walletService: WalletService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly config: ConfigService,
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepo: Repository<AppConfigEntity>,
  ) {}

  /** يقرأ مفتاح تفعيل الدفع بالبطاقة من إعدادات التطبيق (admin-controlled). */
  private async isCardPaymentsEnabled(): Promise<boolean> {
    const cfg = await this.appConfigRepo.find({ take: 1 });
    const flags = cfg[0]?.featureFlags as Record<string, unknown> | undefined;
    return flags?.[CARD_PAYMENTS_FLAG] === true;
  }

  private configValue(key: string): string | undefined {
    const value = this.config.get<string>(key)?.trim();
    return value || undefined;
  }

  private paymentWebhookUrl(gateway: PaymentGateway): string | undefined {
    const configured = this.configValue('PAYMENT_WEBHOOK_URL');
    if (!configured) return undefined;

    const gatewaySegment = encodeURIComponent(gateway.toLowerCase());
    if (configured.includes('{gateway}') || configured.includes(':gateway')) {
      return configured
        .replaceAll('{gateway}', gatewaySegment)
        .replaceAll(':gateway', gatewaySegment);
    }

    const trimmed = configured.replace(/\/+$/, '');
    if (new RegExp(`/${gatewaySegment}$`, 'i').test(trimmed)) {
      return trimmed;
    }
    return `${trimmed}/${gatewaySegment}`;
  }

  private paymentReturnUrl(internalRef: string): string | undefined {
    const configured = this.configValue('PAYMENT_RETURN_URL');
    const fallback = this.configValue('PUBLIC_BASE_URL');
    const value = configured ?? fallback;
    if (!value) return undefined;

    if (value.includes('{ref}')) {
      return value.replaceAll('{ref}', encodeURIComponent(internalRef));
    }
    if (configured) {
      const separator = value.includes('?') ? '&' : '?';
      return `${value}${separator}ref=${encodeURIComponent(internalRef)}`;
    }
    return value.replace(/\/+$/, '');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => WalletType, { description: 'رصيد محفظة الراكب' })
  @UseGuards(JwtAuthGuard)
  async myWallet(@CurrentUser() user: AuthUser): Promise<WalletType> {
    return this.walletService.getBalance(WalletOwnerType.Rider, user.riderId);
  }

  @Query(() => [WalletTransactionGqlType], {
    description: 'سجلّ معاملات المحفظة (الأحدث أولاً)',
  })
  @UseGuards(JwtAuthGuard)
  async myWalletTransactions(
    @CurrentUser() user: AuthUser,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<WalletTransactionGqlType[]> {
    const txs = await this.walletService.listTransactions(
      WalletOwnerType.Rider,
      user.riderId,
      limit,
      offset,
    );
    return txs.map((t) => ({
      id: t.id,
      type: t.type,
      direction: t.direction,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      currency: t.currency,
      status: t.status,
      gateway: t.gateway,
      gatewayRef: t.gatewayRef,
      orderId: t.orderId,
      description: t.description,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * شحن المحفظة عبر بوابة دفع.
   *
   * Flow:
   *  1. أنشئ معاملة Pending في الـ ledger
   *  2. ادعُ الـ gateway لإنشاء checkout
   *  3. حدِّث الـ gatewayRef في الـ pending transaction
   *  4. أعدْ redirectUrl/clientSecret للـ client
   *  5. عند نجاح الدفع → webhook يستدعي `confirmWalletRecharge` لـ promote Pending → Completed
   */
  @Mutation(() => RechargeCheckoutType, {
    description: 'بدء عملية شحن المحفظة',
  })
  @UseGuards(JwtAuthGuard)
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  async startWalletRecharge(
    @CurrentUser() user: AuthUser,
    @Args('amount', { type: () => Float }) amount: number,
    @Args('gateway', {
      type: () => PaymentGateway,
      defaultValue: PaymentGateway.HyperPay,
    })
    gateway: PaymentGateway,
  ): Promise<RechargeCheckoutType> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amount > 5000) {
      throw new BadRequestException('Amount exceeds single-recharge limit (5000)');
    }

    const { currency } = await this.walletService.getBalance(
      WalletOwnerType.Rider,
      user.riderId,
    );

    // الدفع بالبطاقة معطّل (لا توجد بيانات تاجر HyperPay بعد).
    // أمن: المحاكاة (شحن فوري بلا دفع) مسموحة في غير الإنتاج فقط.
    // في الإنتاج كان هذا ثغرة "مال مجاني" — نرفض بدل الشحن.
    const cardEnabled = await this.isCardPaymentsEnabled();
    if (!cardEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          'الدفع بالبطاقة غير مُفعَّل حالياً. لا يمكن شحن المحفظة.',
        );
      }
      const sim = await this.walletService.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: user.riderId,
        type: WalletTransactionType.Recharge,
        amount,
        currency,
        status: WalletTransactionStatus.Completed,
        description: `Wallet recharge (simulated — card payments disabled)`,
      });
      return {
        transactionId: sim.transactionId,
        gatewayRef: 'SIMULATED',
        gateway,
        amount,
        currency,
        simulated: true,
      };
    }

    // مسار البطاقة الحقيقي (HyperPay/Moyasar/Stripe) — يُفعَّل عند توفّر التاجر
    const pending = await this.walletService.credit({
      ownerType: WalletOwnerType.Rider,
      ownerId: user.riderId,
      type: WalletTransactionType.Recharge,
      amount,
      currency,
      gateway,
      status: WalletTransactionStatus.Pending,
      description: `Wallet recharge via ${gateway}`,
    });

    const internalRef = String(pending.transactionId);
    const checkout = await this.paymentGateway.createCheckout(gateway, {
      amount,
      currency,
      internalRef,
      webhookUrl: this.paymentWebhookUrl(gateway),
      returnUrl: this.paymentReturnUrl(internalRef),
    });

    await this.walletService.updateTransactionStatus(
      pending.transactionId,
      WalletTransactionStatus.Pending,
      { gatewayRef: checkout.gatewayRef, redirectUrl: checkout.redirectUrl },
    );

    return {
      transactionId: pending.transactionId,
      gatewayRef: checkout.gatewayRef,
      redirectUrl: checkout.redirectUrl,
      clientSecret: checkout.clientSecret,
      gateway: checkout.gateway,
      amount,
      currency,
      simulated: false,
    };
  }

  /**
   * تأكيد شحن — أداة تطوير فقط.
   * أمن: في الإنتاج لا يجوز للراكب تأكيد شحنته ذاتياً (كان ثغرة شحن بلا دفع).
   * التأكيد في الإنتاج يحدث حصراً في wallet-webhook.controller بعد التحقّق من توقيع HMAC.
   */
  @Mutation(() => Boolean, {
    description: 'تأكيد شحن المحفظة (dev فقط)',
  })
  @UseGuards(JwtAuthGuard)
  async confirmWalletRecharge(
    @CurrentUser() user: AuthUser,
    @Args('transactionId', { type: () => Int }) transactionId: number,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'تأكيد الشحن يتم تلقائياً عبر بوابة الدفع، لا يدوياً.',
      );
    }
    const txs = await this.walletService.listTransactions(
      WalletOwnerType.Rider,
      user.riderId,
      100,
      0,
    );
    const found = txs.find((t) => t.id === transactionId);
    if (!found) {
      throw new BadRequestException(`Transaction #${transactionId} not found`);
    }
    if (found.status !== WalletTransactionStatus.Pending) {
      throw new BadRequestException(
        `Transaction is already ${found.status}, cannot confirm`,
      );
    }

    // Promote: credit the amount as Completed
    await this.walletService.credit({
      ownerType: WalletOwnerType.Rider,
      ownerId: user.riderId,
      type: WalletTransactionType.Recharge,
      amount: Number(found.amount),
      currency: found.currency,
      gateway: found.gateway,
      gatewayRef: found.gatewayRef,
      description: `Confirmed recharge for tx #${transactionId}`,
      status: WalletTransactionStatus.Completed,
    });

    // Mark the original pending as Completed (it's been superseded)
    await this.walletService.updateTransactionStatus(
      transactionId,
      WalletTransactionStatus.Completed,
    );

    return true;
  }
}
