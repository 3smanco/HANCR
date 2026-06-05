import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverEntity,
  PayoutEntryEntity,
  PayoutMethodEntity,
} from '@hancr/database';
import { PayoutsResolver, PayoutsService } from './payouts.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayoutMethodEntity,
      PayoutEntryEntity,
      DriverEntity,
    ]),
  ],
  providers: [PayoutsService, PayoutsResolver],
})
export class PayoutsModule {}
