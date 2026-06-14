'use client';

import Link from 'next/link';
import { Maximize2 } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GLOBAL_LIVE_OVERVIEW } from '@/lib/gql';
import { useGlobalScope } from './GlobalScopeProvider';
import { CountryFlag } from '../ui/CountryFlag';
import { TimeZoneClock } from '../ui/TimeZoneClock';

interface CountryStat {
  countryId: number;
  iso2: string;
  name: string;
  nameEn: string;
  flag?: string | null;
  currency: string;
  timezone: string;
  onlineDrivers: number;
  activeOrders: number;
}
interface Overview {
  totalOnlineDrivers: number;
  totalActiveOrders: number;
  activeCountries: number;
  countries: CountryStat[];
}

/**
 * العرض الكلّي العالمي (Geo-Radar) — عمليات حيّة لكل دولة في شاشة واحدة.
 * النقر على دولة يقود فلتر الشريط العلوي إليها (تنقّل من العالم إلى السوق).
 */
export function GlobalMacroView() {
  const { countryIso, setCountry } = useGlobalScope();
  const { data, loading } = useQuery<{ globalLiveOverview: Overview }>(
    GLOBAL_LIVE_OVERVIEW,
    { pollInterval: 15000, fetchPolicy: 'cache-and-network' },
  );
  const ov = data?.globalLiveOverview;

  return (
    <div className="cmd-text">
      {/* شريط الإجماليات */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="دول نشطة" value={ov?.activeCountries ?? 0} />
        <Stat label="سائقون متصلون" value={ov?.totalOnlineDrivers ?? 0} />
        <Stat label="طلبات جارية" value={ov?.totalActiveOrders ?? 0} />
      </div>

      {/* بطاقات الدول */}
      {loading && !ov ? (
        <p className="cmd-muted text-sm">جارٍ التحميل…</p>
      ) : ov && ov.countries.length === 0 ? (
        <p className="cmd-muted text-sm">لا دول مُفعَّلة ضمن نطاقك.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ov?.countries.map((c) => {
            const selected = c.iso2 === countryIso;
            return (
              <button
                key={c.countryId}
                onClick={() => setCountry(selected ? null : c.iso2)}
                className={`rounded-xl border p-4 text-start transition ${
                  selected ? 'cmd-ember-bg border-[var(--cmd-ember)]' : 'cmd-surface cmd-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CountryFlag flag={c.flag} name={c.nameEn} size={22} />
                  <span className="flex items-center gap-2">
                    <TimeZoneClock timezone={c.timezone} />
                    <Link
                      href={`/live?country=${c.iso2}`}
                      onClick={(e) => e.stopPropagation()}
                      title={`بثّ مباشر مسطّح — ${c.nameEn}`}
                      className="rounded-lg border cmd-border p-1.5 hover:cmd-ember-bg transition"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Link>
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <Metric
                    label="سائقون"
                    value={c.onlineDrivers}
                    dot="#10B981"
                  />
                  <Metric label="طلبات" value={c.activeOrders} dot="#FF7A1A" />
                  <span className="ms-auto cmd-muted text-xs">{c.currency}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border cmd-border cmd-surface p-4">
      <p className="cmd-muted text-xs">{label}</p>
      <p className="mt-1 text-2xl font-extrabold cmd-text tabular-nums">{value}</p>
    </div>
  );
}

function Metric({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span className="cmd-text text-sm font-bold tabular-nums">{value}</span>
      <span className="cmd-muted text-xs">{label}</span>
    </span>
  );
}
