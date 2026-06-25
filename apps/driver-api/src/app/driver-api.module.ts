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

// Notifications (FCM + Twilio)
import { NotificationsModule } from '@hancr/notifications';
import { WalletModule as HancrWalletModule } from '@hancr/wallet';
import { SosModule as HancrSosModule } from '@hancr/sos';
import {
  ObservabilityModule,
  buildApolloLandingPagePlugins,
  buildGraphqlContext,
} from '@hancr/observability';

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
import { AnnouncementsModule } from './announcements/announcements.module';

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
        entities: HANCR_ENTITIES,
        synchronize: false,
        logging: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile:
        process.env['NODE_ENV'] === 'production'
          ? true
          : join(process.cwd(), 'apps/driver-api/schema.gql'),
      sortSchema: true,
      playground: false,
      introspection: process.env['NODE_ENV'] !== 'production',
      plugins: buildApolloLandingPagePlugins(),
      subscriptions: { 'graphql-ws': true },
      context: buildGraphqlContext,
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
    AnnouncementsModule,
  ],
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class DriverApiModule {}
