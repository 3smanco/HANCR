import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الدفعة الثالثة (الخصوصية) — حذف الحساب soft-delete:
 *  - hancr_rider.deleted_at (timestamp null) — null = فعّال، قيمة = طلب حذف.
 */
export class AddRiderDeletedAt1781700000000 implements MigrationInterface {
  name = 'AddRiderDeletedAt1781700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_rider" DROP COLUMN IF EXISTS "deleted_at"`,
    );
  }
}
