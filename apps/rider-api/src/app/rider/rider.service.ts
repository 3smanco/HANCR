import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiderEntity } from '@hancr/database';
import { UpdateRiderInput } from './dto/update-rider.input';
import { RiderType } from './dto/rider.type';

@Injectable()
export class RiderService {
  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
  ) {}

  async findById(id: number): Promise<RiderEntity> {
    const rider = await this.riderRepo.findOne({ where: { id } });
    if (!rider) throw new NotFoundException(`Rider #${id} not found`);
    return rider;
  }

  async update(riderId: number, input: UpdateRiderInput): Promise<RiderType> {
    await this.riderRepo.update(riderId, {
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.email && { email: input.email }),
      ...(input.fcmToken && { fcmToken: input.fcmToken }),
      ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
    });

    const rider = await this.findById(riderId);
    return this.toType(rider);
  }

  async getMe(riderId: number): Promise<RiderType> {
    const rider = await this.findById(riderId);
    return this.toType(rider);
  }

  /** بيانات إحالة الراكب: كوده + عدد من أحالهم وكم منهم كوفئ */
  async getReferral(riderId: number): Promise<{
    code?: string;
    referredCount: number;
    rewardedCount: number;
  }> {
    const rider = await this.findById(riderId);
    const referredCount = await this.riderRepo.count({
      where: { referredBy: riderId },
    });
    const rewardedCount = await this.riderRepo.count({
      where: { referredBy: riderId, referralRewarded: true },
    });
    return { code: rider.referralCode, referredCount, rewardedCount };
  }

  /**
   * Update only the FCM token (called from mobile app on login/token refresh)
   */
  async updateFcmToken(riderId: number, fcmToken: string): Promise<boolean> {
    await this.riderRepo.update(riderId, { fcmToken });
    return true;
  }

  /** Clear FCM token (called on logout) */
  async clearFcmToken(riderId: number): Promise<boolean> {
    await this.riderRepo.update(riderId, { fcmToken: undefined });
    return true;
  }

  toType(rider: RiderEntity): RiderType {
    return {
      id: rider.id,
      phoneNumber: rider.phoneNumber,
      countryCode: rider.countryCode,
      firstName: rider.firstName,
      lastName: rider.lastName,
      avatarUrl: rider.avatarUrl,
      email: rider.email,
      banned: rider.banned,
      active: rider.active,
      balance: Number(rider.balance),
      currency: rider.currency,
      rating: Number(rider.rating),
      totalRides: rider.totalRides,
      lastLoginAt: rider.lastLoginAt,
      createdAt: rider.createdAt,
    };
  }
}
