import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الرحلات المشتركة (Share Pooling) — عمود تجميع الطلبات.
 * pool_group_id = id أول طلب في المجموعة؛ كل ركّاب نفس الرحلة المشتركة يتشاركونه.
 */
export class AddOrderPoolGroup1782300000000 implements MigrationInterface {
  name = 'AddOrderPoolGroup1782300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order" ADD COLUMN IF NOT EXISTS "pool_group_id" INT`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_order_pool_group" ON "hancr_order" ("pool_group_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_order_pool_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_order" DROP COLUMN IF EXISTS "pool_group_id"`,
    );
  }
}
