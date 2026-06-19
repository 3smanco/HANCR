import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderEntity } from '@hancr/database';
import { RiderService } from './rider.service';
import { RiderResolver } from './rider.resolver';
import { UploadUrlService } from './upload-url.service';

@Module({
  imports: [TypeOrmModule.forFeature([RiderEntity])],
  providers: [RiderService, RiderResolver, UploadUrlService],
  exports: [RiderService],
})
export class RiderModule {}
