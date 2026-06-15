'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { activeRegions, type RegionLookup } from '@/lib/riderAuth';
import type { Locale } from '@/i18n/messages';

export function CitiesLive({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';
  const [regions, setRegions] = useState<RegionLookup[] | null>(null);

  useEffect(() => {
    activeRegions()
      .then(setRegions)
      .catch(() => setRegions([]));
  }, []);

  if (regions === null) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-ash/40 border border-stone/60 rounded-2xl p-5 h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <p className="text-muted text-sm">
        {isAr
          ? 'لا توجد مدن مفعّلة حالياً. تابع صفحة المدن للتحديثات.'
          : 'No live cities right now. Check back soon.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {regions.map((r) => (
        <div
          key={r.id}
          className="bg-ash/60 border border-ember/40 rounded-2xl p-5 shadow-ember"
        >
          <MapPin className="w-7 h-7 mb-3 text-ember" />
          <h3 className="font-bold text-pearl text-base mb-1">{isAr ? r.name : r.nameEn}</h3>
          <p className="text-muted text-xs mb-3">{r.currency}</p>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/20 text-success">
            {isAr ? 'متاح الآن' : 'Live now'}
          </span>
        </div>
      ))}
    </div>
  );
}
