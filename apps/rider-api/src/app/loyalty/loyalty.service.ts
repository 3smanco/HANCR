import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LoyaltyEntity,
  LoyaltyTier,
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import { LoyaltyType } from './dto/loyalty.type';
import { RedeemResultType } from './dto/redeem-result.type';
import { AppConfigReader } from '../app-config/app-config-reader.service';

// N1 — defaults preserved as fallback; live values come from AppConfigReader
// (loyaltyConfig). Admin can retune thresholds / cashback / redeem step live.
const DEFAULT_TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  [LoyaltyTier.Bronze]: 0,
  [LoyaltyTier.Silver]: 500,
  [LoyaltyTier.Gold]: 2000,
  [LoyaltyTier.Platinum]: 5000,
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyEntity)
    private readonly loyaltyRepo: Repository<LoyaltyEntity>,
    private readonly walletService: WalletService,
    private readonly appConfig: AppConfigReader,
  ) {}

  /**
   * جلب أو إنشاء سجل الولاء للراكب
   */
  async getOrCreate(riderId: number): Promise<LoyaltyType> {
    let loyalty = await this.loyaltyRepo.findOne({ where: { riderId } });

    if (!loyalty) {
      loyalty = this.loyaltyRepo.create({
        riderId,
        totalMiles: 0,
        availableMiles: 0,
        lifetimeMiles: 0,
        tier: LoyaltyTier.Bronze,
        freeUpgradesRemaining: 0,
        hasFreeCancellation: false,
      });
      loyalty = await this.loyaltyRepo.save(loyalty);
      this.logger.log(`Created loyalty record for rider #${riderId}`);
    }

    return this.toType(loyalty);
  }

  /**
   * إضافة نقاط بعد اكتمال رحلة
   */
  async addMiles(riderId: number, amountPaid: number): Promise<LoyaltyType> {
    let loyalty = await this.loyaltyRepo.findOne({ where: { riderId } });

    if (!loyalty) {
      loyalty = await this.loyaltyRepo.save(
        this.loyaltyRepo.create({
          riderId,
          totalMiles: 0,
          availableMiles: 0,
          lifetimeMiles: 0,
          tier: LoyaltyTier.Bronze,
          freeUpgradesRemaining: 0,
          hasFreeCancellation: false,
        }),
      );
    }

    const cfg = await this.appConfig.getLoyalty();
    const milesEarned = Math.floor(amountPaid * (cfg.milesPerCurrency ?? 1));
    const newTotal = Number(loyalty.totalMiles) + milesEarned;
    const newAvailable = Number(loyalty.availableMiles) + milesEarned;
    const newLifetime = Number(loyalty.lifetimeMiles) + milesEarned;

    // تحديد المستوى الجديد (العتبات من لوحة التحكم)
    const newTier = this.calculateTier(newLifetime, cfg.tierThresholds);

    // مزايا الترقية إلى Gold
    let surgeImmunityUntil = loyalty.surgeImmunityUntil;
    if (loyalty.tier !== LoyaltyTier.Gold && newTier === LoyaltyTier.Gold) {
      surgeImmunityUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      this.logger.log(`Rider #${riderId} upgraded to Gold — surge immunity active`);
    }

    // مزايا الترقية إلى Platinum
    let freeUpgradesRemaining = loyalty.freeUpgradesRemaining;
    let hasFreeCancellation = loyalty.hasFreeCancellation;
    if (loyalty.tier !== LoyaltyTier.Platinum && newTier === LoyaltyTier.Platinum) {
      freeUpgradesRemaining = 3;
      hasFreeCancellation = true;
      this.logger.log(`Rider #${riderId} upgraded to Platinum!`);
    }

    await this.loyaltyRepo.update(loyalty.id, {
      totalMiles: newTotal,
      availableMiles: newAvailable,
      lifetimeMiles: newLifetime,
      tier: newTier,
      surgeImmunityUntil,
      freeUpgradesRemaining,
      hasFreeCancellation,
    });

    const updated = {
      ...loyalty,
      totalMiles: newTotal,
      availableMiles: newAvailable,
      lifetimeMiles: newLifetime,
      tier: newTier,
      surgeImmunityUntil,
      freeUpgradesRemaining,
      hasFreeCancellation,
    };

    return this.toType(updated as LoyaltyEntity);
  }

  /**
   * استبدال النقاط (Redeem)
   */
  async redeemMiles(
    riderId: number,
    miles: number,
  ): Promise<{ success: boolean; remainingMiles: number }> {
    const loyalty = await this.loyaltyRepo.findOne({ where: { riderId } });
    if (!loyalty) throw new NotFoundException('Loyalty record not found');

    if (Number(loyalty.availableMiles) < miles) {
      return { success: false, remainingMiles: Number(loyalty.availableMiles) };
    }

    await this.loyaltyRepo.update(loyalty.id, {
      availableMiles: Number(loyalty.availableMiles) - miles,
      totalMiles: Number(loyalty.totalMiles) - miles,
    });

    return {
      success: true,
      remainingMiles: Number(loyalty.availableMiles) - miles,
    };
  }

  /**
   * استبدال النقاط برصيد محفظة (Redeem reward).
   * يخصم النقاط ثم يضيف ما يعادلها للمحفظة كـ LoyaltyRedemption.
   */
  async redeemReward(riderId: number, miles: number): Promise<RedeemResultType> {
    const cfg = await this.appConfig.getLoyalty();
    const minRedeem = cfg.minRedeem ?? 100;
    const redeemStep = cfg.redeemStep ?? 50;
    if (miles < minRedeem || miles % redeemStep !== 0) {
      throw new BadRequestException(
        `الحد الأدنى للاستبدال ${minRedeem} نقطة بمضاعفات ${redeemStep}`,
      );
    }

    const { currency } = await this.walletService.getBalance(
      WalletOwnerType.Rider,
      riderId,
    );

    const result = await this.redeemMiles(riderId, miles);
    if (!result.success) {
      throw new BadRequestException(
        `نقاط غير كافية — المتاح ${result.remainingMiles}`,
      );
    }

    const creditedAmount =
      Math.round(miles * (cfg.milesToCurrency ?? 0.05) * 100) / 100;

    try {
      await this.walletService.credit({
        ownerType: WalletOwnerType.Rider,
        ownerId: riderId,
        type: WalletTransactionType.LoyaltyRedemption,
        amount: creditedAmount,
        currency,
        status: WalletTransactionStatus.Completed,
        description: `استبدال ${miles} نقطة برصيد محفظة`,
      });
    } catch (e) {
      // فشل الإضافة للمحفظة — أعِد النقاط للراكب
      this.logger.error(
        `Wallet credit failed during redemption for rider #${riderId}: ${(e as Error).message}`,
      );
      await this.addMilesRaw(riderId, miles);
      throw new BadRequestException('تعذّر إتمام الاستبدال، حاول مجدداً');
    }

    this.logger.log(
      `Rider #${riderId} redeemed ${miles} miles → ${creditedAmount} ${currency}`,
    );

    return {
      success: true,
      redeemedMiles: miles,
      creditedAmount,
      currency,
      remainingMiles: result.remainingMiles,
    };
  }

  /** إعادة نقاط بدون منطق المستوى (للتعويض عند فشل المعاملة) */
  private async addMilesRaw(riderId: number, miles: number): Promise<void> {
    const loyalty = await this.loyaltyRepo.findOne({ where: { riderId } });
    if (!loyalty) return;
    await this.loyaltyRepo.update(loyalty.id, {
      availableMiles: Number(loyalty.availableMiles) + miles,
      totalMiles: Number(loyalty.totalMiles) + miles,
    });
  }

  private calculateTier(
    lifetimeMiles: number,
    thresholds?: Record<string, number>,
  ): LoyaltyTier {
    const t = {
      ...DEFAULT_TIER_THRESHOLDS,
      ...(thresholds ?? {}),
    } as Record<string, number>;
    if (lifetimeMiles >= t[LoyaltyTier.Platinum]) return LoyaltyTier.Platinum;
    if (lifetimeMiles >= t[LoyaltyTier.Gold]) return LoyaltyTier.Gold;
    if (lifetimeMiles >= t[LoyaltyTier.Silver]) return LoyaltyTier.Silver;
    return LoyaltyTier.Bronze;
  }

  private toType(loyalty: LoyaltyEntity): LoyaltyType {
    return {
      id: loyalty.id,
      totalMiles: Number(loyalty.totalMiles),
      availableMiles: Number(loyalty.availableMiles),
      lifetimeMiles: Number(loyalty.lifetimeMiles),
      tier: loyalty.tier,
      surgeImmunityUntil: loyalty.surgeImmunityUntil,
      freeUpgradesRemaining: loyalty.freeUpgradesRemaining,
      hasFreeCancellation: loyalty.hasFreeCancellation,
      updatedAt: loyalty.updatedAt,
    };
  }
}
