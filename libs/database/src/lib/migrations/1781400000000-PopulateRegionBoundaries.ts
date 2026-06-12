import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * يملأ حدود المناطق (hancr_region.boundary) بمضلّعات GeoJSON للدول الثلاث،
 * ليُشتقّ معرّف المنطقة من نقطة الالتقاط عبر PostGIS ST_Contains (بدل bbox مبرمج).
 *
 * المضلّعات مبسّطة لكنها كافية لتوجيه المناطق (الدول الثلاث متباعدة)؛ التداخل
 * (قطر/الإمارات داخل امتداد السعودية) يُحلّ باختيار الأصغر مساحةً (ST_Area ASC).
 * يمكن تنقيحها لاحقاً بتحديث الصف فقط — دون تغيير الكود.
 *
 * المطابقة بـ name_en (لا id) لمتانة أكبر.
 */
export class PopulateRegionBoundaries1781400000000
  implements MigrationInterface
{
  name = 'PopulateRegionBoundaries1781400000000';

  private static readonly POLYGONS: Record<string, number[][]> = {
    // قطر — شبه جزيرة
    Qatar: [
      [50.75, 24.55], [51.05, 24.55], [51.4, 24.7], [51.61, 25.0],
      [51.64, 25.9], [51.27, 26.15], [51.0, 26.0], [50.8, 25.2],
      [50.75, 24.85], [50.75, 24.55],
    ],
    // الإمارات — مضلّع محدّب يغطّي الإمارات السبع (يشمل دبي/أبوظبي/الشارقة/رأس الخيمة/الفجيرة)
    UAE: [
      [51.5, 22.6], [56.0, 22.6], [56.5, 25.2], [56.0, 26.2],
      [54.0, 26.2], [51.5, 24.4], [51.5, 22.6],
    ],
    // السعودية — مخطّط تقريبي للمملكة
    'Saudi Arabia': [
      [34.5, 29.4], [36.0, 29.4], [37.5, 31.0], [39.2, 32.2], [42.0, 31.2],
      [44.7, 29.2], [46.5, 29.1], [47.7, 28.5], [48.5, 28.5], [49.0, 27.3],
      [50.8, 24.7], [51.6, 24.1], [52.0, 19.5], [55.7, 19.5], [55.7, 17.5],
      [52.0, 16.0], [47.0, 16.9], [43.0, 16.4], [41.5, 17.8], [39.5, 20.5],
      [38.0, 23.5], [36.0, 26.5], [34.5, 28.0], [34.5, 29.4],
    ],
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [nameEn, ring] of Object.entries(
      PopulateRegionBoundaries1781400000000.POLYGONS,
    )) {
      const geojson = JSON.stringify({
        type: 'Polygon',
        coordinates: [ring],
      });
      await queryRunner.query(
        `UPDATE "hancr_region" SET "boundary" = $1::jsonb WHERE "name_en" = $2`,
        [geojson, nameEn],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "hancr_region" SET "boundary" = NULL
       WHERE "name_en" IN ('Qatar', 'UAE', 'Saudi Arabia')`,
    );
  }
}
