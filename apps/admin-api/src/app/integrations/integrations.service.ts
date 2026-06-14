import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  IntegrationCell,
  IntegrationChannel,
  IntegrationCountryRow,
  IntegrationMatrix,
  ProviderRoute,
  ProviderStatus,
} from './dto/integration.types';

interface ProviderRule {
  provider: string;
  envKey: string;
}

/**
 * موجّه المزوّدين — يختار المزوّد الموصى به لكل قناة حسب الدولة. دالة نقيّة.
 * مبني على واقع السوق: الخليج يفضّل Checkout.com/Unifonic، الغرب Stripe/Twilio.
 */
export function recommendProvider(
  channel: IntegrationChannel,
  iso2: string,
): ProviderRule {
  const gcc = ['QA', 'SA', 'AE', 'KW', 'BH', 'OM'];
  const isGcc = gcc.includes(iso2);
  if (channel === 'payment') {
    return isGcc
      ? { provider: 'Checkout.com', envKey: 'CHECKOUT_SECRET_KEY' }
      : { provider: 'Stripe', envKey: 'STRIPE_SECRET_KEY' };
  }
  if (channel === 'sms') {
    return isGcc
      ? { provider: 'Unifonic', envKey: 'UNIFONIC_API_KEY' }
      : { provider: 'Twilio', envKey: 'TWILIO_AUTH_TOKEN' };
  }
  // maps — مفتاح أندرويد موحَّد عبر الأسواق حالياً.
  return { provider: 'Google Maps', envKey: 'MAPS_API_KEY' };
}

/**
 * حالة المزوّد من وجود متغيّر البيئة (لا يكشف القيمة). دالة نقيّة.
 */
export function providerStatus(
  envKey: string,
  env: Record<string, string | undefined>,
): ProviderStatus {
  const v = env[envKey];
  return v && v.trim().length > 0 ? 'live' : 'pending';
}

/**
 * يحلّ قرار توجيه قناة لدولة إلى {مزوّد، مفتاح، حالة، جاهز}. دالة نقيّة قابلة
 * للاختبار — الطبقة التي يستدعيها كود الدفع/الرسائل ليختار المزوّد ويتحقّق من
 * جاهزيته قبل التنفيذ الفعلي.
 */
export function routeFor(
  channel: IntegrationChannel,
  iso2: string,
  env: Record<string, string | undefined>,
): { provider: string; envKey: string; status: ProviderStatus; ready: boolean } {
  const rule = recommendProvider(channel, iso2);
  const status = providerStatus(rule.envKey, env);
  return {
    provider: rule.provider,
    envKey: rule.envKey,
    status,
    ready: status === 'live',
  };
}

const CHANNELS: IntegrationChannel[] = ['payment', 'sms', 'maps'];

interface CountryRow {
  iso2: string;
  nameEn: string;
  flag: string | null;
  enabled: boolean;
}

/**
 * IntegrationsService — مصفوفة جاهزية التكامل (Phase 10، الجزء غير المحجوب).
 * طبقة تجريد: تُظهر المزوّد الموصى به وحالته لكل دولة دون كشف أي مفاتيح.
 */
@Injectable()
export class IntegrationsService {
  constructor(private readonly dataSource: DataSource) {}

  async matrix(allowedRegionIds: number[] | null): Promise<IntegrationMatrix> {
    // المُنطقَن يرى دوله فقط (الدول التي تضمّ مناطقه المسموح بها).
    const params: unknown[] = [];
    let whereClause = 'c.enabled = true';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $1
      whereClause =
        'c.enabled = true AND c.id IN (SELECT country_id FROM hancr_region WHERE id = ANY($1) AND country_id IS NOT NULL)';
    }

    const rows = await this.dataSource.query<CountryRow[]>(
      `SELECT c.iso2, c.name_en AS "nameEn", c.flag, c.enabled
       FROM hancr_country c
       WHERE ${whereClause}
       ORDER BY c.name_en ASC`,
      params,
    );

    let liveCount = 0;
    let pendingCount = 0;
    const countries: IntegrationCountryRow[] = rows.map((r) => {
      const cells: IntegrationCell[] = CHANNELS.map((channel) => {
        const rule = recommendProvider(channel, r.iso2);
        const status = providerStatus(rule.envKey, process.env);
        if (status === 'live') liveCount++;
        else pendingCount++;
        return {
          channel,
          provider: rule.provider,
          status,
          envKey: rule.envKey,
        };
      });
      return {
        countryIso: r.iso2,
        countryName: r.nameEn,
        flag: r.flag ?? undefined,
        enabled: r.enabled,
        cells,
      };
    });

    return { countries, liveCount, pendingCount };
  }

  /**
   * يحلّ قرار توجيه قناة (دفع/رسالة) لمنطقة طلب فعلية: المنطقة→الدولة→المزوّد
   * وحالته. يُمكِّن أنظمة الدفع/الرسائل من اختيار المزوّد الصحيح حسب السوق.
   */
  async routeForRegion(
    regionId: number,
    channel: IntegrationChannel,
  ): Promise<ProviderRoute> {
    const rows = await this.dataSource.query<Array<{ iso2: string | null }>>(
      `SELECT c.iso2 FROM hancr_region r
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE r.id = $1`,
      [regionId],
    );
    const iso2 = rows[0]?.iso2 ?? '';
    const r = routeFor(channel, iso2, process.env);
    return {
      channel,
      regionId,
      countryIso: iso2 || undefined,
      provider: r.provider,
      envKey: r.envKey,
      status: r.status,
      ready: r.ready,
    };
  }
}
