import { ValueTransformer } from 'typeorm';
import { GeoPoint } from '../interfaces/point.interface';

/**
 * Transformer لتحويل مصفوفة نقاط المسار
 * بين JSONB (قاعدة البيانات) و GeoPoint[] (TypeScript)
 */
export class GeoPointsTransformer implements ValueTransformer {
  /** من TypeScript → قاعدة البيانات */
  to(value: GeoPoint[] | undefined): string | null {
    if (!value || value.length === 0) return null;
    return JSON.stringify(value);
  }

  /** من قاعدة البيانات → TypeScript */
  from(value: string | null): GeoPoint[] {
    if (!value) return [];
    try {
      return JSON.parse(value) as GeoPoint[];
    } catch {
      return [];
    }
  }
}

/**
 * Transformer لنقطة واحدة
 */
export class GeoPointTransformer implements ValueTransformer {
  to(value: GeoPoint | undefined): string | null {
    if (!value) return null;
    return JSON.stringify(value);
  }

  from(value: string | null): GeoPoint | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as GeoPoint;
    } catch {
      return null;
    }
  }
}
