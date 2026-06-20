import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الدفعة 2 (Helpdesk) — SLA: عمود due_at على الشكوى (موعد استحقاق الرد).
 */
export class AddComplaintDueAt1781900000000 implements MigrationInterface {
  name = 'AddComplaintDueAt1781900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_complaint" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_complaint" DROP COLUMN IF EXISTS "due_at"`,
    );
  }
}
