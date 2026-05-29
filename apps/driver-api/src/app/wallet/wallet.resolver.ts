import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WalletService, InsufficientBalanceError } from '@hancr/wallet';
import {
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';
import {
  DriverWalletType,
  DriverWalletTransactionGqlType,
  WithdrawalRequestType,
} from './dto/wallet.type';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';

@Resolver(() => DriverWalletType)
export class WalletResolver {
  private readonly logger = new Logger(WalletResolver.name);

  // الحد الأدنى للسحب (يمكن نقله للـ AppConfig لاحقاً عبر لوحة التحكم).
  private static readonly MIN_WITHDRAWAL = 50;
  private static readonly MAX_WITHDRAWAL_PER_REQUEST = 10000;

  constructor(private readonly walletService: WalletService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Queries — رصيد السائق + سجل المعاملات
  // ─────────────────────────────────────────────────────────────────────────

  @Query(() => DriverWalletType, { description: 'رصيد محفظة السائق' })
  @UseGuards(JwtAuthGuard)
  async myDriverWallet(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<DriverWalletType> {
    return this.walletService.getBalance(WalletOwnerType.Driver, driver.driverId);
  }

  @Query(() => [DriverWalletTransactionGqlType], {
    description: 'سجلّ معاملات محفظة السائق (الأحدث أولاً)',
  })
  @UseGuards(JwtAuthGuard)
  async myDriverWalletTransactions(
    @CurrentDriver() driver: AuthDriver,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<DriverWalletTransactionGqlType[]> {
    const txs = await this.walletService.listTransactions(
      WalletOwnerType.Driver,
      driver.driverId,
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
  // Mutations — طلب السحب
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * طلب سحب رصيد من محفظة السائق إلى حسابه البنكي.
   *
   * Flow:
   *  1. نتحقق من الحد الأدنى والأقصى للسحب
   *  2. ننشئ معاملة Withdrawal بحالة Pending (الـ debit يخصم فوراً من الرصيد كحجز)
   *  3. الأدمن يراجع ويوافق من لوحة التحكم → status = Completed و تتم عملية التحويل البنكي
   *
   * NOTE: في الإنتاج، نحجز الرصيد عبر معاملة Pending ثم نُكملها عند موافقة الأدمن.
   * هذا يمنع السائق من سحب نفس الرصيد مرتين أثناء انتظار المراجعة.
   */
  @Mutation(() => WithdrawalRequestType, {
    description: 'طلب سحب رصيد إلى الحساب البنكي',
  })
  @UseGuards(JwtAuthGuard)
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  async requestWithdrawal(
    @CurrentDriver() driver: AuthDriver,
    @Args('amount', { type: () => Float }) amount: number,
  ): Promise<WithdrawalRequestType> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amount < WalletResolver.MIN_WITHDRAWAL) {
      throw new BadRequestException(
        `Minimum withdrawal is ${WalletResolver.MIN_WITHDRAWAL}`,
      );
    }
    if (amount > WalletResolver.MAX_WITHDRAWAL_PER_REQUEST) {
      throw new BadRequestException(
        `Maximum withdrawal per request is ${WalletResolver.MAX_WITHDRAWAL_PER_REQUEST}`,
      );
    }

    const { balance, currency } = await this.walletService.getBalance(
      WalletOwnerType.Driver,
      driver.driverId,
    );

    if (balance < amount) {
      throw new BadRequestException(
        `Insufficient balance: have ${balance} ${currency}, need ${amount}`,
      );
    }

    try {
      // نخصم الرصيد فوراً (Completed) لمنع السحب المضاعف.
      // metadata.adminReviewStatus يشير لانتظار التحويل البنكي اليدوي من الأدمن.
      // عند الرفض → الأدمن يُنشئ معاملة Refund credit بنفس القيمة.
      const result = await this.walletService.debit({
        ownerType: WalletOwnerType.Driver,
        ownerId: driver.driverId,
        type: WalletTransactionType.DriverWithdrawal,
        amount,
        currency,
        status: WalletTransactionStatus.Completed,
        description: `Withdrawal request by driver #${driver.driverId}`,
        metadata: {
          adminReviewStatus: 'pending_review',
          requestedAt: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Driver #${driver.driverId} requested withdrawal of ${amount} ${currency} ` +
          `(tx #${result.transactionId}, new balance: ${result.newBalance})`,
      );

      return {
        transactionId: result.transactionId,
        amount,
        currency,
        status: WalletTransactionStatus.Completed,
        balanceAfter: result.newBalance,
      };
    } catch (e) {
      if (e instanceof InsufficientBalanceError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
