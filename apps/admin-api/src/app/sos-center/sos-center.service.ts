import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  GlobalSosCenter,
  SosCenterIncident,
  SosCountryGroup,
  SosPriority,
} from './dto/sos-center.types';

const DAY = 1440;

export interface TriageInput {
  ageMinutes: number;
  policeNotified: boolean;
  hasLiveLocation: boolean;
  status: string;
}

/**
 * يحتسب أولوية حادثة SOS. دالة نقيّة قابلة للاختبار.
 * - critical: نشطة وحديثة (≤15د) بلا إبلاغ شرطة، أو بلا موقع حيّ (تعذّر التتبّع).
 * - high: نشطة لكن أقدم أو أُبلغت الشرطة (جارية المعالجة).
 * - normal: مُصعَّدة/غير نشطة.
 */
export function triageIncident(i: TriageInput): SosPriority {
  if (i.status !== 'Active') return 'normal';
  if (!i.hasLiveLocation) return 'critical'; // فقدنا تتبّعه = أخطر
  if (i.ageMinutes <= 15 && !i.policeNotified) return 'critical';
  return 'high';
}

interface IncidentRow {
  id: number;
  triggeredBy: string;
  triggeredById: number;
  orderId: number | null;
  status: string;
  lat: number | null;
  lng: number | null;
  lastLat: number | null;
  lastLocationAt: Date | null;
  policeNotified: boolean;
  contactsNotified: number;
  createdAt: Date;
  regionId: number | null;
  iso2: string | null;
  nameEn: string | null;
  flag: string | null;
  emergencyNumber: string | null;
}

/**
 * SosCenterService — مركز SOS العالمي. scope-aware عبر منطقة الطلب المرتبط.
 */
@Injectable()
export class SosCenterService {
  constructor(private readonly dataSource: DataSource) {}

  async globalSosCenter(
    allowedRegionIds: number[] | null,
  ): Promise<GlobalSosCenter> {
    // المُنطقَن يرى حوادث طلباته داخل نطاقه فقط؛ الحوادث بلا طلب لا منطقة لها.
    const params: unknown[] = [];
    let scopeClause = '';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $1
      scopeClause = 'AND o.region_id = ANY($1)';
    }

    const rows = await this.dataSource.query<IncidentRow[]>(
      `SELECT s.id, s.triggered_by AS "triggeredBy",
              s.triggered_by_id AS "triggeredById", s.order_id AS "orderId",
              s.status, s.latitude AS "lat", s.longitude AS "lng",
              s.last_latitude AS "lastLat", s.last_location_at AS "lastLocationAt",
              s.police_notified AS "policeNotified",
              s.contacts_notified AS "contactsNotified", s.created_at AS "createdAt",
              o.region_id AS "regionId", c.iso2, c.name_en AS "nameEn", c.flag,
              c.emergency_number AS "emergencyNumber"
       FROM hancr_sos_incident s
       LEFT JOIN hancr_order o ON o.id = s.order_id
       LEFT JOIN hancr_region r ON r.id = o.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE s.status = 'Active' ${scopeClause}
       ORDER BY s.created_at DESC`,
      params,
    );

    const now = Date.now();
    const incidents: SosCenterIncident[] = rows.map((r) => {
      const ageMinutes = Math.floor(
        (now - new Date(r.createdAt).getTime()) / 60000,
      );
      const hasLiveLocation =
        r.lastLat != null &&
        r.lastLocationAt != null &&
        (now - new Date(r.lastLocationAt).getTime()) / 60000 <= DAY;
      const priority = triageIncident({
        ageMinutes,
        policeNotified: r.policeNotified,
        hasLiveLocation,
        status: r.status,
      });
      return {
        id: r.id,
        triggeredBy: r.triggeredBy,
        triggeredById: r.triggeredById,
        orderId: r.orderId ?? undefined,
        status: r.status,
        lat: r.lat ?? undefined,
        lng: r.lng ?? undefined,
        policeNotified: r.policeNotified,
        contactsNotified: Number(r.contactsNotified),
        createdAt: r.createdAt,
        ageMinutes,
        hasLiveLocation,
        priority,
        regionId: r.regionId ?? undefined,
        countryIso: r.iso2 ?? undefined,
        countryName: r.nameEn ?? undefined,
        flag: r.flag ?? undefined,
        emergencyNumber: r.emergencyNumber ?? undefined,
      };
    });

    // ترتيب بالأولوية ثم الأحدث.
    const order: Record<string, number> = { critical: 0, high: 1, normal: 2 };
    incidents.sort(
      (a, b) =>
        order[a.priority] - order[b.priority] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // تجميع لكل دولة.
    const groups = new Map<string, SosCountryGroup>();
    for (const i of incidents) {
      const key = i.countryIso ?? '—';
      const g =
        groups.get(key) ??
        ({
          countryIso: i.countryIso,
          countryName: i.countryName,
          flag: i.flag,
          emergencyNumber: i.emergencyNumber,
          activeCount: 0,
        } as SosCountryGroup);
      g.activeCount += 1;
      groups.set(key, g);
    }

    return {
      incidents,
      byCountry: Array.from(groups.values()).sort(
        (a, b) => b.activeCount - a.activeCount,
      ),
      totalActive: incidents.length,
      criticalCount: incidents.filter((i) => i.priority === 'critical').length,
    };
  }
}
