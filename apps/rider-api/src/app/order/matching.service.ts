import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverRedisService, NearbyDriver } from '@hancr/redis';
import { DriverEntity } from '@hancr/database';
import { AppConfigReader } from '../app-config/app-config-reader.service';

export interface MatchResult {
  driver: DriverEntity;
  distanceMeters: number;
  etaMinutes: number;
}

/**
 * فلاتر اختيارية للمطابقة — تُطبَّق بعد جلب السائقين القريبين.
 * كل قيمة undefined تعني "لا تطبّق هذا الفلتر".
 */
export interface MatchingFilters {
  /** يتطلّب gender='F' (وضع العائلة أو preferFemaleDriver) */
  requireFemale?: boolean;
  /** يتطلّب kidsApproved=true (School/Campus subscription) */
  requireKidsApproved?: boolean;
  /** يتطلّب nightApproved=true (Night Shift) */
  requireNightApproved?: boolean;
  /** VIP soft-target: ادعم سائقاً معيناً فقط (الباقي يُستبعد) */
  onlyDriverId?: number;
  /** I10 — معرّفات الأساطيل التي لها حصرية في منطقة الطلب */
  exclusiveFleetIds?: number[];
}

/**
 * MatchingService — محرك المطابقة بين الراكب والسائقين القريبين
 * يعتمد على Redis GEO لإيجاد أقرب السائقين في ثوانٍ
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly driverRedis: DriverRedisService,

    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,

    private readonly appConfig: AppConfigReader,
  ) {}

  /**
   * إيجاد أقرب السائقين المتاحين
   * @param lat خط العرض لنقطة الانطلاق
   * @param lng خط الطول لنقطة الانطلاق
   * @param serviceId معرّف الخدمة المطلوبة
   * @param radiusKm نصف قطر البحث بالكيلومتر
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    serviceId: number,
    radiusKm?: number,
    filters?: MatchingFilters,
  ): Promise<MatchResult[]> {
    // N1 — نصف القطر و ETA من لوحة التحكم (operationsConfig)
    const ops = await this.appConfig.getOperations();
    const effectiveRadiusKm = radiusKm ?? ops.searchRadiusKm ?? 5;
    const etaPerKm = ops.etaMinutesPerKm ?? 1.5;

    // تحويل إلى أمتار كما تتوقعه DriverRedisService
    const radiusMeters = effectiveRadiusKm * 1000;

    const nearby: NearbyDriver[] = await this.driverRedis.findNearbyDrivers(
      lat,
      lng,
      radiusMeters,
      serviceId,
    );

    if (nearby.length === 0) {
      this.logger.log(
        `No drivers found near (${lat}, ${lng}) within ${effectiveRadiusKm}km for service ${serviceId}`,
      );
      return [];
    }

    // جلب بيانات السائقين من قاعدة البيانات
    const driverIds = nearby.map((n) => n.driverId);
    const drivers = await this.driverRepo.findByIds(driverIds);
    const driverMap = new Map(drivers.map((d) => [d.id, d]));

    const results: MatchResult[] = [];

    for (const nearbyDriver of nearby) {
      const driver = driverMap.get(nearbyDriver.driverId);
      if (!driver || !driver.active || driver.banned) continue;

      // فلاتر Phase H — تُطبَّق فقط إن تم تمريرها
      if (filters?.onlyDriverId !== undefined &&
          driver.id !== filters.onlyDriverId) continue;
      if (filters?.requireFemale && driver.gender !== 'F') continue;
      if (filters?.requireKidsApproved && !driver.kidsApproved) continue;
      if (filters?.requireNightApproved && !driver.nightApproved) continue;

      // I10 — لو في أسطول حصري نشط في المنطقة، نستبعد من ليس منتمياً
      if (
        filters?.exclusiveFleetIds &&
        filters.exclusiveFleetIds.length > 0 &&
        (driver.fleetId == null ||
          !filters.exclusiveFleetIds.includes(driver.fleetId))
      ) {
        continue;
      }

      // حساب الوقت المتوقع للوصول (ETA) — المعدّل من لوحة التحكم
      const distanceKm = nearbyDriver.distanceMeters / 1000;
      const etaMinutes = Math.ceil(distanceKm * etaPerKm);

      results.push({
        driver,
        distanceMeters: nearbyDriver.distanceMeters,
        etaMinutes,
      });
    }

    this.logger.log(
      `Found ${results.length} valid drivers near (${lat}, ${lng})`,
    );

    return results;
  }

  /**
   * حساب السعر التقريبي للرحلة
   * @param distanceMeters المسافة بالأمتار
   * @param durationSeconds المدة بالثواني
   * @param baseFare الأجرة الأساسية
   * @param pricePerKm السعر لكل كيلومتر (perHundredMeters * 10)
   * @param pricePerMinute السعر لكل دقيقة
   */
  estimateFare(
    distanceMeters: number,
    durationSeconds: number,
    baseFare: number,
    pricePerKm: number,
    pricePerMinute: number,
  ): number {
    const distanceKm = distanceMeters / 1000;
    const durationMinutes = durationSeconds / 60;

    const fare =
      baseFare +
      distanceKm * pricePerKm +
      durationMinutes * pricePerMinute;

    return Math.round(fare * 100) / 100;
  }
}
