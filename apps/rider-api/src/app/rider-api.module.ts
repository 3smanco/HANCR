import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { HANCR_ENTITIES } from '@hancr/database';

// Redis
import { HancrRedisModule } from '@hancr/redis';

// Notifications (Firebase + Twilio)
import { NotificationsModule } from '@hancr/notifications';

// Wallet (ledger + payment gateways)
import { WalletModule as HancrWalletModule } from '@hancr/wallet';

// SOS (safety system)
import { SosModule as HancrSosModule } from '@hancr/sos';

// Observability (Sentry + Health + Throttling)
import {
  ObservabilityModule,
  buildApolloLandingPagePlugins,
  buildGraphqlContext,
} from '@hancr/observability';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { RiderModule } from './rider/rider.module';
import { OrderModule } from './order/order.module';
import { AiModule } from './ai/ai.module';
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
import { PlacesModule } from './places/places.module';
import { SavedGroupModule } from './saved-group/saved-group.module';
import { SupportChatModule } from './support-chat/support-chat.module';
import { CommuterModule } from './commuter/commuter.module';
import { FlightModule } from './flight/flight.module';
import { CarpoolModule } from './carpool/carpool.module';
import { BundleModule } from './bundle/bundle.module';
import { CompanyModule } from './company/company.module';
import { ComplaintModule } from './complaint/complaint.module';
import { RiderMarketingModule } from './marketing/rider-marketing.module';

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
        entities: HANCR_ENTITIES,
        synchronize: false,
        logging: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // =============================================
    // GraphQL — Code First + Subscriptions (graphql-ws)
    // =============================================
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile:
        process.env['NODE_ENV'] === 'production'
          ? true
          : join(process.cwd(), 'apps/rider-api/schema.gql'),
      sortSchema: true,
      playground: false,
      introspection: process.env['NODE_ENV'] !== 'production',
      plugins: buildApolloLandingPagePlugins(),
      subscriptions: {
        'graphql-ws': true,
      },
      context: buildGraphqlContext,
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
    AiModule,
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
    PlacesModule,
    SavedGroupModule,
    SupportChatModule,
    CommuterModule,
    FlightModule,
    CarpoolModule,
    BundleModule,
    CompanyModule,
    ComplaintModule,
    RiderMarketingModule,
  ],
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class RiderApiModule {}
