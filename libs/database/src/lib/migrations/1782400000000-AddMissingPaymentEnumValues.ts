import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingPaymentEnumValues1782400000000
  implements MigrationInterface
{
  name = 'AddMissingPaymentEnumValues1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."payment_mode_enum" ADD VALUE IF NOT EXISTS 'Entitlement'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payment_mode_enum" ADD VALUE IF NOT EXISTS 'Company'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wallet_owner_type_enum" ADD VALUE IF NOT EXISTS 'Company'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values are intentionally left in place once deployed.
  }
}
