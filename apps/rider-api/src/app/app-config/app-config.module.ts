import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigEntity } from '@hancr/database';
import { AppConfigResolver } from './app-config.resolver';
import { AppConfigReader } from './app-config-reader.service';

/**
 * Global so AppConfigReader can be injected into auth/order/loyalty/matching
 * services without re-importing TypeOrmModule.forFeature everywhere.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AppConfigEntity])],
  providers: [AppConfigResolver, AppConfigReader],
  exports: [AppConfigReader],
})
export class RiderAppConfigModule {}
