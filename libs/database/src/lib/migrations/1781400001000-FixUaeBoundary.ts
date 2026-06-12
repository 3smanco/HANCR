import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * تصحيح مضلّع حدود الإمارات — النسخة الأولى كانت مقعّرة فاستثنت دبي
 * (ST_Contains يُرجع NULL لنقاط دبي). هذا مضلّع محدّب يغطّي الإمارات السبع.
 * (تُحدَّث القواعد التي شغّلت 1781400000000 قبل تصحيح ملفها.)
 */
export class FixUaeBoundary1781400001000 implements MigrationInterface {
  name = 'FixUaeBoundary1781400001000';

  private static readonly UAE_RING: number[][] = [
    [51.5, 22.6], [56.0, 22.6], [56.5, 25.2], [56.0, 26.2],
    [54.0, 26.2], [51.5, 24.4], [51.5, 22.6],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const geojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [FixUaeBoundary1781400001000.UAE_RING],
    });
    await queryRunner.query(
      `UPDATE "hancr_region" SET "boundary" = $1::jsonb WHERE "name_en" = 'UAE'`,
      [geojson],
    );
  }

  public async down(): Promise<void> {
    // لا تراجع — حدّ بيانات تصحيحي.
  }
}
