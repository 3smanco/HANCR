import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyEntity, LoyaltyTier } from '@hancr/database';
import {
  AdjustLoyaltyInput,
  AdminLoyaltyType,
} from './dto/loyalty-admin.types';

/**
 * N3 — Admin-side loyalty management.
 * Read + manual adjust (e.g. apology bonus, fraud reversal). Tier is
 * automatically recomputed from lifetimeMiles using the admin-controlled
 * thresholds stored in hancr_app_config.loyaltyConfig (read elsewhere).
 *
 * We avoid duplicating tier-calc logic — for manual adjustments we simply
 * shift miles and let the existing rider-api loyalty service recompute
 * tier on next earn/redeem. Direct tier overrides are deliberately not
 * exposed here to keep the source of truth single.
 */
@Injectable()
export class LoyaltyAdminService {
  private readonly logger = new Logger(LoyaltyAdminService.name);

  constructor(
    @InjectRepository(LoyaltyEntity)
    private readonly loyaltyRepo: Repository<LoyaltyEntity>,
  ) {}

  async getForRider(riderId: number): Promise<AdminLoyaltyType> {
    const row = await this.loyaltyRepo.findOne({ where: { riderId } });
    if (!row) {
      // Return an empty Bronze state so the admin UI can render without
      // forcing the rider to have a row (it gets created on first earn).
      return {
        riderId,
        tier: LoyaltyTier.Bronze,
        totalMiles: 0,
        availableMiles: 0,
        lifetimeMiles: 0,
        freeUpgradesRemaining: 0,
        hasFreeCancellation: false,
        updatedAt: new Date(),
      };
    }
    return this.toType(row);
  }

  async adjust(
    input: AdjustLoyaltyInput,
    actorId: number,
  ): Promise<AdminLoyaltyType> {
    if (input.delta === 0) {
      throw new BadRequestException('delta must be non-zero');
    }

    let row = await this.loyaltyRepo.findOne({
      where: { riderId: input.riderId },
    });
    if (!row) {
      row = await this.loyaltyRepo.save(
        this.loyaltyRepo.create({
          riderId: input.riderId,
          totalMiles: 0,
          availableMiles: 0,
          lifetimeMiles: 0,
          tier: LoyaltyTier.Bronze,
          freeUpgradesRemaining: 0,
          hasFreeCancellation: false,
        }),
      );
    }

    const newAvailable = Number(row.availableMiles) + input.delta;
    if (newAvailable < 0) {
      throw new BadRequestException(
        `Cannot deduct ${-input.delta} — rider only has ${row.availableMiles} available`,
      );
    }

    const newLifetime = Math.max(0, Number(row.lifetimeMiles) + input.delta);
    const newTotal = Math.max(0, Number(row.totalMiles) + input.delta);

    await this.loyaltyRepo.update(row.id, {
      availableMiles: newAvailable,
      lifetimeMiles: newLifetime,
      totalMiles: newTotal,
    });

    this.logger.log(
      `Admin #${actorId} adjusted rider #${input.riderId} miles by ${input.delta} (reason: ${input.reason})`,
    );

    const updated = await this.loyaltyRepo.findOne({ where: { id: row.id } });
    if (!updated) throw new NotFoundException('post-update read failed');
    return this.toType(updated);
  }

  private toType(r: LoyaltyEntity): AdminLoyaltyType {
    return {
      riderId: r.riderId,
      tier: r.tier,
      totalMiles: Number(r.totalMiles),
      availableMiles: Number(r.availableMiles),
      lifetimeMiles: Number(r.lifetimeMiles),
      freeUpgradesRemaining: r.freeUpgradesRemaining,
      hasFreeCancellation: r.hasFreeCancellation,
      surgeImmunityUntil: r.surgeImmunityUntil,
      updatedAt: r.updatedAt,
    };
  }
}
