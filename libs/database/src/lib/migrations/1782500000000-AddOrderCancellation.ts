import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * E — الإلغاء + الرسوم.
 * cancel_reason: سبب الإلغاء الذي يختاره الراكب.
 * cancellation_fee: رسم الإلغاء المحتسَب (0 = مجاني قبل إسناد السائق).
 */
export class AddOrderCancellation1782500000000 implements MigrationInterface {
  name = 'AddOrderCancellation1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order" ADD COLUMN IF NOT EXISTS "cancel_reason" VARCHAR(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_order" ADD COLUMN IF NOT EXISTS "cancellation_fee" NUMERIC(10,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order" DROP COLUMN IF EXISTS "cancellation_fee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_order" DROP COLUMN IF EXISTS "cancel_reason"`,
    );
  }
}
