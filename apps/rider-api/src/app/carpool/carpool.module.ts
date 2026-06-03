import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CarpoolRequestEntity,
  CarpoolMatchEntity,
  RiderEntity,
} from '@hancr/database';
import { CarpoolService } from './carpool.service';
import { CarpoolResolver } from './carpool.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarpoolRequestEntity,
      CarpoolMatchEntity,
      RiderEntity,
    ]),
  ],
  providers: [CarpoolService, CarpoolResolver],
})
export class CarpoolModule {}
