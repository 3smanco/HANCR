import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverStarsEntity } from '@hancr/database';
import { StarsType } from './dto/stars.type';

// نقاط العبور للمستويات
const LEVELS = [
  { threshold: 0,   commission: 20 },
  { threshold: 100, commission: 17 },
  { threshold: 300, commission: 15 },
  { threshold: 700, commission: 12 },
];

@Injectable()
export class StarsService {
  private readonly logger = new Logger(StarsService.name);

  constructor(
    @InjectRepository(DriverStarsEntity)
    private readonly starsRepo: Repository<DriverStarsEntity>,
  ) {}

  async getOrCreate(driverId: number): Promise<StarsType> {
    let stars = await this.starsRepo.findOne({ where: { driverId } });

    if (!stars) {
      stars = this.starsRepo.create({
        driverId,
        totalStars: 0,
        currentCommissionPercent: 20,
        completedRides: 0,
        averageRating: 5.0,
        starsFromRating: 0,
        starsFromLongTrips: 0,
        starsFromPeakHours: 0,
        starsFromNoCancel: 0,
        noCancelStreakWeeks: 0,
      });
      stars = await this.starsRepo.save(stars);
    }

    return this.toType(stars);
  }

  /**
   * إضافة نجوم بعد رحلة مكتملة
   */
  async addStarsForRide(
    driverId: number,
    rating: number,
    distanceMeters: number,
    isPeakHour: boolean,
  ): Promise<StarsType> {
    let stars = await this.starsRepo.findOne({ where: { driverId } });
    if (!stars) {
      const created = await this.getOrCreate(driverId);
      stars = await this.starsRepo.findOne({ where: { driverId } }) as DriverStarsEntity;
      if (!stars) throw new Error('Failed to create stars record');
    }

    let starsEarned = 0;

    // نجوم التقييم
    if (rating >= 4.8) {
      starsEarned += 2;
      stars.starsFromRating = Number(stars.starsFromRating) + 2;
    } else if (rating >= 4.5) {
      starsEarned += 1;
      stars.starsFromRating = Number(stars.starsFromRating) + 1;
    }

    // نجوم الرحلة الطويلة (>= 20 كم)
    if (distanceMeters >= 20000) {
      starsEarned += 1;
      stars.starsFromLongTrips = Number(stars.starsFromLongTrips) + 1;
    }

    // نجوم ساعة الذروة
    if (isPeakHour) {
      starsEarned += 0.5;
      stars.starsFromPeakHours = Number(stars.starsFromPeakHours) + 0.5;
    }

    const newTotal = Number(stars.totalStars) + starsEarned;
    const newCommission = this.calculateCommission(newTotal);
    const newRides = stars.completedRides + 1;
    const newAvgRating =
      (Number(stars.averageRating) * stars.completedRides + rating) / newRides;

    if (newCommission < Number(stars.currentCommissionPercent)) {
      this.logger.log(
        `Driver #${driverId} commission reduced to ${newCommission}% (${newTotal} stars)`,
      );
    }

    await this.starsRepo.update(stars.id, {
      totalStars: newTotal,
      currentCommissionPercent: newCommission,
      completedRides: newRides,
      averageRating: Math.round(newAvgRating * 100) / 100,
      starsFromRating: stars.starsFromRating,
      starsFromLongTrips: stars.starsFromLongTrips,
      starsFromPeakHours: stars.starsFromPeakHours,
    });

    const updated = { ...stars, totalStars: newTotal, currentCommissionPercent: newCommission, completedRides: newRides };
    return this.toType(updated as DriverStarsEntity);
  }

  private calculateCommission(totalStars: number): number {
    let commission = 20;
    for (const level of LEVELS) {
      if (totalStars >= level.threshold) {
        commission = level.commission;
      }
    }
    return commission;
  }

  private getNextLevel(totalStars: number): { starsNeeded: number; commission: number } {
    for (let i = 1; i < LEVELS.length; i++) {
      if (totalStars < LEVELS[i].threshold) {
        return {
          starsNeeded: LEVELS[i].threshold - totalStars,
          commission: LEVELS[i].commission,
        };
      }
    }
    return { starsNeeded: 0, commission: 12 };
  }

  private toType(stars: DriverStarsEntity): StarsType {
    const total = Number(stars.totalStars);
    const next = this.getNextLevel(total);

    return {
      id: stars.id,
      totalStars: total,
      currentCommissionPercent: Number(stars.currentCommissionPercent),
      completedRides: stars.completedRides,
      averageRating: Number(stars.averageRating),
      starsFromRating: Number(stars.starsFromRating),
      starsFromLongTrips: Number(stars.starsFromLongTrips),
      starsFromPeakHours: Number(stars.starsFromPeakHours),
      starsFromNoCancel: Number(stars.starsFromNoCancel),
      noCancelStreakWeeks: stars.noCancelStreakWeeks,
      starsToNextLevel: next.starsNeeded,
      nextCommissionPercent: next.commission,
      updatedAt: stars.updatedAt,
    };
  }
}
