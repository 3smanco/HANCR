import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddWalletTransactions
 *
 * Adds:
 *  - `wallet_owner_type_enum` (Rider | Driver)
 *  - `wallet_transaction_type_enum` (10 values)
 *  - `wallet_transaction_direction_enum` (Credit | Debit)
 *  - `wallet_transaction_status_enum` (Pending | Completed | Failed | Reversed)
 *  - `payment_gateway_enum` (Internal, HyperPay, Moyasar, Stripe, ...)
 *  - `hancr_wallet_transaction` table with indexes
 */
export class AddWalletTransactions1779500000000 implements MigrationInterface {
  name = 'AddWalletTransactions1779500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Enums ───
    await queryRunner.query(`
      CREATE TYPE "wallet_owner_type_enum" AS ENUM ('Rider', 'Driver');
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_transaction_type_enum" AS ENUM (
        'Recharge', 'TripPayment', 'CancellationFee', 'Refund',
        'PromoBonus', 'LoyaltyRedemption', 'AdminAdjustment',
        'Tip', 'DriverEarnings', 'DriverWithdrawal'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_transaction_direction_enum" AS ENUM ('Credit', 'Debit');
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_transaction_status_enum" AS ENUM (
        'Pending', 'Completed', 'Failed', 'Reversed'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_gateway_enum" AS ENUM (
        'Internal', 'HyperPay', 'Moyasar', 'Stripe',
        'ApplePay', 'GooglePay', 'Manual'
      );
    `);

    // ─── Table ───
    await queryRunner.query(`
      CREATE TABLE "hancr_wallet_transaction" (
        "id" SERIAL PRIMARY KEY,
        "owner_type" "wallet_owner_type_enum" NOT NULL,
        "owner_id" integer NOT NULL,
        "type" "wallet_transaction_type_enum" NOT NULL,
        "direction" "wallet_transaction_direction_enum" NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "balance_after" decimal(12,2) NOT NULL,
        "currency" char(3) NOT NULL,
        "status" "wallet_transaction_status_enum" NOT NULL DEFAULT 'Pending',
        "gateway" "payment_gateway_enum" NOT NULL DEFAULT 'Internal',
        "gateway_ref" varchar,
        "order_id" integer,
        "description" varchar(500),
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "completed_at" timestamp,
        CONSTRAINT "fk_wallet_tx_order"
          FOREIGN KEY ("order_id") REFERENCES "hancr_order"("id") ON DELETE SET NULL
      );
    `);

    // ─── Indexes ───
    await queryRunner.query(`
      CREATE INDEX "idx_wallet_tx_owner_created"
        ON "hancr_wallet_transaction" ("owner_type", "owner_id", "created_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_wallet_tx_status"
        ON "hancr_wallet_transaction" ("status");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_wallet_tx_gateway_ref"
        ON "hancr_wallet_transaction" ("gateway_ref")
        WHERE "gateway_ref" IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_wallet_transaction";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_gateway_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_transaction_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_transaction_direction_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_transaction_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_owner_type_enum";`);
  }
}
