import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadEntity } from '@hancr/database';
import { LeadsService } from './leads.service';
import { LeadsResolver } from './leads.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([LeadEntity])],
  providers: [LeadsService, LeadsResolver],
  exports: [LeadsService],
})
export class LeadsModule {}
