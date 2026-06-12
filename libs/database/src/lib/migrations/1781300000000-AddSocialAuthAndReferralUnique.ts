import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * مصادقة اجتماعية (Google) + دخول بالإيميل + تفريد كود الإحالة.
 *
 *  - hancr_rider.google_id  : ربط حساب Google (nullable + unique).
 *  - hancr_driver.email     : دخول السائق بالإيميل (nullable + unique).
 *  - hancr_driver.google_id : ربط حساب Google للسائق (nullable + unique).
 *  - فهرس فريد على hancr_rider.referral_code — كان بلا قيد تفرّد (المجلس).
 *    قبل الفهرس: إعادة توليد أي أكواد مكرّرة (نُبقي الأقدم) لتفادي فشل الفهرس.
 *
 * (Postgres يعامل NULL في الفهرس الفريد كقيم متمايزة → تعدّد NULL مسموح.)
 */
export class AddSocialAuthAndReferralUnique1781300000000
  implements MigrationInterface
{
  name = 'AddSocialAuthAndReferralUnique1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── أعمدة المصادقة الاجتماعية ───
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" ADD COLUMN IF NOT EXISTS "google_id" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_driver" ADD COLUMN IF NOT EXISTS "email" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_driver" ADD COLUMN IF NOT EXISTS "google_id" varchar(255)`,
    );

    // فهارس فريدة للمصادقة الاجتماعية + إيميل السائق
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_rider_google_id" ON "hancr_rider" ("google_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_driver_email" ON "hancr_driver" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_driver_google_id" ON "hancr_driver" ("google_id")`,
    );

    // ─── تفريد كود الإحالة: نظّف المكرّرات أولاً ───
    // أبقِ الصف الأقدم (أصغر id) لكل كود، وأعد توليد البقية بقيمة فريدة قصيرة.
    await queryRunner.query(`
      UPDATE "hancr_rider" r
      SET "referral_code" = 'R' || lpad(r."id"::text, 10, '0')
      WHERE r."referral_code" IS NOT NULL
        AND r."id" <> (
          SELECT min(r2."id") FROM "hancr_rider" r2
          WHERE r2."referral_code" = r."referral_code"
        )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_rider_referral_code" ON "hancr_rider" ("referral_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_rider_referral_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_driver_google_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_driver_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_rider_google_id"`);
    await queryRunner.query(
      `ALTER TABLE "hancr_driver" DROP COLUMN IF EXISTS "google_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_driver" DROP COLUMN IF EXISTS "email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" DROP COLUMN IF EXISTS "google_id"`,
    );
  }
}
