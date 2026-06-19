import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الدفعة الثانية — إنجاز المؤجَّل:
 *  - hancr_rider: team_code (الفريق/الدولة) + حقول التحقق بخطوتين (TOTP)
 *  - hancr_rider_device: أجهزة/جلسات الراكب (jti لكل توكن) لإبطال جهاز بعينه
 *
 * (حدود الإنفاق العائلية تستخدم جداول hancr_pool/hancr_pool_member الموجودة
 *  أصلاً، فلا تحتاج تغييراً سكيمياً هنا.)
 */
export class AddTeamTwoFactorAndDevices1781600000000
  implements MigrationInterface
{
  name = 'AddTeamTwoFactorAndDevices1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── hancr_rider: الفريق + 2FA ───
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" ADD COLUMN IF NOT EXISTS "team_code" varchar(4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" ADD COLUMN IF NOT EXISTS "two_factor_secret" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" ADD COLUMN IF NOT EXISTS "two_factor_recovery" jsonb`,
    );

    // ─── hancr_rider_device ───
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hancr_rider_device" (
        "id" SERIAL PRIMARY KEY,
        "jti" varchar(64) NOT NULL,
        "device_name" varchar(120),
        "platform" varchar(16),
        "revoked" boolean NOT NULL DEFAULT false,
        "last_active_at" TIMESTAMP,
        "rider_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rider_device_jti" ON "hancr_rider_device" ("jti")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rider_device_rider" ON "hancr_rider_device" ("rider_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "hancr_rider_device"
      ADD CONSTRAINT "FK_rider_device_rider"
      FOREIGN KEY ("rider_id") REFERENCES "hancr_rider"("id") ON DELETE CASCADE
    `).catch(() => {
      /* القيد موجود مسبقاً — تجاهل */
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_rider_device"`);
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" DROP COLUMN IF EXISTS "two_factor_recovery"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" DROP COLUMN IF EXISTS "two_factor_secret"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" DROP COLUMN IF EXISTS "two_factor_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" DROP COLUMN IF EXISTS "team_code"`,
    );
  }
}
