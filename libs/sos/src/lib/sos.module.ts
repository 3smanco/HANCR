import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SosIncidentEntity,
  EmergencyContactEntity,
  OrderEntity,
} from '@hancr/database';
import { NotificationsModule } from '@hancr/notifications';
import { SosService } from './sos.service';

/**
 * SosModule — مكتبة الطوارئ المركزية.
 *
 * @Global لأن SosService يُستخدم من resolvers في كلا الـ rider-api و driver-api.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SosIncidentEntity,
      EmergencyContactEntity,
      OrderEntity,
    ]),
    NotificationsModule,
  ],
  providers: [SosService],
  exports: [SosService],
})
export class SosModule {}
