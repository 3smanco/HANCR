import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '@hancr/database';
import { OperatorsService } from './operators.service';
import { OperatorsResolver } from './operators.resolver';
import { ScopeModule } from '../scope/scope.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUserEntity]), ScopeModule],
  providers: [OperatorsService, OperatorsResolver],
  exports: [OperatorsService],
})
export class OperatorsModule {}
