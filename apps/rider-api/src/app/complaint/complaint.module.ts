import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintActivityEntity, ComplaintEntity } from '@hancr/database';
import {
  RiderComplaintResolver,
  RiderComplaintService,
} from './complaint.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplaintEntity, ComplaintActivityEntity]),
  ],
  providers: [RiderComplaintService, RiderComplaintResolver],
})
export class ComplaintModule {}
