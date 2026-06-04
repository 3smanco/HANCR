import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from '@hancr/database';
import { UpdateDriverInput } from './dto/update-driver.input';
import { DriverType } from './dto/driver.type';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
  ) {}

  async findById(id: number): Promise<DriverEntity> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    return driver;
  }

  async getMe(driverId: number): Promise<DriverType> {
    return this.toType(await this.findById(driverId));
  }

  /** Update only the FCM token (mobile app on login / refresh) */
  async updateFcmToken(driverId: number, fcmToken: string): Promise<boolean> {
    await this.driverRepo.update(driverId, { fcmToken });
    return true;
  }

  /** Clear FCM token (logout) */
  async clearFcmToken(driverId: number): Promise<boolean> {
    await this.driverRepo.update(driverId, { fcmToken: undefined });
    return true;
  }

  async update(driverId: number, input: UpdateDriverInput): Promise<DriverType> {
    await this.driverRepo.update(driverId, {
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.carBrand && { carBrand: input.carBrand }),
      ...(input.carModel && { carModel: input.carModel }),
      ...(input.carColor && { carColor: input.carColor }),
      ...(input.plateNumber && { plateNumber: input.plateNumber }),
      ...(input.carYear && { carYear: input.carYear }),
      ...(input.carPhotoUrl && { carPhotoUrl: input.carPhotoUrl }),
      ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
      ...(input.fcmToken && { fcmToken: input.fcmToken }),
      ...(input.serviceIds && { serviceIds: input.serviceIds }),
      ...(input.gender && { gender: input.gender }),
    });
    return this.getMe(driverId);
  }

  toType(d: DriverEntity): DriverType {
    return {
      id: d.id,
      phoneNumber: d.phoneNumber,
      countryCode: d.countryCode,
      firstName: d.firstName,
      lastName: d.lastName,
      avatarUrl: d.avatarUrl,
      status: d.status,
      active: d.active,
      banned: d.banned,
      rating: Number(d.rating),
      ratingCount: d.ratingCount,
      carBrand: d.carBrand,
      carModel: d.carModel,
      carColor: d.carColor,
      plateNumber: d.plateNumber,
      carYear: d.carYear,
      carPhotoUrl: d.carPhotoUrl,
      balance: Number(d.balance),
      currency: d.currency,
      fcmToken: d.fcmToken,
      regionId: d.regionId,
      createdAt: d.createdAt,
      gender: d.gender,
      kidsApproved: d.kidsApproved ?? false,
      nightApproved: d.nightApproved ?? false,
    };
  }
}
