import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from '@hancr/database';
import { ServiceResolver } from './service.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  providers: [ServiceResolver],
})
export class ServiceModule {}
