import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideBundleEntity } from '@hancr/database';
import { BundlesService } from './bundles.service';
import { BundlesResolver } from './bundles.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RideBundleEntity])],
  providers: [BundlesService, BundlesResolver],
  exports: [BundlesService],
})
export class BundlesModule {}
