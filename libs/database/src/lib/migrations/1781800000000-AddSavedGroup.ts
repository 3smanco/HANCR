import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الدفعة الرابعة (الختام) — المجموعات المحفوظة:
 *  - hancr_saved_group: مجموعات شخصية/مهنية لمشاركة الرحلات بسرعة.
 */
export class AddSavedGroup1781800000000 implements MigrationInterface {
  name = 'AddSavedGroup1781800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hancr_saved_group" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(100) NOT NULL,
        "type" varchar(16) NOT NULL DEFAULT 'personal',
        "members" jsonb NOT NULL DEFAULT '[]',
        "owner_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_saved_group_owner" ON "hancr_saved_group" ("owner_id")`,
    );
    await queryRunner
      .query(`
        ALTER TABLE "hancr_saved_group"
        ADD CONSTRAINT "FK_saved_group_owner"
        FOREIGN KEY ("owner_id") REFERENCES "hancr_rider"("id") ON DELETE CASCADE
      `)
      .catch(() => {
        /* القيد موجود مسبقاً — تجاهل */
      });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_saved_group"`);
  }
}
