import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * RBAC مُنطقَن (Phase 0c) — عمود hancr_admin_user.scope (jsonb).
 * null = عالمي. مثال: {"countries":["QA"],"cities":[1]} = قطر/الدوحة فقط.
 * `super` يبقى عالمياً بغضّ النظر عن النطاق.
 */
export class AddOperatorScope1781500001000 implements MigrationInterface {
  name = 'AddOperatorScope1781500001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_admin_user" ADD COLUMN IF NOT EXISTS "scope" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hancr_admin_user" DROP COLUMN IF EXISTS "scope"`,
    );
  }
}
