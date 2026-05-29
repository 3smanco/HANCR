import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddSosTables — جداول نظام الطوارئ (SOS)
 *
 * يُنشئ:
 *  - hancr_emergency_contact: جهات الطوارئ
 *  - hancr_sos_incident: حوادث SOS
 *  - 3 enums: sos_status, sos_triggered_by, emergency_contact_relation
 */
export class AddSosTables1779600000000 implements MigrationInterface {
  name = 'AddSosTables1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Enums ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "sos_status_enum" AS ENUM
        ('Active', 'Resolved', 'Cancelled', 'Escalated');
    `);

    await queryRunner.query(`
      CREATE TYPE "sos_triggered_by_enum" AS ENUM
        ('Rider', 'Driver', 'System');
    `);

    await queryRunner.query(`
      CREATE TYPE "emergency_contact_relation_enum" AS ENUM
        ('Family', 'Friend', 'Spouse', 'Colleague', 'Other');
    `);

    // ─── EmergencyContact ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "hancr_emergency_contact" (
        "id" SERIAL PRIMARY KEY,
        "owner_type" varchar(16) NOT NULL,
        "owner_id" integer NOT NULL,
        "name" varchar(100) NOT NULL,
        "phone_number" varchar(20) NOT NULL,
        "relation" "emergency_contact_relation_enum" NOT NULL DEFAULT 'Family',
        "auto_share_trips" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_emergency_contact_owner"
        ON "hancr_emergency_contact" ("owner_type", "owner_id");
    `);

    // ─── SosIncident ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "hancr_sos_incident" (
        "id" SERIAL PRIMARY KEY,
        "triggered_by" "sos_triggered_by_enum" NOT NULL,
        "triggered_by_id" integer NOT NULL,
        "order_id" integer,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "last_latitude" double precision,
        "last_longitude" double precision,
        "last_location_at" timestamp,
        "status" "sos_status_enum" NOT NULL DEFAULT 'Active',
        "admin_note" text,
        "contacts_notified" integer NOT NULL DEFAULT 0,
        "police_notified" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "resolved_at" timestamp,
        CONSTRAINT "fk_sos_order"
          FOREIGN KEY ("order_id") REFERENCES "hancr_order"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_sos_status" ON "hancr_sos_incident" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sos_created" ON "hancr_sos_incident" ("created_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sos_triggered_by"
        ON "hancr_sos_incident" ("triggered_by", "triggered_by_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_sos_incident";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_emergency_contact";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emergency_contact_relation_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sos_triggered_by_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sos_status_enum";`);
  }
}
