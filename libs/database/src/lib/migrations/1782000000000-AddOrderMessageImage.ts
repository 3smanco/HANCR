import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الدفعة 3 (الشات) — مرفق صورة في رسائل الشات.
 */
export class AddOrderMessageImage1782000000000 implements MigrationInterface {
  name = 'AddOrderMessageImage1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order_message" ADD COLUMN IF NOT EXISTS "image_url" varchar(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order_message" DROP COLUMN IF EXISTS "image_url"`,
    );
  }
}
