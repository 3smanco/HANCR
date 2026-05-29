import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolEntity, PoolMemberEntity } from '@hancr/database';
import { PoolResolver } from './pool.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([PoolEntity, PoolMemberEntity])],
  providers: [PoolResolver],
})
export class PoolModule {}
