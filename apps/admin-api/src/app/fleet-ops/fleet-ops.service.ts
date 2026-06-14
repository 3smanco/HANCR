import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DocExpiryAlert,
  ExpirySeverity,
  FleetDocAlerts,
} from './dto/fleet-ops.types';

const DAY_MS = 86400000;
const CRITICAL_DAYS = 7;

/**
 * يصنّف خطورة قرب الانتهاء من عدد الأيام المتبقية. دالة نقيّة قابلة للاختبار.
 */
export function classifyExpiry(daysToExpiry: number): ExpirySeverity {
  if (daysToExpiry < 0) return 'expired';
  if (daysToExpiry <= CRITICAL_DAYS) return 'critical';
  return 'soon';
}

interface AlertRow {
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  regionId: number | null;
  iso2: string | null;
  nameEn: string | null;
  docType: string;
  expiresAt: Date;
}

/**
 * FleetOpsService — لوحة تنبيهات انتهاء وثائق الأسطول الإقليمية (Phase 7).
 * scope-aware: المشغّل المُنطقَن يرى سائقي نطاقه فقط.
 */
@Injectable()
export class FleetOpsService {
  constructor(private readonly dataSource: DataSource) {}

  async documentExpiryAlerts(
    withinDays: number,
    allowedRegionIds: number[] | null,
  ): Promise<FleetDocAlerts> {
    const days = Math.max(1, Math.min(Math.floor(withinDays) || 30, 365));
    const params: unknown[] = [days];
    let scopeClause = '';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $2
      scopeClause = 'AND d.region_id = ANY($2)';
    }

    // وثائق approved لها تاريخ انتهاء، إمّا منتهية أو ضمن النافذة.
    const rows = await this.dataSource.query<AlertRow[]>(
      `SELECT d.id AS "driverId", d.first_name AS "firstName",
              d.last_name AS "lastName", d.region_id AS "regionId",
              c.iso2, c.name_en AS "nameEn",
              doc.type AS "docType", doc.expires_at AS "expiresAt"
       FROM hancr_driver_document doc
       JOIN hancr_driver d ON d.id = doc.driver_id
       LEFT JOIN hancr_region r ON r.id = d.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE doc.status = 'approved'
         AND doc.expires_at IS NOT NULL
         AND doc.expires_at < (NOW() + (($1::text) || ' days')::interval)
         AND d.banned = false
         ${scopeClause}
       ORDER BY doc.expires_at ASC`,
      params,
    );

    const now = Date.now();
    const alerts: DocExpiryAlert[] = rows.map((r) => {
      const daysToExpiry = Math.floor(
        (new Date(r.expiresAt).getTime() - now) / DAY_MS,
      );
      return {
        driverId: r.driverId,
        driverName:
          [r.firstName, r.lastName].filter(Boolean).join(' ') ||
          `Driver #${r.driverId}`,
        countryIso: r.iso2 ?? undefined,
        countryName: r.nameEn ?? undefined,
        regionId: r.regionId ?? undefined,
        docType: r.docType,
        expiresAt: r.expiresAt,
        daysToExpiry,
        severity: classifyExpiry(daysToExpiry),
      };
    });

    return {
      alerts,
      withinDays: days,
      expiredCount: alerts.filter((a) => a.severity === 'expired').length,
      criticalCount: alerts.filter((a) => a.severity === 'critical').length,
      soonCount: alerts.filter((a) => a.severity === 'soon').length,
    };
  }
}
