import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancelReasonEntity, ReviewParameterEntity } from '@hancr/database';
import { SettingsService } from './settings.service';
import { SettingsResolver } from './settings.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([CancelReasonEntity, ReviewParameterEntity]),
  ],
  providers: [SettingsService, SettingsResolver],
  exports: [SettingsService],
})
export class SettingsModule {}
