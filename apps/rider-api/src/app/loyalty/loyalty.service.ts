import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyEntity, LoyaltyTier } from '@hancr/database';
import { LoyaltyType } from './dto/loyalty.type';

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  [LoyaltyTier.Bronze]: 0,
  [LoyaltyTier.Silver]: 500,
  [LoyaltyTier.Gold]: 2000,
  [LoyaltyTier.Platinum]: 5000,
};

const MILES_PER_QAR = 1; // 1 نقطة لكل ريال مدفوع

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyEntity)
    private readonly loyaltyRepo: Repository<LoyaltyEntity>,
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

    const milesEarned = Math.floor(amountPaid * MILES_PER_QAR);
    const newTotal = Number(loyalty.totalMiles) + milesEarned;
    const newAvailable = Number(loyalty.availableMiles) + milesEarned;
    const newLifetime = Number(loyalty.lifetimeMiles) + milesEarned;

    // تحديد المستوى الجديد
    const newTier = this.calculateTier(newLifetime);

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

  private calculateTier(lifetimeMiles: number): LoyaltyTier {
    if (lifetimeMiles >= TIER_THRESHOLDS[LoyaltyTier.Platinum])
      return LoyaltyTier.Platinum;
    if (lifetimeMiles >= TIER_THRESHOLDS[LoyaltyTier.Gold])
      return LoyaltyTier.Gold;
    if (lifetimeMiles >= TIER_THRESHOLDS[LoyaltyTier.Silver])
      return LoyaltyTier.Silver;
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
