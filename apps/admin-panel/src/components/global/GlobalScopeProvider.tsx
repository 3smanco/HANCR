'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface GlobalScopeCtx {
  /** ISO-2 للدولة المختارة. null = كل الدول (عالمي). */
  countryIso: string | null;
  /** معرّف المدينة المختارة. null = كل مدن الدولة. */
  cityId: number | null;
  setCountry: (iso: string | null) => void;
  setCity: (id: number | null) => void;
}

const Ctx = createContext<GlobalScopeCtx>({
  countryIso: null,
  cityId: null,
  setCountry: () => {},
  setCity: () => {},
});

export const useGlobalScope = () => useContext(Ctx);

const K_COUNTRY = 'hancr_scope_country';
const K_CITY = 'hancr_scope_city';

/**
 * GlobalScopeProvider — الدولة/المدينة المختارة من الشريط العلوي.
 * تقرأها كل العروض لتصفية بياناتها (تتقاطع مع نطاق المشغّل في الخادم).
 */
export function GlobalScopeProvider({ children }: { children: ReactNode }) {
  const [countryIso, setCountryIso] = useState<string | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);

  useEffect(() => {
    const c = localStorage.getItem(K_COUNTRY);
    if (c) setCountryIso(c);
    const ct = localStorage.getItem(K_CITY);
    if (ct) setCityId(Number(ct));
  }, []);

  const setCountry = (iso: string | null) => {
    setCountryIso(iso);
    setCityId(null); // تغيير الدولة يصفّر المدينة
    try {
      if (iso) localStorage.setItem(K_COUNTRY, iso);
      else localStorage.removeItem(K_COUNTRY);
      localStorage.removeItem(K_CITY);
    } catch {
      /* ignore */
    }
  };

  const setCity = (id: number | null) => {
    setCityId(id);
    try {
      if (id != null) localStorage.setItem(K_CITY, String(id));
      else localStorage.removeItem(K_CITY);
    } catch {
      /* ignore */
    }
  };

  return (
    <Ctx.Provider value={{ countryIso, cityId, setCountry, setCity }}>
      {children}
    </Ctx.Provider>
  );
}
