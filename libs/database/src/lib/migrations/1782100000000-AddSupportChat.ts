import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الدفعة 4 — شات الدعم الحي (راكب↔موظف):
 *  - hancr_support_conversation + hancr_support_message.
 */
export class AddSupportChat1782100000000 implements MigrationInterface {
  name = 'AddSupportChat1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hancr_support_conversation" (
        "id" SERIAL PRIMARY KEY,
        "rider_id" integer NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'open',
        "assigned_agent_id" integer,
        "last_message_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_support_conv_rider" ON "hancr_support_conversation" ("rider_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_support_conv_status" ON "hancr_support_conversation" ("status")`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hancr_support_message" (
        "id" SERIAL PRIMARY KEY,
        "conversation_id" integer NOT NULL,
        "sender_type" varchar(10) NOT NULL,
        "sender_id" integer NOT NULL,
        "body" text NOT NULL,
        "image_url" varchar(500),
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_support_msg_conv" ON "hancr_support_message" ("conversation_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_support_message"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_support_conversation"`);
  }
}
