import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  BookingUrgency,
  CrossCityCountryGroup,
  CrossCityOps,
  UpcomingBooking,
} from './dto/cross-city.types';

const IMMINENT_MIN = 120; // أقل من ساعتين
const SOON_MIN = 1440; // أقل من 24 ساعة

/**
 * يحتسب إلحاح حجز مسبق من الدقائق المتبقية حتى الالتقاط. دالة نقيّة قابلة للاختبار.
 */
export function bookingUrgency(minutesUntil: number): BookingUrgency {
  if (minutesUntil <= IMMINENT_MIN) return 'imminent';
  if (minutesUntil <= SOON_MIN) return 'soon';
  return 'scheduled';
}

interface BookingRow {
  orderId: number;
  riderId: number | null;
  regionId: number;
  iso2: string | null;
  nameEn: string | null;
  flag: string | null;
  regionTz: string | null;
  countryTz: string | null;
  pickupAt: Date;
  fare: string | null;
  currency: string | null;
}

/**
 * CrossCityService — مركز العمليات عبر-المدن (حجوزات مسبقة قادمة). scope-aware.
 */
@Injectable()
export class CrossCityService {
  constructor(private readonly dataSource: DataSource) {}

  async upcomingBookings(
    allowedRegionIds: number[] | null,
    horizonDays = 14,
  ): Promise<CrossCityOps> {
    const days = Math.max(1, Math.min(Math.floor(horizonDays) || 14, 90));
    const params: unknown[] = [days];
    let scopeClause = '';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $2
      scopeClause = 'AND o.region_id = ANY($2)';
    }

    const rows = await this.dataSource.query<BookingRow[]>(
      `SELECT o.id AS "orderId", o.rider_id AS "riderId", o.region_id AS "regionId",
              c.iso2, c.name_en AS "nameEn", c.flag,
              r.timezone AS "regionTz", c.timezone AS "countryTz",
              o.expected_timestamp AS "pickupAt",
              o.cost_best AS "fare", o.currency
       FROM hancr_order o
       JOIN hancr_region r ON r.id = o.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE o.status = 'Booked'
         AND o.expected_timestamp IS NOT NULL
         AND o.expected_timestamp >= NOW() - INTERVAL '1 hour'
         AND o.expected_timestamp <= NOW() + (($1::text) || ' days')::interval
         ${scopeClause}
       ORDER BY o.expected_timestamp ASC`,
      params,
    );

    const now = Date.now();
    const bookings: UpcomingBooking[] = rows.map((r) => {
      const minutesUntil = Math.round(
        (new Date(r.pickupAt).getTime() - now) / 60000,
      );
      return {
        orderId: r.orderId,
        riderId: r.riderId ?? undefined,
        regionId: r.regionId,
        countryIso: r.iso2 ?? undefined,
        countryName: r.nameEn ?? undefined,
        flag: r.flag ?? undefined,
        timezone: r.regionTz ?? r.countryTz ?? undefined,
        pickupAt: r.pickupAt,
        minutesUntil,
        urgency: bookingUrgency(minutesUntil),
        fare: r.fare != null ? Number(r.fare) : undefined,
        currency: r.currency ?? undefined,
      };
    });

    // تجميع لكل دولة.
    const groups = new Map<string, CrossCityCountryGroup>();
    for (const b of bookings) {
      const key = b.countryIso ?? '—';
      const g =
        groups.get(key) ??
        ({
          countryIso: b.countryIso,
          countryName: b.countryName,
          flag: b.flag,
          timezone: b.timezone,
          count: 0,
        } as CrossCityCountryGroup);
      g.count += 1;
      groups.set(key, g);
    }

    return {
      bookings,
      byCountry: Array.from(groups.values()).sort((a, b) => b.count - a.count),
      total: bookings.length,
      imminentCount: bookings.filter((b) => b.urgency === 'imminent').length,
    };
  }
}
