import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity, CountryEntity, RegionEntity } from '@hancr/database';
import { ScopeService } from './scope.service';

/**
 * RBAC مُنطقَن (Phase 0c) — يُصدّر ScopeService لتستهلكه كل الوحدات
 * التي تحتاج تقييد قوائمها بالنطاق الجغرافي للمشغّل.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity, CountryEntity, RegionEntity]),
  ],
  providers: [ScopeService],
  exports: [ScopeService],
})
export class ScopeModule {}
