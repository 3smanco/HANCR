import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * B2 — عدّاد وصول السائق + الانتظار.
 * arrived_at: لحظة ضغط السائق «وصلت» — مرجع حساب وقت الانتظار المجاني/المدفوع.
 * (waitCost / waitMinutes موجودان أصلاً في الجدول.)
 */
export class AddOrderArrivedAt1782400000000 implements MigrationInterface {
  name = 'AddOrderArrivedAt1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order" ADD COLUMN IF NOT EXISTS "arrived_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_order" DROP COLUMN IF EXISTS "arrived_at"`,
    );
  }
}
