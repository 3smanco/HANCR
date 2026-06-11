import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * فهارس الأداء على المسارات الساخنة.
 *
 * بدونها: كل تسجيل دخول واستعلام طلب نشط وكل cron (كل 30-60 ثانية) يُجري
 * مسحاً تسلسلياً كاملاً للجدول. عند حجم MENA يرتفع زمن الاستجابة وحمل DB
 * حتى التعارض على الأقفال. (phone_number مفهرس مسبقاً عبر unique.)
 */
export class AddPerformanceIndexes1779700000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // الطلبات — مسح الحالة (cron) + بحث طلبات الراكب/السائق + الطلبات المجدولة
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_order_status" ON "hancr_order" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_order_rider_id" ON "hancr_order" ("rider_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_order_driver_id" ON "hancr_order" ("driver_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_order_status_expected" ON "hancr_order" ("status", "expected_timestamp")`,
    );

    // المزايدات — cron تنظيف المنتهية (status + expires_at)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bid_status_expires" ON "hancr_bid" ("status", "expires_at")`,
    );

    // السائقون — استعلامات المطابقة حسب الحالة
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_driver_status" ON "hancr_driver" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_driver_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bid_status_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_status_expected"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_driver_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_rider_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_status"`);
  }
}
