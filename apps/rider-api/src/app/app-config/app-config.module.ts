import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigEntity } from '@hancr/database';
import { AppConfigResolver } from './app-config.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfigEntity])],
  providers: [AppConfigResolver],
})
export class RiderAppConfigModule {}
