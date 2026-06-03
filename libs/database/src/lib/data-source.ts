import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

import { RegionEntity } from './entities/region.entity';
import { ServiceEntity } from './entities/service.entity';
import { RiderEntity } from './entities/rider.entity';
import { DriverEntity } from './entities/driver.entity';
import { OrderEntity } from './entities/order.entity';
import { LoyaltyEntity } from './entities/loyalty.entity';
import { DriverStarsEntity } from './entities/driver-stars.entity';
import { BidEntity } from './entities/bid.entity';
import { BidOfferEntity } from './entities/bid-offer.entity';
import { PoolEntity } from './entities/pool.entity';
import { PoolMemberEntity } from './entities/pool-member.entity';
import { AppConfigEntity } from './entities/app-config.entity';
import { ConfigAuditLogEntity } from './entities/config-audit-log.entity';
import { RequestActivityEntity } from './entities/request-activity.entity';
import { OrderMessageEntity } from './entities/order-message.entity';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity';
import { EmergencyContactEntity } from './entities/emergency-contact.entity';
import { SosIncidentEntity } from './entities/sos-incident.entity';
import { CouponEntity } from './entities/coupon.entity';
import { SavedPlaceEntity } from './entities/saved-place.entity';

/**
 * قائمة كاملة بجميع Entities في HANCR
 */
export const HANCR_ENTITIES = [
  RegionEntity,
  ServiceEntity,
  RiderEntity,
  DriverEntity,
  OrderEntity,
  LoyaltyEntity,
  DriverStarsEntity,
  BidEntity,
  BidOfferEntity,
  PoolEntity,
  PoolMemberEntity,
  AppConfigEntity,
  ConfigAuditLogEntity,
  RequestActivityEntity,
  OrderMessageEntity,
  WalletTransactionEntity,
  EmergencyContactEntity,
  SosIncidentEntity,
  CouponEntity,
  SavedPlaceEntity,
];

/**
 * DataSource للـ TypeORM CLI (migrations)
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DATABASE_HOST'] ?? 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] ?? '5432'),
  username: process.env['DATABASE_USER'] ?? 'hancr',
  password: process.env['DATABASE_PASSWORD'] ?? 'hancr_dev_pass',
  database: process.env['DATABASE_NAME'] ?? 'hancr',
  entities: HANCR_ENTITIES,
  migrations: ['libs/database/src/lib/migrations/*.ts'],
  synchronize: false,
  logging: process.env['NODE_ENV'] === 'development',
});
