import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderEntity } from '@hancr/database';
import { RiderService } from './rider.service';
import { RiderResolver } from './rider.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RiderEntity])],
  providers: [RiderService, RiderResolver],
  exports: [RiderService],
})
export class RiderModule {}
