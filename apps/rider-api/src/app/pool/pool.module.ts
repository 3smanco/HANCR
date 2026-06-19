import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolEntity, PoolMemberEntity, RiderEntity } from '@hancr/database';
import { PoolResolver } from './pool.resolver';
import { PoolService } from './pool.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoolEntity, PoolMemberEntity, RiderEntity]),
  ],
  providers: [PoolResolver, PoolService],
  exports: [PoolService],
})
export class PoolModule {}
