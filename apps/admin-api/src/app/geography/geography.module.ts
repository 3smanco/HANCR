import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityEntity, CountryEntity } from '@hancr/database';
import { GeographyService } from './geography.service';
import { GeographyResolver } from './geography.resolver';

/**
 * الجغرافيا (Phase 1) — قراءة/إدارة الدول والمدن.
 * يغذّي فلتر الدولة/المدينة في الشريط العلوي وإدارة تفعيل الأسواق.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity, CityEntity])],
  providers: [GeographyService, GeographyResolver],
  exports: [GeographyService],
})
export class GeographyModule {}
