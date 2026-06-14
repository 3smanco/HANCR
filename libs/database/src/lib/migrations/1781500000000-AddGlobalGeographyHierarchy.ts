import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * الطبقة العالمية (Phase 0a) — تسلسل جغرافي Country → City → Region.
 *
 *  - hancr_country: الدولة (عملة، توقيت، علم، نظام قياس، قاعدة ضريبية،
 *    متطلبات وثائق، رقم طوارئ). الخليج مُفعَّل؛ لندن/نيويورك/باريس جاهزة معطّلة.
 *  - hancr_city: المدينة (توقيت محلي، مركز، صندوق حدودي).
 *  - hancr_region: أعمدة country_id / city_id / timezone + ربط المناطق الحالية
 *    بالدولة عبر العملة.
 *
 * idempotent: IF NOT EXISTS + ON CONFLICT DO NOTHING.
 */
export class AddGlobalGeographyHierarchy1781500000000
  implements MigrationInterface
{
  name = 'AddGlobalGeographyHierarchy1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── hancr_country ───
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hancr_country" (
        "id" SERIAL PRIMARY KEY,
        "iso2" varchar(2) NOT NULL UNIQUE,
        "name" varchar(100) NOT NULL,
        "name_en" varchar(100) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "timezone" varchar(64) NOT NULL DEFAULT 'UTC',
        "flag" varchar(8),
        "dial_code" varchar(8),
        "units" varchar(10) NOT NULL DEFAULT 'metric',
        "tax_rule" jsonb,
        "doc_requirements" jsonb NOT NULL DEFAULT '[]',
        "emergency_number" varchar(8),
        "enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )`);

    // ─── hancr_city ───
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hancr_city" (
        "id" SERIAL PRIMARY KEY,
        "country_id" integer NOT NULL REFERENCES "hancr_country"("id") ON DELETE CASCADE,
        "name" varchar(100) NOT NULL,
        "name_en" varchar(100) NOT NULL,
        "timezone" varchar(64) NOT NULL DEFAULT 'UTC',
        "center_lat" numeric(10,6),
        "center_lng" numeric(10,6),
        "bbox" jsonb,
        "enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_city_country" ON "hancr_city" ("country_id")`,
    );

    // ─── أعمدة hancr_region ───
    await queryRunner.query(
      `ALTER TABLE "hancr_region" ADD COLUMN IF NOT EXISTS "country_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_region" ADD COLUMN IF NOT EXISTS "city_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "hancr_region" ADD COLUMN IF NOT EXISTS "timezone" varchar(64)`,
    );

    // ─── بذر الدول (الخليج مُفعَّل، البقية جاهزة معطّلة) ───
    await queryRunner.query(`
      INSERT INTO "hancr_country"
        ("iso2","name","name_en","currency","timezone","flag","dial_code","units","tax_rule","doc_requirements","emergency_number","enabled")
      VALUES
        ('QA','قطر','Qatar','QAR','Asia/Qatar','🇶🇦','+974','metric','{"type":"NONE","rate":0}','["qatar_id","qatar_license","vehicle_registration"]','999',true),
        ('SA','السعودية','Saudi Arabia','SAR','Asia/Riyadh','🇸🇦','+966','metric','{"type":"VAT","rate":15}','["saudi_id","saudi_license","vehicle_registration"]','911',true),
        ('AE','الإمارات','United Arab Emirates','AED','Asia/Dubai','🇦🇪','+971','metric','{"type":"VAT","rate":5}','["emirates_id","uae_license","mulkiya"]','999',false),
        ('GB','بريطانيا','United Kingdom','GBP','Europe/London','🇬🇧','+44','imperial','{"type":"VAT","rate":20}','["pco_license","dvla_license","mot","insurance"]','999',false),
        ('US','الولايات المتحدة','United States','USD','America/New_York','🇺🇸','+1','imperial','{"type":"SALES","rate":0}','["dmv_license","clean_driving_record","insurance","vehicle_registration"]','911',false),
        ('FR','فرنسا','France','EUR','Europe/Paris','🇫🇷','+33','metric','{"type":"VAT","rate":20}','["vtc_card","eu_license","carte_grise","insurance"]','112',false)
      ON CONFLICT ("iso2") DO NOTHING`);

    // ─── بذر المدن ───
    await queryRunner.query(`
      INSERT INTO "hancr_city" ("country_id","name","name_en","timezone","center_lat","center_lng","enabled")
      SELECT c.id, v.name, v.name_en, v.tz, v.lat, v.lng, v.en FROM "hancr_country" c
      JOIN (VALUES
        ('QA','الدوحة','Doha','Asia/Qatar',25.2854,51.5310,true),
        ('SA','الرياض','Riyadh','Asia/Riyadh',24.7136,46.6753,true),
        ('SA','جدة','Jeddah','Asia/Riyadh',21.4858,39.1925,true),
        ('AE','دبي','Dubai','Asia/Dubai',25.2048,55.2708,false),
        ('AE','أبوظبي','Abu Dhabi','Asia/Dubai',24.4539,54.3773,false),
        ('GB','لندن','London','Europe/London',51.5074,-0.1278,false),
        ('US','نيويورك','New York','America/New_York',40.7128,-74.0060,false),
        ('FR','باريس','Paris','Europe/Paris',48.8566,2.3522,false)
      ) AS v(iso2,name,name_en,tz,lat,lng,en) ON v.iso2 = c.iso2
      WHERE NOT EXISTS (SELECT 1 FROM "hancr_city" ci WHERE ci.name_en = v.name_en)`);

    // ─── ربط المناطق الحالية بالدولة عبر العملة + توريث التوقيت ───
    await queryRunner.query(`
      UPDATE "hancr_region" r SET
        "country_id" = c.id,
        "timezone" = COALESCE(r."timezone", c."timezone")
      FROM "hancr_country" c
      WHERE r."country_id" IS NULL AND r."currency" = c."currency"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hancr_region" DROP COLUMN IF EXISTS "country_id"`);
    await queryRunner.query(`ALTER TABLE "hancr_region" DROP COLUMN IF EXISTS "city_id"`);
    await queryRunner.query(`ALTER TABLE "hancr_region" DROP COLUMN IF EXISTS "timezone"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_city"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hancr_country"`);
  }
}
