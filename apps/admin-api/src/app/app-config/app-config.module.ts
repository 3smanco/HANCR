import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigEntity } from '@hancr/database';
import { AppConfigService } from './app-config.service';
import { AppConfigResolver } from './app-config.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfigEntity])],
  providers: [AppConfigService, AppConfigResolver],
  exports: [AppConfigService],
})
export class AppConfigModule {}
