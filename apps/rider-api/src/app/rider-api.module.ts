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
  CouponEntity,
  SavedPlaceEntity,
  CommuterSubscriptionEntity,
  FlightTrackingEntity,
} from '@hancr/database';

// Redis
import { HancrRedisModule } from '@hancr/redis';

// Notifications (Firebase + Twilio)
import { NotificationsModule } from '@hancr/notifications';

// Wallet (ledger + payment gateways)
import { WalletModule as HancrWalletModule } from '@hancr/wallet';

// SOS (safety system)
import { SosModule as HancrSosModule } from '@hancr/sos';

// Observability (Sentry + Health + Throttling)
import { ObservabilityModule } from '@hancr/observability';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { RiderModule } from './rider/rider.module';
import { OrderModule } from './order/order.module';
import { BidModule } from './bid/bid.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { ServiceModule } from './service/service.module';
import { PoolModule } from './pool/pool.module';
import { WalletModule } from './wallet/wallet.module';
import { SosModule } from './sos/sos.module';
import { TrackingModule } from './tracking/tracking.module';
import { RiderAppConfigModule } from './app-config/app-config.module';
import { ChatModule } from './chat/chat.module';
import { SavedPlaceModule } from './saved-place/saved-place.module';
import { CommuterModule } from './commuter/commuter.module';
import { FlightModule } from './flight/flight.module';

// PubSub
import { pubSubProvider } from './pubsub.provider';

@Module({
  imports: [
    // =============================================
    // Config — متغيرات البيئة (global)
    // =============================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // =============================================
    // TypeORM — PostgreSQL 16 + PostGIS (port 5433)
    // =============================================
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
          CommuterSubscriptionEntity,
          FlightTrackingEntity,
        ],
        synchronize: false,
        logging: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // =============================================
    // GraphQL — Code First + Subscriptions (graphql-ws)
    // =============================================
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/rider-api/schema.gql'),
      sortSchema: true,
      playground: process.env['NODE_ENV'] !== 'production',
      introspection: process.env['NODE_ENV'] !== 'production',
      subscriptions: {
        'graphql-ws': true,
      },
      context: (ctx: { req?: unknown; request?: unknown }) => ({
        req: ctx.req ?? ctx.request,
      }),
    }),

    // =============================================
    // Scheduler — مهام دورية (انتهاء Bid، تنظيف Redis)
    // =============================================
    ScheduleModule.forRoot(),

    // =============================================
    // Redis Global Module
    // =============================================
    HancrRedisModule,

    // =============================================
    // Notifications (FCM + Twilio) — Global
    // =============================================
    NotificationsModule,
    HancrWalletModule,
    HancrSosModule,
    ObservabilityModule,

    // =============================================
    // Feature Modules
    // =============================================
    AuthModule,
    RiderModule,
    OrderModule,
    BidModule,
    LoyaltyModule,
    ServiceModule,
    PoolModule,
    WalletModule,
    SosModule,
    TrackingModule,
    RiderAppConfigModule,
    ChatModule,
    SavedPlaceModule,
    CommuterModule,
    FlightModule,
  ],
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class RiderApiModule {}
