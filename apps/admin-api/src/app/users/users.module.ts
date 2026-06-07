import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverEntity,
  OrderEntity,
  RiderEntity,
  SavedPlaceEntity,
} from '@hancr/database';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiderEntity,
      DriverEntity,
      OrderEntity,
      SavedPlaceEntity,
    ]),
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
