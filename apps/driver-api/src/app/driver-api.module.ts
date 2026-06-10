import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// Entities
import {
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
  DriverDocumentEntity,
  ComplaintEntity,
  ComplaintActivityEntity,
  AnnouncementEntity,
  PayoutMethodEntity,
  PayoutEntryEntity,
  CancelReasonEntity,
  ReviewParameterEntity,
  FleetEntity,
  PricingZoneEntity,
} from '@hancr/database';

// Redis
import { HancrRedisModule } from '@hancr/redis';

// Notifications (FCM + Twilio)
import { NotificationsModule } from '@hancr/notifications';
import { WalletModule as HancrWalletModule } from '@hancr/wallet';
import { SosModule as HancrSosModule } from '@hancr/sos';
import { ObservabilityModule } from '@hancr/observability';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { DriverModule } from './driver/driver.module';
import { PayoutsModule } from './payouts/payouts.module';
import { LocationModule } from './location/location.module';
import { OrderModule } from './order/order.module';
import { StarsModule } from './stars/stars.module';
import { BidModule } from './bid/bid.module';
import { WalletModule } from './wallet/wallet.module';
import { SosModule } from './sos/sos.module';
import { ChatModule } from './chat/chat.module';
import { DriverAppConfigModule } from './app-config/app-config.module';
import { DriverToolsModule } from './driver-tools/driver-tools.module';

// PubSub
import { pubSubProvider } from './pubsub.provider';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DATABASE_HOST') ?? 'localhost',
        port: cfg.get<number>('DATABASE_PORT') ?? 5433,
        username: cfg.get<string>('DATABASE_USER') ?? 'hancr',
        password: cfg.get<string>('DATABASE_PASSWORD') ?? 'hancr_dev_pass',
        database: cfg.get<string>('DATABASE_NAME') ?? 'hancr',
        entities: [
          RegionEntity, ServiceEntity, RiderEntity, DriverEntity,
          OrderEntity, LoyaltyEntity, DriverStarsEntity, BidEntity,
          BidOfferEntity, PoolEntity, PoolMemberEntity, AppConfigEntity,
          ConfigAuditLogEntity, RequestActivityEntity, OrderMessageEntity,
          WalletTransactionEntity, EmergencyContactEntity, SosIncidentEntity,
          DriverDocumentEntity,
          ComplaintEntity,
          ComplaintActivityEntity,
          AnnouncementEntity,
          PayoutMethodEntity,
          PayoutEntryEntity,
          CancelReasonEntity,
          ReviewParameterEntity,
          FleetEntity,
          PricingZoneEntity,
        ],
        synchronize: false,
        logging: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/driver-api/schema.gql'),
      sortSchema: true,
      playground: process.env['NODE_ENV'] !== 'production',
      introspection: process.env['NODE_ENV'] !== 'production',
      subscriptions: { 'graphql-ws': true },
      context: (ctx: { req?: unknown; request?: unknown }) => ({
        req: ctx.req ?? ctx.request,
      }),
    }),

    ScheduleModule.forRoot(),
    HancrRedisModule,
    NotificationsModule,
    HancrWalletModule,
    HancrSosModule,
    ObservabilityModule,

    // Feature Modules
    AuthModule,
    DriverModule,
    LocationModule,
    OrderModule,
    StarsModule,
    BidModule,
    WalletModule,
    SosModule,
    ChatModule,
    PayoutsModule,
    DriverAppConfigModule,
    DriverToolsModule,
  ],
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class DriverApiModule {}
