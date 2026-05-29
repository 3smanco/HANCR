import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration الأولي — إنشاء قاعدة بيانات HANCR كاملة
 * يُنشئ جميع الجداول والـ Enums والـ Indexes
 */
export class InitialHancrSchema1748300000000 implements MigrationInterface {
  name = 'InitialHancrSchema1748300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // تفعيل PostGIS
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ===== Enums =====
    await queryRunner.query(`
      CREATE TYPE "public"."order_status_enum" AS ENUM(
        'Requested','NotFound','NoCloseFound','Found','DriverAccepted',
        'WaitingForPrePay','Arrived','Started','WaitingForPostPay',
        'WaitingForReview','Finished','DriverCanceled','RiderCanceled',
        'Booked','Expired'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."order_type_enum" AS ENUM(
        'Ride','Rideshare','ParcelDelivery','HourlyChauffeur','ScheduledRide'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."service_type_enum" AS ENUM(
        'RideSharing','PackageDelivery','HourlyChauffeur'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."payment_mode_enum" AS ENUM(
        'Cash','SavedPaymentMethod','PaymentGateway','Wallet'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."driver_status_enum" AS ENUM(
        'Online','Offline','Busy','Inactive'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."loyalty_tier_enum" AS ENUM(
        'Bronze','Silver','Gold','Platinum'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."bid_status_enum" AS ENUM(
        'Open','Accepted','Expired','Canceled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."pool_type_enum" AS ENUM(
        'Family','Corporate'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."request_activity_type_enum" AS ENUM(
        'RequestedByRider','BookedByRider','RequestedByOperator',
        'DriverAccepted','ArrivedToPickupPoint','Started',
        'ArrivedToDestination','CanceledByDriver','CanceledByRider',
        'CanceledByOperator','Paid','Reviewed','Expired',
        'OtpVerified','OtpFailed'
      )
    `);

    // ===== hancr_region =====
    await queryRunner.query(`
      CREATE TABLE "hancr_region" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "name_en" VARCHAR(100) NOT NULL,
        "currency" CHAR(3) NOT NULL,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "boundary" JSONB,
        "bid_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
        "metro_api_url" VARCHAR,
        "default_search_radius" INT NOT NULL DEFAULT 5000,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_rider =====
    await queryRunner.query(`
      CREATE TABLE "hancr_rider" (
        "id" SERIAL PRIMARY KEY,
        "phone_number" VARCHAR NOT NULL UNIQUE,
        "country_code" VARCHAR(5) NOT NULL,
        "first_name" VARCHAR,
        "last_name" VARCHAR,
        "avatar_url" VARCHAR,
        "email" VARCHAR UNIQUE,
        "banned" BOOLEAN NOT NULL DEFAULT false,
        "ban_reason" VARCHAR,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" CHAR(3) NOT NULL DEFAULT 'QAR',
        "fcm_token" VARCHAR,
        "pool_id" INT,
        "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        "total_rides" INT NOT NULL DEFAULT 0,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_driver =====
    await queryRunner.query(`
      CREATE TABLE "hancr_driver" (
        "id" SERIAL PRIMARY KEY,
        "phone_number" VARCHAR NOT NULL UNIQUE,
        "country_code" VARCHAR(5) NOT NULL,
        "first_name" VARCHAR NOT NULL,
        "last_name" VARCHAR NOT NULL,
        "avatar_url" VARCHAR,
        "status" "public"."driver_status_enum" NOT NULL DEFAULT 'Offline',
        "banned" BOOLEAN NOT NULL DEFAULT false,
        "active" BOOLEAN NOT NULL DEFAULT false,
        "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        "rating_count" INT NOT NULL DEFAULT 0,
        "car_brand" VARCHAR,
        "car_model" VARCHAR,
        "car_color" VARCHAR,
        "plate_number" VARCHAR,
        "car_year" INT,
        "car_photo_url" VARCHAR,
        "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" CHAR(3) NOT NULL DEFAULT 'QAR',
        "region_id" INT,
        "fcm_token" VARCHAR,
        "service_ids" JSONB NOT NULL DEFAULT '[]',
        "fleet_id" INT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_service =====
    await queryRunner.query(`
      CREATE TABLE "hancr_service" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "name_en" VARCHAR(100) NOT NULL,
        "service_type" "public"."service_type_enum" NOT NULL,
        "base_fare" DECIMAL(10,2) NOT NULL,
        "per_hundred_meters" DECIMAL(10,4) NOT NULL,
        "per_minute_drive" DECIMAL(10,4) NOT NULL,
        "per_minute_wait" DECIMAL(10,4) NOT NULL,
        "minimum_fee" DECIMAL(10,2) NOT NULL,
        "hourly_rate" DECIMAL(10,2),
        "extra_minute_rate" DECIMAL(10,4),
        "provider_share_percent" DECIMAL(5,2) NOT NULL DEFAULT 20,
        "prepay_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "cancellation_total_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "cancellation_driver_share" DECIMAL(5,2) NOT NULL DEFAULT 50,
        "time_multipliers" JSONB NOT NULL DEFAULT '[]',
        "weekday_multipliers" JSONB NOT NULL DEFAULT '[]',
        "date_range_multipliers" JSONB NOT NULL DEFAULT '[]',
        "search_radius" INT NOT NULL DEFAULT 5000,
        "available_time_from" VARCHAR,
        "available_time_to" VARCHAR,
        "bid_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "display_order" INT NOT NULL DEFAULT 0,
        "icon_url" VARCHAR,
        "is_vip" BOOLEAN NOT NULL DEFAULT false,
        "region_id" INT NOT NULL REFERENCES "hancr_region"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_order =====
    await queryRunner.query(`
      CREATE TABLE "hancr_order" (
        "id" SERIAL PRIMARY KEY,
        "created_on" TIMESTAMP NOT NULL DEFAULT now(),
        "type" "public"."order_type_enum" NOT NULL DEFAULT 'Ride',
        "status" "public"."order_status_enum" NOT NULL DEFAULT 'Requested',
        "start_timestamp" TIMESTAMP,
        "finish_timestamp" TIMESTAMP,
        "expected_timestamp" TIMESTAMP,
        "eta_pickup" TIMESTAMP,
        "cost_best" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "cost_after_coupon" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "provider_share" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "wait_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "ride_options_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "tax_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "currency" CHAR(3) NOT NULL DEFAULT 'QAR',
        "distance_best" INT NOT NULL DEFAULT 0,
        "duration_best" INT NOT NULL DEFAULT 0,
        "wait_minutes" INT NOT NULL DEFAULT 0,
        "points" TEXT,
        "addresses" JSONB NOT NULL DEFAULT '[]',
        "directions" TEXT,
        "quiet_ride" BOOLEAN NOT NULL DEFAULT false,
        "requested_temperature" INT,
        "audio_off" BOOLEAN NOT NULL DEFAULT false,
        "number_masked" BOOLEAN NOT NULL DEFAULT false,
        "otp_code" VARCHAR(6),
        "otp_expires_at" TIMESTAMP,
        "otp_attempts" INT NOT NULL DEFAULT 0,
        "receiver_phone" VARCHAR,
        "receiver_name" VARCHAR,
        "is_bid_order" BOOLEAN NOT NULL DEFAULT false,
        "bid_id" INT,
        "booked_hours" INT,
        "payment_mode" "public"."payment_mode_enum",
        "rider_id" INT NOT NULL REFERENCES "hancr_rider"("id"),
        "driver_id" INT REFERENCES "hancr_driver"("id"),
        "service_id" INT NOT NULL REFERENCES "hancr_service"("id"),
        "region_id" INT NOT NULL REFERENCES "hancr_region"("id"),
        "pool_id" INT,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_loyalty =====
    await queryRunner.query(`
      CREATE TABLE "hancr_loyalty" (
        "id" SERIAL PRIMARY KEY,
        "total_miles" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "available_miles" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "lifetime_miles" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "tier" "public"."loyalty_tier_enum" NOT NULL DEFAULT 'Bronze',
        "surge_immunity_until" TIMESTAMP,
        "free_upgrades_remaining" INT NOT NULL DEFAULT 0,
        "has_free_cancellation" BOOLEAN NOT NULL DEFAULT false,
        "rider_id" INT NOT NULL UNIQUE REFERENCES "hancr_rider"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_driver_stars =====
    await queryRunner.query(`
      CREATE TABLE "hancr_driver_stars" (
        "id" SERIAL PRIMARY KEY,
        "total_stars" DECIMAL(10,1) NOT NULL DEFAULT 0,
        "current_commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 20,
        "completed_rides" INT NOT NULL DEFAULT 0,
        "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        "stars_from_rating" DECIMAL(10,1) NOT NULL DEFAULT 0,
        "stars_from_long_trips" DECIMAL(10,1) NOT NULL DEFAULT 0,
        "stars_from_peak_hours" DECIMAL(10,1) NOT NULL DEFAULT 0,
        "stars_from_no_cancel" DECIMAL(10,1) NOT NULL DEFAULT 0,
        "last_no_cancel_date" TIMESTAMP,
        "no_cancel_streak_weeks" INT NOT NULL DEFAULT 0,
        "driver_id" INT NOT NULL UNIQUE REFERENCES "hancr_driver"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_bid =====
    await queryRunner.query(`
      CREATE TABLE "hancr_bid" (
        "id" SERIAL PRIMARY KEY,
        "status" "public"."bid_status_enum" NOT NULL DEFAULT 'Open',
        "expires_at" TIMESTAMP NOT NULL,
        "rider_proposed_price" DECIMAL(10,2) NOT NULL,
        "currency" CHAR(3) NOT NULL,
        "points" TEXT NOT NULL,
        "addresses" JSONB NOT NULL DEFAULT '[]',
        "estimated_distance" INT NOT NULL DEFAULT 0,
        "estimated_duration" INT NOT NULL DEFAULT 0,
        "accepted_offer_id" INT,
        "rider_id" INT NOT NULL REFERENCES "hancr_rider"("id"),
        "service_id" INT NOT NULL REFERENCES "hancr_service"("id"),
        "region_id" INT NOT NULL REFERENCES "hancr_region"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_bid_offer =====
    await queryRunner.query(`
      CREATE TABLE "hancr_bid_offer" (
        "id" SERIAL PRIMARY KEY,
        "offered_price" DECIMAL(10,2) NOT NULL,
        "accepted" BOOLEAN NOT NULL DEFAULT false,
        "bid_id" INT NOT NULL REFERENCES "hancr_bid"("id"),
        "driver_id" INT NOT NULL REFERENCES "hancr_driver"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_pool =====
    await queryRunner.query(`
      CREATE TABLE "hancr_pool" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "pool_type" "public"."pool_type_enum" NOT NULL,
        "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" CHAR(3) NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "monthly_limit" DECIMAL(10,2),
        "owner_id" INT NOT NULL REFERENCES "hancr_rider"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_pool_member =====
    await queryRunner.query(`
      CREATE TABLE "hancr_pool_member" (
        "id" SERIAL PRIMARY KEY,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "monthly_spend_limit" DECIMAL(10,2),
        "allowed_from" VARCHAR,
        "allowed_to" VARCHAR,
        "allowed_days" JSONB,
        "current_month_spend" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "pool_id" INT NOT NULL REFERENCES "hancr_pool"("id"),
        "rider_id" INT NOT NULL REFERENCES "hancr_rider"("id"),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_app_config =====
    await queryRunner.query(`
      CREATE TABLE "hancr_app_config" (
        "id" SERIAL PRIMARY KEY,
        "config_key" VARCHAR NOT NULL UNIQUE,
        "theme_config" JSONB NOT NULL DEFAULT '{}',
        "home_screen_config" JSONB NOT NULL DEFAULT '{}',
        "feature_flags" JSONB NOT NULL DEFAULT '{}',
        "loyalty_config" JSONB NOT NULL DEFAULT '{}',
        "version" VARCHAR NOT NULL DEFAULT '1.0.0',
        "updated_by" VARCHAR,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_config_audit_log =====
    await queryRunner.query(`
      CREATE TABLE "hancr_config_audit_log" (
        "id" SERIAL PRIMARY KEY,
        "admin_id" INT NOT NULL,
        "admin_email" VARCHAR NOT NULL,
        "config_type" VARCHAR NOT NULL,
        "action" VARCHAR(20) NOT NULL,
        "previous_value" JSONB,
        "new_value" JSONB,
        "reason" VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== hancr_request_activity =====
    await queryRunner.query(`
      CREATE TABLE "hancr_request_activity" (
        "id" SERIAL PRIMARY KEY,
        "type" "public"."request_activity_type_enum" NOT NULL,
        "metadata" JSONB,
        "occurred_at" TIMESTAMP NOT NULL DEFAULT now(),
        "order_id" INT NOT NULL REFERENCES "hancr_order"("id") ON DELETE CASCADE
      )
    `);

    // ===== hancr_order_message =====
    await queryRunner.query(`
      CREATE TABLE "hancr_order_message" (
        "id" SERIAL PRIMARY KEY,
        "message" TEXT NOT NULL,
        "sender_type" VARCHAR(10) NOT NULL,
        "sender_id" INT NOT NULL,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "order_id" INT NOT NULL REFERENCES "hancr_order"("id") ON DELETE CASCADE,
        "sent_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ===== Indexes لتحسين الأداء =====
    await queryRunner.query(`CREATE INDEX "idx_order_rider" ON "hancr_order"("rider_id")`);
    await queryRunner.query(`CREATE INDEX "idx_order_driver" ON "hancr_order"("driver_id")`);
    await queryRunner.query(`CREATE INDEX "idx_order_status" ON "hancr_order"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_order_region" ON "hancr_order"("region_id")`);
    await queryRunner.query(`CREATE INDEX "idx_driver_status" ON "hancr_driver"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_bid_status" ON "hancr_bid"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_activity_order" ON "hancr_request_activity"("order_id")`);

    // ===== البيانات الأولية للتطوير =====
    await queryRunner.query(`
      INSERT INTO "hancr_region"
        ("name","name_en","currency","enabled","default_search_radius")
      VALUES
        ('قطر','Qatar','QAR',true,5000),
        ('الإمارات','UAE','AED',false,5000),
        ('السعودية','Saudi Arabia','SAR',false,5000)
    `);

    await queryRunner.query(`
      INSERT INTO "hancr_app_config"
        ("config_key","theme_config","feature_flags","loyalty_config","version")
      VALUES (
        'main',
        '{"economySkin":{"background":"#F2E9E4","text":"#22223B","accent":"#22223B","border":"#C9ADA7"},"vipSkin":{"background":"#22223B","text":"#F2E9E4","accent":"#B048FF","border":"rgba(176,72,255,0.3)"}}',
        '{"bid_mode":{"enabled":true,"regions":["QA"]},"ai_voice":{"enabled":true},"guest_booking":{"enabled":true},"hancr_shield":{"enabled":false},"multi_modal":{"enabled":false}}',
        '{"milesPerKm":{"RideSharing":1.0,"HourlyChauffeur":1.5,"PackageDelivery":0.5},"tierThresholds":{"Silver":100,"Gold":300,"Platinum":700},"redemptionRate":0.01}',
        '1.0.0'
      )
    `);

    console.log('✅ HANCR قاعدة البيانات الأولية أُنشئت بنجاح');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // حذف بالترتيب العكسي لتجنب Foreign Key errors
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_order_message"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_request_activity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_config_audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_app_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_pool_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_pool"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_bid_offer"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_bid"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_driver_stars"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_loyalty"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_order"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_service"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_driver"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_rider"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_region"`);

    // حذف الـ Enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."request_activity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."pool_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bid_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."loyalty_tier_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."driver_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."payment_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."service_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."order_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."order_status_enum"`);
  }
}
