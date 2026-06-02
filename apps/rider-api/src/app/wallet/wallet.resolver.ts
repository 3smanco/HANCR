import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
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
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepo: Repository<AppConfigEntity>,
  ) {}

  /** يقرأ مفتاح تفعيل الدفع بالبطاقة من إعدادات التطبيق (admin-controlled). */
  private async isCardPaymentsEnabled(): Promise<boolean> {
    const cfg = await this.appConfigRepo.find({ take: 1 });
    const flags = cfg[0]?.featureFlags as Record<string, unknown> | undefined;
    return flags?.[CARD_PAYMENTS_FLAG] === true;
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

    // الدفع بالبطاقة معطّل (لا توجد بيانات تاجر HyperPay بعد) →
    // نشحن المحفظة فوراً كمحاكاة لتمكين الاختبار والدفع من الرصيد.
    const cardEnabled = await this.isCardPaymentsEnabled();
    if (!cardEnabled) {
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

    const checkout = await this.paymentGateway.createCheckout(gateway, {
      amount,
      currency,
      internalRef: String(pending.transactionId),
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
   * تأكيد شحن (dev/admin/webhook).
   * في الإنتاج: webhook handler يستدعي هذا بعد التحقُّق من signature.
   */
  @Mutation(() => Boolean, {
    description: 'تأكيد شحن المحفظة (dev/admin)',
  })
  @UseGuards(JwtAuthGuard)
  async confirmWalletRecharge(
    @CurrentUser() user: AuthUser,
    @Args('transactionId', { type: () => Int }) transactionId: number,
  ): Promise<boolean> {
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
