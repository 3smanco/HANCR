import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { DriverEntity, DriverStatus } from '@hancr/database';
import { DriverRedisService } from '@hancr/redis';
import { UpdateLocationInput } from './dto/update-location.input';
import { DriverLocationType } from './dto/driver-location.type';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,

    private readonly driverRedis: DriverRedisService,
  ) {}

  /**
   * تحديث موقع السائق — يُستدعى كل 4 ثوانٍ من التطبيق
   * يحدّث Redis GEO SET فوراً للمطابقة الفورية
   */
  async updateLocation(
    driverId: number,
    input: UpdateLocationInput,
  ): Promise<DriverLocationType> {
    // جلب الـ serviceIds من قاعدة البيانات إذا لم تُرسَل
    let serviceIds = input.serviceIds ?? [];
    if (serviceIds.length === 0) {
      const driver = await this.driverRepo.findOne({
        where: { id: driverId },
        select: ['serviceIds'],
      });
      serviceIds = driver?.serviceIds ?? [];
    }

    await this.driverRedis.updateLocation({
      driverId,
      lat: input.lat,
      lng: input.lng,
      heading: input.heading,
      serviceIds,
    });

    return {
      driverId,
      lat: input.lat,
      lng: input.lng,
      heading: input.heading,
      updatedAt: new Date(),
    };
  }

  /**
   * السائق يتحول إلى Online
   */
  async goOnline(driverId: number): Promise<boolean> {
    await this.driverRepo.update(driverId, { status: DriverStatus.Online });
    await this.driverRedis.setStatus(driverId, 'Online');
    this.logger.log(`Driver #${driverId} is now ONLINE`);
    return true;
  }

  /**
   * السائق يتحول إلى Offline
   */
  async goOffline(driverId: number): Promise<boolean> {
    await this.driverRepo.update(driverId, { status: DriverStatus.Offline });
    await this.driverRedis.setStatus(driverId, 'Offline');
    this.logger.log(`Driver #${driverId} is now OFFLINE`);
    return true;
  }

  /**
   * جلب الموقع الحالي للسائق
   */
  async getLocation(driverId: number): Promise<DriverLocationType | null> {
    const loc = await this.driverRedis.getDriverLocation(driverId);
    if (!loc) return null;

    return {
      driverId,
      lat: loc.lat,
      lng: loc.lng,
      heading: loc.heading,
      updatedAt: new Date(),
    };
  }

  /**
   * Cron: تنظيف السائقين غير النشطين كل دقيقة
   * السائق "غير نشط" إذا لم يُرسِل تحديث موقع منذ 60 ثانية
   */
  @Cron('0 * * * * *') // كل دقيقة
  async cleanupStaleDrivers(): Promise<void> {
    const count = await this.driverRedis.cleanupStaleDrivers();
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} stale drivers from Redis`);
    }
  }
}
