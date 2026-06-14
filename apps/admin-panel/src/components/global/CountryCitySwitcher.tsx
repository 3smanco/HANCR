'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_COUNTRIES, LIST_CITIES } from '@/lib/gql';
import { useGlobalScope } from './GlobalScopeProvider';
import { CountryFlag } from '../ui/CountryFlag';

interface Country {
  id: number;
  iso2: string;
  name: string;
  nameEn: string;
  flag?: string | null;
  enabled: boolean;
  cityCount: number;
}
interface City {
  id: number;
  countryId: number;
  name: string;
  nameEn: string;
  enabled: boolean;
}

const rowCls =
  'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm cmd-text hover:cmd-ember-bg transition';

/**
 * الفلتر السحري — دولة → مدينة. يقود كل بيانات اللوحة (عبر useGlobalScope).
 */
export function CountryCitySwitcher() {
  const { countryIso, cityId, setCountry, setCity } = useGlobalScope();
  const [open, setOpen] = useState(false);

  const { data: cData } = useQuery<{ countries: Country[] }>(LIST_COUNTRIES);
  const countries = cData?.countries ?? [];
  const selectedCountry = countries.find((c) => c.iso2 === countryIso);

  const { data: cityData } = useQuery<{ cities: City[] }>(LIST_CITIES, {
    variables: { filter: { countryIso } },
    skip: !countryIso,
  });
  const cities = cityData?.cities ?? [];
  const selectedCity = cities.find((c) => c.id === cityId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border cmd-border cmd-surface-2 px-3 py-2 cmd-text text-sm"
      >
        {selectedCountry ? (
          <CountryFlag
            flag={selectedCountry.flag}
            name={
              selectedCity
                ? `${selectedCountry.nameEn} · ${selectedCity.nameEn}`
                : selectedCountry.nameEn
            }
          />
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>🌍</span>
            <span>Global</span>
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cmd-muted"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-50 mt-2 max-h-[70vh] w-72 overflow-auto rounded-xl border cmd-border cmd-surface p-2 shadow-2xl">
            <button
              className={rowCls}
              onClick={() => {
                setCountry(null);
                setOpen(false);
              }}
            >
              <span className="inline-flex items-center gap-2">🌍 Global — all countries</span>
              {!countryIso && <Check />}
            </button>
            <div className="my-1 border-t cmd-border" />
            {countries.map((c) => (
              <button key={c.id} className={rowCls} onClick={() => setCountry(c.iso2)}>
                <span className="inline-flex items-center gap-2">
                  <CountryFlag flag={c.flag} name={c.nameEn} />
                  {!c.enabled && (
                    <span className="rounded-full cmd-ember-bg cmd-ember px-1.5 py-0.5 text-[10px]">soon</span>
                  )}
                </span>
                {c.iso2 === countryIso ? <Check /> : (
                  <span className="cmd-muted text-xs">{c.cityCount}</span>
                )}
              </button>
            ))}

            {selectedCountry && cities.length > 0 && (
              <>
                <div className="my-1 border-t cmd-border" />
                <div className="px-2 py-1 text-xs cmd-muted">
                  Cities · {selectedCountry.nameEn}
                </div>
                <button
                  className={rowCls}
                  onClick={() => {
                    setCity(null);
                    setOpen(false);
                  }}
                >
                  <span>All cities</span>
                  {cityId == null && <Check />}
                </button>
                {cities.map((ct) => (
                  <button
                    key={ct.id}
                    className={rowCls}
                    onClick={() => {
                      setCity(ct.id);
                      setOpen(false);
                    }}
                  >
                    <span>{ct.nameEn}</span>
                    {ct.id === cityId && <Check />}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="cmd-ember"><path d="M20 6L9 17l-5-5" /></svg>
  );
}
