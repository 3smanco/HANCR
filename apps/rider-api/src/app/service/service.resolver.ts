import { Resolver, Query, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity, RegionEntity } from '@hancr/database';
import { ServiceType } from './dto/service.type';
import { RegionLookupType } from './dto/region-lookup.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => ServiceType)
export class ServiceResolver {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
    @InjectRepository(RegionEntity)
    private readonly regionRepo: Repository<RegionEntity>,
  ) {}

  /**
   * قائمة الخدمات المتاحة في المنطقة
   * (يُستخدم لعرض شبكة الخدمات في الصفحة الرئيسية)
   */
  @Query(() => [ServiceType], {
    description: 'قائمة الخدمات المتاحة حسب المنطقة',
  })
  @UseGuards(JwtAuthGuard)
  async services(
    @Args('regionId', { type: () => Int }) regionId: number,
  ): Promise<ServiceType[]> {
    const services = await this.serviceRepo.find({
      where: { regionId, enabled: true },
      order: { displayOrder: 'ASC' },
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      nameEn: s.nameEn,
      serviceType: s.serviceType,
      baseFare: Number(s.baseFare),
      minimumFee: Number(s.minimumFee),
      hourlyRate: s.hourlyRate ? Number(s.hourlyRate) : undefined,
      searchRadius: s.searchRadius,
      bidModeEnabled: s.bidModeEnabled,
      enabled: s.enabled,
      displayOrder: s.displayOrder,
      iconUrl: s.iconUrl,
      isVip: s.isVip,
    }));
  }

  /**
   * يحدّد المنطقة التي تقع فيها نقطة جغرافية (PostGIS ST_Contains، نفس منطق
   * resolveRegionIdFromPoint في order.service.ts). استعلام عام بلا مصادقة —
   * يُستخدم لتحديد منطقة الزائر/الراكب قبل تسجيل الدخول أو عرض الخدمات.
   * يعيد null إن كانت النقطة خارج كل المناطق المفعّلة.
   */
  @Query(() => RegionLookupType, {
    nullable: true,
    description: 'المنطقة التي تحتوي نقطة الإحداثيات المعطاة، أو null إن لم تُخدَم',
  })
  async nearestRegion(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ): Promise<RegionLookupType | null> {
    const rows = await this.regionRepo.manager.query<
      Array<{
        id: number;
        name: string;
        nameEn: string;
        currency: string;
        countryId: number | null;
        cityId: number | null;
      }>
    >(
      `SELECT id, name, name_en as "nameEn", currency, country_id as "countryId", city_id as "cityId"
       FROM hancr_region
       WHERE enabled = true AND boundary IS NOT NULL
         AND ST_Contains(
           ST_SetSRID(ST_GeomFromGeoJSON(boundary::text), 4326),
           ST_SetSRID(ST_MakePoint($1, $2), 4326)
         )
       ORDER BY ST_Area(ST_GeomFromGeoJSON(boundary::text)) ASC
       LIMIT 1`,
      [lng, lat],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      nameEn: row.nameEn,
      currency: row.currency,
      countryId: row.countryId ?? undefined,
      cityId: row.cityId ?? undefined,
    };
  }

  /**
   * المناطق المفعّلة عالمياً — استعلام عام يُستخدم لصفحة /cities.
   */
  @Query(() => [RegionLookupType], {
    description: 'قائمة المناطق المفعّلة',
  })
  async activeRegions(): Promise<RegionLookupType[]> {
    const regions = await this.regionRepo.find({ where: { enabled: true } });
    return regions.map((r) => ({
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      currency: r.currency,
      countryId: r.countryId,
      cityId: r.cityId,
    }));
  }
}
