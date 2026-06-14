'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GLOBAL_REVENUE_MATRIX } from '@/lib/gql';
import { CountryFlag } from '../ui/CountryFlag';
import { CurrencyAmount } from '../ui/CurrencyAmount';

interface CountryRevenue {
  countryId: number;
  iso2: string;
  nameEn: string;
  flag?: string | null;
  currency: string;
  orders: number;
  revenueNative: number;
  revenueBase: number;
  platformBase: number;
  growthPct: number;
}
interface Matrix {
  baseCurrency: string;
  totalRevenueBase: number;
  totalPlatformBase: number;
  periodDays: number;
  fxSource: string;
  fxLastSync?: string | null;
  countries: CountryRevenue[];
}

const PERIODS = [7, 30, 90];

/**
 * مصفوفة الأرباح متعددة العملات — أرباح كل دولة بعملة موحّدة (أو محلية)،
 * مع نموّ السوق ومصدر أسعار الصرف.
 */
export function GlobalRevenueMatrix() {
  const [days, setDays] = useState(30);
  const [native, setNative] = useState(false);
  const { data, loading } = useQuery<{ globalRevenueMatrix: Matrix }>(
    GLOBAL_REVENUE_MATRIX,
    { variables: { days }, fetchPolicy: 'cache-and-network' },
  );
  const m = data?.globalRevenueMatrix;

  return (
    <div className="cmd-text">
      {/* أدوات */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border cmd-border cmd-surface-2 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                days === p ? 'cmd-ember-bg cmd-ember' : 'cmd-muted'
              }`}
            >
              {p}ي
            </button>
          ))}
        </div>
        <button
          onClick={() => setNative((v) => !v)}
          className="rounded-lg border cmd-border cmd-surface-2 px-3 py-1.5 text-xs font-bold cmd-muted"
        >
          {native ? 'العملة المحلية' : `موحّد (${m?.baseCurrency ?? 'USD'})`}
        </button>
        <span className="ms-auto cmd-muted text-xs">
          صرف: {m?.fxSource === 'live' ? 'حيّ' : 'احتياطي'}
          {m?.fxLastSync ? ` · ${new Date(m.fxLastSync).toLocaleDateString()}` : ''}
        </span>
      </div>

      {/* إجماليات */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tot
          label={`إجمالي الأرباح (${m?.baseCurrency ?? 'USD'})`}
          node={<CurrencyAmount amount={m?.totalRevenueBase ?? 0} currency={m?.baseCurrency ?? 'USD'} />}
        />
        <Tot
          label="حصة المنصّة"
          node={<CurrencyAmount amount={m?.totalPlatformBase ?? 0} currency={m?.baseCurrency ?? 'USD'} />}
        />
        <Tot label="أسواق" node={<span>{m?.countries.length ?? 0}</span>} />
      </div>

      {/* جدول الدول */}
      {loading && !m ? (
        <p className="cmd-muted text-sm">جارٍ التحميل…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border cmd-border">
          <table className="w-full text-sm">
            <thead className="cmd-surface-2 cmd-muted">
              <tr className="text-start">
                <th className="px-4 py-2 text-start font-medium">الدولة</th>
                <th className="px-4 py-2 text-end font-medium">طلبات</th>
                <th className="px-4 py-2 text-end font-medium">الأرباح</th>
                <th className="px-4 py-2 text-end font-medium">النمو</th>
              </tr>
            </thead>
            <tbody>
              {m?.countries.map((c) => (
                <tr key={c.countryId} className="border-t cmd-border">
                  <td className="px-4 py-2.5">
                    <CountryFlag flag={c.flag} name={c.nameEn} />
                  </td>
                  <td className="px-4 py-2.5 text-end tabular-nums">{c.orders}</td>
                  <td className="px-4 py-2.5 text-end font-bold">
                    <CurrencyAmount
                      amount={native ? c.revenueNative : c.revenueBase}
                      currency={native ? c.currency : (m.baseCurrency)}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <Growth pct={c.growthPct} />
                  </td>
                </tr>
              ))}
              {m && m.countries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 cmd-muted">
                    لا بيانات في هذه الفترة ضمن نطاقك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Tot({ label, node }: { label: string; node: React.ReactNode }) {
  return (
    <div className="rounded-xl border cmd-border cmd-surface p-3">
      <p className="cmd-muted text-xs">{label}</p>
      <p className="mt-1 text-lg font-extrabold cmd-text">{node}</p>
    </div>
  );
}

function Growth({ pct }: { pct: number }) {
  if (!pct) return <span className="cmd-muted text-xs">—</span>;
  const up = pct > 0;
  return (
    <span
      className="text-xs font-bold tabular-nums"
      style={{ color: up ? '#10B981' : '#FF4D4D' }}
    >
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}
