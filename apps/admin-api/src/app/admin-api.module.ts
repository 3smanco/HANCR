import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Entities (all registered so relations resolve)
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
  SosIncidentEntity,
  EmergencyContactEntity,
  CouponEntity,
  RideBundleEntity,
  RiderEntitlementEntity,
  CompanyEntity,
  CompanyEmployeeEntity,
  DriverDocumentEntity,
  ComplaintEntity,
  ComplaintActivityEntity,
  AdminUserEntity,
} from '@hancr/database';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './app-config/app-config.module';
import { UsersModule } from './users/users.module';
import { RegionsModule } from './regions/regions.module';
import { ServicesModule } from './services/services.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OrdersModule } from './orders/orders.module';
import { SosAdminModule } from './sos/sos-admin.module';
import { CouponsModule } from './coupons/coupons.module';
import { BundlesModule } from './bundles/bundles.module';
import { CompaniesModule } from './companies/companies.module';
import { DriversModule } from './drivers/drivers.module';
import { AdminWalletsModule } from './wallets/wallets.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { OperatorsModule } from './operators/operators.module';
import { AdminNotificationsModule } from './notifications/notifications.module';
import { NotificationsModule } from '@hancr/notifications';

// Observability
import { ObservabilityModule } from '@hancr/observability';

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
          SosIncidentEntity,
          EmergencyContactEntity,
          CouponEntity,
          RideBundleEntity,
          RiderEntitlementEntity,
          CompanyEntity,
          CompanyEmployeeEntity,
          DriverDocumentEntity,
          ComplaintEntity,
          ComplaintActivityEntity,
          AdminUserEntity,
        ],
        synchronize: false,
        logging: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // =============================================
    // GraphQL — Code First + Subscriptions (live SOS dashboard)
    // =============================================
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/admin-api/schema.gql'),
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
    // Feature Modules
    // =============================================
    AuthModule,
    AppConfigModule,
    UsersModule,
    RegionsModule,
    ServicesModule,
    AnalyticsModule,
    OrdersModule,
    SosAdminModule,
    CouponsModule,
    BundlesModule,
    CompaniesModule,
    DriversModule,
    AdminWalletsModule,
    ComplaintsModule,
    OperatorsModule,
    NotificationsModule,
    AdminNotificationsModule,
    ObservabilityModule,
  ],
})
export class AdminApiModule {}
