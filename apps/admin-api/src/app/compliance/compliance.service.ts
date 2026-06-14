import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ComplianceStatus,
  DocComplianceItem,
  DocState,
  DriverComplianceType,
} from './dto/compliance.types';

const EXPIRING_DAYS = 30;
const DAY_MS = 86400000;

export interface SubmittedDoc {
  type: string;
  status: string; // pending | approved | rejected
  expiresAt?: Date | null;
}

/**
 * يقيّم امتثال وثائق سائق مقابل متطلّبات دولته. دالة نقيّة قابلة للاختبار.
 * لكل نوع مطلوب: يختار أفضل وثيقة (approved مُقدَّمة) ويصنّفها؛ ويُدرج
 * الوثائق الإضافية غير المطلوبة للعلم.
 */
export function evaluateDriverCompliance(
  requirements: string[],
  docs: SubmittedDoc[],
  now: Date,
  expiringDays = EXPIRING_DAYS,
): {
  status: ComplianceStatus;
  missing: string[];
  expired: string[];
  expiringSoon: string[];
  items: DocComplianceItem[];
} {
  const required = new Set(requirements);
  const byType = new Map<string, SubmittedDoc[]>();
  for (const d of docs) {
    const list = byType.get(d.type) ?? [];
    list.push(d);
    byType.set(d.type, list);
  }

  const items: DocComplianceItem[] = [];
  const missing: string[] = [];
  const expired: string[] = [];
  const expiringSoon: string[] = [];

  const classify = (d: SubmittedDoc): { state: DocState; days?: number } => {
    if (d.status === 'rejected') return { state: 'rejected' };
    if (d.status !== 'approved') return { state: 'pending' };
    if (!d.expiresAt) return { state: 'ok' };
    const days = Math.floor((new Date(d.expiresAt).getTime() - now.getTime()) / DAY_MS);
    if (days < 0) return { state: 'expired', days };
    if (days <= expiringDays) return { state: 'expiring', days };
    return { state: 'ok', days };
  };

  // ترتيب أفضلية الحالات (الأفضل أولاً) لاختيار الوثيقة المُمثِّلة للنوع.
  const rank: Record<DocState, number> = {
    ok: 0, expiring: 1, pending: 2, expired: 3, rejected: 4, missing: 5,
  };

  for (const type of requirements) {
    const candidates = byType.get(type) ?? [];
    if (candidates.length === 0) {
      missing.push(type);
      items.push({ type, state: 'missing', required: true });
      continue;
    }
    const evaluated = candidates
      .map((d) => ({ d, ...classify(d) }))
      .sort((a, b) => rank[a.state] - rank[b.state]);
    const best = evaluated[0];
    items.push({
      type,
      state: best.state,
      required: true,
      expiresAt: best.d.expiresAt ?? undefined,
      daysToExpiry: best.days,
    });
    if (best.state === 'missing' || best.state === 'rejected') {
      if (!missing.includes(type)) missing.push(type);
    } else if (best.state === 'expired') {
      expired.push(type);
    } else if (best.state === 'expiring') {
      expiringSoon.push(type);
    }
  }

  // وثائق إضافية غير مطلوبة (للعلم).
  for (const [type, list] of byType) {
    if (required.has(type)) continue;
    const best = list
      .map((d) => ({ d, ...classify(d) }))
      .sort((a, b) => rank[a.state] - rank[b.state])[0];
    items.push({
      type,
      state: best.state,
      required: false,
      expiresAt: best.d.expiresAt ?? undefined,
      daysToExpiry: best.days,
    });
  }

  let status: ComplianceStatus;
  if (missing.length > 0 || expired.length > 0) {
    status = 'non_compliant';
  } else if (items.some((i) => i.required && i.state === 'pending')) {
    status = 'pending';
  } else {
    status = 'compliant';
  }

  return { status, missing, expired, expiringSoon, items };
}

interface DriverRow {
  id: number;
  firstName: string | null;
  lastName: string | null;
  regionId: number | null;
  iso2: string | null;
  nameEn: string | null;
  docRequirements: string[] | null;
}

/** متطلّبات افتراضية إن لم تُضبَط للدولة. */
const DEFAULT_REQUIREMENTS = ['national_id', 'license', 'vehicle_registration'];

/**
 * ComplianceService — امتثال وثائق السائق المتكيّف لكل دولة. scope-aware.
 */
@Injectable()
export class ComplianceService {
  constructor(private readonly dataSource: DataSource) {}

  async driverCompliance(
    driverId: number,
    allowedRegionIds: number[] | null,
  ): Promise<DriverComplianceType> {
    const rows = await this.dataSource.query<DriverRow[]>(
      `SELECT d.id, d.first_name AS "firstName", d.last_name AS "lastName",
              d.region_id AS "regionId", c.iso2, c.name_en AS "nameEn",
              c.doc_requirements AS "docRequirements"
       FROM hancr_driver d
       LEFT JOIN hancr_region r ON r.id = d.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE d.id = $1`,
      [driverId],
    );
    const drv = rows[0];
    if (!drv) throw new NotFoundException(`Driver #${driverId} not found`);
    if (
      allowedRegionIds &&
      (drv.regionId == null || !allowedRegionIds.includes(drv.regionId))
    ) {
      throw new NotFoundException('هذا السائق خارج نطاقك');
    }

    const docs = await this.dataSource.query<SubmittedDoc[]>(
      `SELECT type, status, expires_at AS "expiresAt"
       FROM hancr_driver_document WHERE driver_id = $1`,
      [driverId],
    );

    const requirements =
      drv.docRequirements && drv.docRequirements.length > 0
        ? drv.docRequirements
        : DEFAULT_REQUIREMENTS;

    const result = evaluateDriverCompliance(requirements, docs, new Date());

    return {
      driverId: drv.id,
      driverName:
        [drv.firstName, drv.lastName].filter(Boolean).join(' ') ||
        `Driver #${drv.id}`,
      countryIso: drv.iso2 ?? undefined,
      countryName: drv.nameEn ?? undefined,
      ...result,
    };
  }
}
