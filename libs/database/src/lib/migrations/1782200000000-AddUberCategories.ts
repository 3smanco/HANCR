import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * إضافة فئات بأسلوب أوبر لكل منطقة مفعّلة (idempotent):
 *  - Share  (مشاركة اقتصادية — أرخص ~20% من Economy). ملاحظة: التجميع الفعلي
 *            (pooling/matching) عمل لاحق؛ تُضاف الآن كفئة فردية مخفّضة.
 *  - Black  (فاخرة Premier — أعلى سعر).
 * كل الأعمدة jsonb للمضاعفات = '[]' (مصفوفة صحيحة) لتفادي خطأ "object is not iterable".
 * لا يمسّ الخدمات الموجودة (Economy/Comfort/XL/Parcel/Hourly/VIP).
 */
export class AddUberCategories1782200000000 implements MigrationInterface {
  name = 'AddUberCategories1782200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN SELECT id FROM hancr_region LOOP
          -- Share (مشاركة) — اقتصادية مخفّضة
          IF NOT EXISTS (
            SELECT 1 FROM hancr_service WHERE name_en = 'Share' AND region_id = r.id
          ) THEN
            INSERT INTO hancr_service
              (name,name_en,service_type,base_fare,per_hundred_meters,per_minute_drive,
               per_minute_wait,minimum_fee,provider_share_percent,prepay_percent,
               cancellation_total_fee,cancellation_driver_share,
               time_multipliers,weekday_multipliers,date_range_multipliers,
               search_radius,bid_mode_enabled,enabled,display_order,is_vip,region_id)
            VALUES
              ('مشاركة','Share','RideSharing',4.0,0.4,0.25,0.08,6.0,15.0,0.0,5.0,3.0,
               '[]','[]','[]',3000,false,true,2,false,r.id);
          END IF;

          -- Black (Premier) — فاخرة
          IF NOT EXISTS (
            SELECT 1 FROM hancr_service WHERE name_en = 'Black' AND region_id = r.id
          ) THEN
            INSERT INTO hancr_service
              (name,name_en,service_type,base_fare,per_hundred_meters,per_minute_drive,
               per_minute_wait,minimum_fee,provider_share_percent,prepay_percent,
               cancellation_total_fee,cancellation_driver_share,
               time_multipliers,weekday_multipliers,date_range_multipliers,
               search_radius,bid_mode_enabled,enabled,display_order,is_vip,region_id)
            VALUES
              ('بلاك','Black','RideSharing',15.0,1.2,0.6,0.25,30.0,15.0,0.0,10.0,5.0,
               '[]','[]','[]',5000,false,true,7,true,r.id);
          END IF;
        END LOOP;
      END $$;
    `);

    // تطبيع احترازي: أي عمود مضاعفات ليس مصفوفة → '[]' (يحصّن ضد بيانات أُنشئت
    // عبر لوحة الأدمن بقيمة كائن، وهو سبب خطأ "object is not iterable").
    await queryRunner.query(
      `UPDATE hancr_service SET time_multipliers='[]'::jsonb WHERE jsonb_typeof(time_multipliers) <> 'array'`,
    );
    await queryRunner.query(
      `UPDATE hancr_service SET weekday_multipliers='[]'::jsonb WHERE jsonb_typeof(weekday_multipliers) <> 'array'`,
    );
    await queryRunner.query(
      `UPDATE hancr_service SET date_range_multipliers='[]'::jsonb WHERE jsonb_typeof(date_range_multipliers) <> 'array'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM hancr_service WHERE name_en IN ('Share','Black')`,
    );
  }
}
