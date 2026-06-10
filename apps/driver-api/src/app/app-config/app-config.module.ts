import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigEntity } from '@hancr/database';
import { ThemeResolver } from './theme.resolver';

/**
 * N5 — وحدة إعدادات التطبيق للسائق.
 * حالياً تُوفِّر استعلام الثيم الحي العام فقط (appTheme).
 */
@Module({
  imports: [TypeOrmModule.forFeature([AppConfigEntity])],
  providers: [ThemeResolver],
})
export class DriverAppConfigModule {}
