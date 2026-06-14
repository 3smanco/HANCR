'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { CalendarClock, Globe2, Clock, MapPin } from 'lucide-react';
import { CROSS_CITY_OPS } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

type Booking = {
  orderId: number;
  riderId?: number | null;
  countryIso?: string | null;
  countryName?: string | null;
  flag?: string | null;
  timezone?: string | null;
  pickupAt: string;
  minutesUntil: number;
  urgency: string;
  fare?: number | null;
  currency?: string | null;
};
type CountryGroup = {
  countryIso?: string | null;
  countryName?: string | null;
  flag?: string | null;
  timezone?: string | null;
  count: number;
};

const HORIZONS = [
  { days: 1, label: '24 ساعة' },
  { days: 7, label: '7 أيام' },
  { days: 14, label: '14 يوماً' },
  { days: 30, label: '30 يوماً' },
];

const URGENCY: Record<string, { label: string; cls: string }> = {
  imminent: { label: 'وشيك', cls: 'bg-red-100 text-red-700' },
  soon: { label: 'قريباً', cls: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'مجدول', cls: 'bg-gray-100 text-gray-600' },
};

/** الوقت المحلي للسوق المراقَب عبر توقيت الدولة/المنطقة. */
function localTime(iso: string, tz?: string | null): string {
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz || undefined,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString('ar');
  }
}

function untilLabel(min: number): string {
  if (min < 0) return `فات منذ ${Math.abs(min)} د`;
  if (min < 60) return `بعد ${min} د`;
  const h = Math.floor(min / 60);
  if (h < 24) return `بعد ${h} س ${min % 60} د`;
  return `بعد ${Math.floor(h / 24)} يوم`;
}

export default function CrossCityPage() {
  const [horizon, setHorizon] = useState(14);
  const { data, loading } = useQuery(CROSS_CITY_OPS, {
    variables: { horizonDays: horizon },
    pollInterval: 30000,
    fetchPolicy: 'cache-and-network',
  });
  const ops = data?.crossCityOps;
  const bookings: Booking[] = ops?.bookings ?? [];

  return (
    <div>
      <Topbar
        title="العمليات عبر-المدن"
        subtitle="الحجوزات المسبقة القادمة عبر الأسواق — بالتوقيت المحلي لكل دولة"
      />

      <div className="p-6 space-y-5">
        {/* Horizon selector + totals */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 rounded-xl border border-gray-200 p-1">
            {HORIZONS.map((h) => (
              <button
                key={h.days}
                onClick={() => setHorizon(h.days)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                  horizon === h.days
                    ? 'bg-hancr-violet text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          {ops && (
            <div className="mr-auto flex gap-2 text-sm">
              <span className="px-3 py-1.5 rounded-xl bg-hancr-violet/10 text-hancr-violet font-bold inline-flex items-center gap-1">
                <CalendarClock className="w-4 h-4" /> {ops.total} حجز
              </span>
              {ops.imminentCount > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold">
                  {ops.imminentCount} وشيك
                </span>
              )}
            </div>
          )}
        </div>

        {/* Per-country strip */}
        {ops && ops.byCountry.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(ops.byCountry as CountryGroup[]).map((c, i) => (
              <div
                key={c.countryIso ?? i}
                className="card p-3 flex items-center gap-3"
              >
                <div className="text-2xl shrink-0">{c.flag ?? '🏳️'}</div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    {c.countryName ?? 'غير محدَّد'}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    {c.count} حجز
                    {c.timezone ? ` · ${c.timezone}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bookings table */}
        <div className="card overflow-hidden">
          {loading && bookings.length === 0 ? (
            <div className="p-10 text-center text-gray-400">جارٍ التحميل…</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد حجوزات مسبقة في هذه الفترة</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الدولة</th>
                  <th>الالتقاط (محلي)</th>
                  <th>المتبقّي</th>
                  <th>الأجرة</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const u = URGENCY[b.urgency] ?? URGENCY.scheduled;
                  return (
                    <tr key={b.orderId}>
                      <td className="font-mono text-xs text-gray-500">
                        #{b.orderId}
                      </td>
                      <td className="font-bold whitespace-nowrap">
                        {b.flag ? `${b.flag} ` : ''}
                        {b.countryName ?? '—'}
                      </td>
                      <td className="text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {localTime(b.pickupAt, b.timezone)}
                        </span>
                      </td>
                      <td className="text-xs text-gray-600">
                        {untilLabel(b.minutesUntil)}
                      </td>
                      <td className="font-bold">
                        {b.fare != null
                          ? `${Number(b.fare).toFixed(2)} ${b.currency ?? ''}`
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.cls}`}
                        >
                          {u.label}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/orders/${b.orderId}`}
                          className="text-hancr-violet text-xs font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          فتح
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
