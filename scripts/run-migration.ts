import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// import all entities
import { RegionEntity } from '../libs/database/src/lib/entities/region.entity';
import { ServiceEntity } from '../libs/database/src/lib/entities/service.entity';
import { RiderEntity } from '../libs/database/src/lib/entities/rider.entity';
import { DriverEntity } from '../libs/database/src/lib/entities/driver.entity';
import { OrderEntity } from '../libs/database/src/lib/entities/order.entity';
import { LoyaltyEntity } from '../libs/database/src/lib/entities/loyalty.entity';
import { DriverStarsEntity } from '../libs/database/src/lib/entities/driver-stars.entity';
import { BidEntity } from '../libs/database/src/lib/entities/bid.entity';
import { BidOfferEntity } from '../libs/database/src/lib/entities/bid-offer.entity';
import { PoolEntity } from '../libs/database/src/lib/entities/pool.entity';
import { PoolMemberEntity } from '../libs/database/src/lib/entities/pool-member.entity';
import { AppConfigEntity } from '../libs/database/src/lib/entities/app-config.entity';
import { ConfigAuditLogEntity } from '../libs/database/src/lib/entities/config-audit-log.entity';
import { RequestActivityEntity } from '../libs/database/src/lib/entities/request-activity.entity';
import { OrderMessageEntity } from '../libs/database/src/lib/entities/order-message.entity';
import { InitialHancrSchema1748300000000 } from '../libs/database/src/lib/migrations/1748300000000-InitialHancrSchema';

const ds = new DataSource({
  type: 'postgres',
  host: process.env['DATABASE_HOST'] || 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] || '5432'),
  username: process.env['DATABASE_USER'] || 'hancr',
  password: process.env['DATABASE_PASSWORD'] || 'hancr_dev_pass',
  database: process.env['DATABASE_NAME'] || 'hancr',
  entities: [
    RegionEntity, ServiceEntity, RiderEntity, DriverEntity, OrderEntity,
    LoyaltyEntity, DriverStarsEntity, BidEntity, BidOfferEntity,
    PoolEntity, PoolMemberEntity, AppConfigEntity, ConfigAuditLogEntity,
    RequestActivityEntity, OrderMessageEntity,
  ],
  migrations: [InitialHancrSchema1748300000000],
  logging: true,
});

async function main(): Promise<void> {
  console.log('Connecting to PostgreSQL...');
  await ds.initialize();
  console.log('Running migrations...');
  const ran = await ds.runMigrations({ transaction: 'all' });
  console.log(`Migrations complete: ${ran.length} migration(s) ran`);
  ran.forEach(m => console.log(`  [OK] ${m.name}`));
  await ds.destroy();
  process.exit(0);
}

main().catch((err: Error) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
