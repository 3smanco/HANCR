import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Entities (all registered so relations resolve)
import {
  RegionEntity,
  CountryEntity,
  CityEntity,
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
  AnnouncementEntity,
  GiftBatchEntity,
  GiftCodeEntity,
  PayoutMethodEntity,
  PayoutSessionEntity,
  PayoutEntryEntity,
  CancelReasonEntity,
  ReviewParameterEntity,
  FleetEntity,
  PricingZoneEntity,
  LeadEntity,
  DriverApplicationEntity,
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
import { MarketingModule } from './marketing/marketing.module';
import { AdminPayoutsModule } from './payouts/payouts.module';
import { LiveModule } from './live/live.module';
import { SettingsModule } from './settings/settings.module';
import { FleetsModule } from './fleets/fleets.module';
import { PricingZonesModule } from './pricing-zones/pricing-zones.module';
import { LeadsModule } from './leads/leads.module';
import { DriverApplicationsModule } from './driver-applications/driver-applications.module';
import { LoyaltyAdminModule } from './loyalty/loyalty-admin.module';
import { AdminNotificationsModule } from './notifications/notifications.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { CurrencyModule } from './currency/currency.module';
import { ScopeModule } from './scope/scope.module';
import { GeographyModule } from './geography/geography.module';
import { GlobalOpsModule } from './global-ops/global-ops.module';
import { InvoiceModule } from './invoicing/invoice.module';
import { CrmModule } from './crm/crm.module';
import { ComplianceModule } from './compliance/compliance.module';
import { FleetOpsModule } from './fleet-ops/fleet-ops.module';
import { GrowthModule } from './growth/growth.module';
import { SosCenterModule } from './sos-center/sos-center.module';
import { NotificationsModule } from '@hancr/notifications';
import { ScheduleModule } from '@nestjs/schedule';

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

    // N11 — جدولة الحملات + auto-surge
    ScheduleModule.forRoot(),

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
          CountryEntity,
          CityEntity,
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
          AnnouncementEntity,
          GiftBatchEntity,
          GiftCodeEntity,
          PayoutMethodEntity,
          PayoutSessionEntity,
          PayoutEntryEntity,
          CancelReasonEntity,
          ReviewParameterEntity,
          FleetEntity,
          PricingZoneEntity,
          LeadEntity,
          DriverApplicationEntity,
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
    IntelligenceModule,
    CurrencyModule,
    ScopeModule,
    GeographyModule,
    GlobalOpsModule,
    InvoiceModule,
    CrmModule,
    ComplianceModule,
    FleetOpsModule,
    GrowthModule,
    SosCenterModule,
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
    MarketingModule,
    AdminPayoutsModule,
    LiveModule,
    SettingsModule,
    FleetsModule,
    PricingZonesModule,
    LeadsModule,
    DriverApplicationsModule,
    LoyaltyAdminModule,
    NotificationsModule,
    AdminNotificationsModule,
    ObservabilityModule,
  ],
})
export class AdminApiModule {}
