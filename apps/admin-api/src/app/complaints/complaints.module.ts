import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ComplaintActivityEntity,
  ComplaintEntity,
  DriverEntity,
  RiderEntity,
} from '@hancr/database';
import { ComplaintsService } from './complaints.service';
import { ComplaintsResolver } from './complaints.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComplaintEntity,
      ComplaintActivityEntity,
      RiderEntity,
      DriverEntity,
    ]),
  ],
  providers: [ComplaintsService, ComplaintsResolver],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
