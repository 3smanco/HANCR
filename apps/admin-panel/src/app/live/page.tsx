'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import type { FC, ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import {
  GoogleMap as GoogleMapComponent,
  MarkerF,
  useJsApiLoader,
  type GoogleMapProps,
} from '@react-google-maps/api';
import {
  Car,
  Activity,
  CheckCircle2,
  Search,
  Phone,
  ExternalLink,
  X,
  Plus,
  Loader2,
  Maximize2,
  Minimize2,
  Globe2,
} from 'lucide-react';
import { useLazyQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  ADMIN_CREATE_MANUAL_ORDER,
  ADMIN_RIDER_LOOKUP,
  LIVE_DRIVERS,
  LIST_COUNTRIES,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

// @react-google-maps/api 2.20.8 يصدّر GoogleMap كـ class component مبني على نسخة
// أحدث من @types/react، فيفشل فحص JSX تحت @types/react 18.3.x. نحوّله إلى FC
// (مع الحفاظ على props و children) — السلوك وقت التشغيل لا يتغيّر.
const GoogleMap = GoogleMapComponent as unknown as FC<
  GoogleMapProps & { children?: ReactNode }
>;

type Driver = Record<string, unknown>;

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }; // Riyadh

// Public Google Maps key — same one used by the apps
const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type Country = {
  iso2: string;
  nameEn: string;
  name: string;
  flag?: string | null;
};

export default function LiveMapPage() {
  return (
    <Suspense fallback={null}>
      <LiveMapInner />
    </Suspense>
  );
}

function LiveMapInner() {
  const searchParams = useSearchParams();
  const initialCountry = (searchParams.get('country') ?? '').toUpperCase();
  const [country, setCountry] = useState<string>(initialCountry); // '' = كل الدول
  const [selected, setSelected] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');
  const [dispatcherOpen, setDispatcherOpen] = useState(false);
  // قادم من بطاقة Geo-Radar (?country=XX) → افتح البثّ المسطّح بملء الشاشة فوراً
  const [fullscreen, setFullscreen] = useState(!!initialCountry);

  const { data, loading } = useQuery(LIVE_DRIVERS, {
    variables: { countryIso: country || null },
    pollInterval: 5000, // refresh every 5s
    fetchPolicy: 'network-only',
  });
  const { data: countriesData } = useQuery(LIST_COUNTRIES, {
    variables: { onlyEnabled: true },
  });
  const countries: Country[] = countriesData?.countries ?? [];

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    id: 'hancr-admin-live',
  });

  const all: Driver[] = data?.liveDrivers?.drivers ?? [];
  const total = data?.liveDrivers?.total ?? 0;
  const idle = data?.liveDrivers?.idle ?? 0;
  const inRide = data?.liveDrivers?.inRide ?? 0;

  const drivers = search
    ? all.filter((d) => {
        const q = search.toLowerCase();
        return (
          (d.driverName as string)?.toLowerCase().includes(q) ||
          (d.driverPhone as string)?.includes(q) ||
          (d.plateNumber as string)?.toLowerCase().includes(q) ||
          String(d.driverId).includes(q)
        );
      })
    : all;

  // Esc يخرج من ملء الشاشة
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const countryName =
    country && countries.find((c) => c.iso2 === country)?.nameEn;

  const countrySelector = (
    <div className="relative">
      <Globe2 className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="input ps-3 pe-9 appearance-none cursor-pointer min-w-[180px]"
      >
        <option value="">🌍 كل الدول (شاشة مسطّحة)</option>
        {countries.map((c) => (
          <option key={c.iso2} value={c.iso2}>
            {c.flag ? `${c.flag} ` : ''}
            {c.nameEn} — عرض الدولة
          </option>
        ))}
      </select>
    </div>
  );

  const mapBlock = (
    <MapCanvas
      drivers={drivers}
      country={country}
      isLoaded={isLoaded}
      hasKey={!!GOOGLE_MAPS_KEY}
      onSelect={setSelected}
    />
  );

  // ── وضع ملء الشاشة (بثّ مباشر) ──
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-black">
        <div className="absolute inset-0">{mapBlock}</div>

        {/* شريط التحكّم العلوي العائم */}
        <div className="absolute top-4 inset-x-4 flex items-center gap-3 flex-wrap z-10">
          <div className="bg-black/70 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-4 text-white">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              {idle} متاح
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              {inRide} في رحلة
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold">
              <Car className="w-4 h-4" /> {total}
            </span>
            {countryName && (
              <span className="text-amber-300 font-bold">· {countryName}</span>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-lg">{countrySelector}</div>
          <button
            onClick={() => setFullscreen(false)}
            className="mr-auto bg-black/70 backdrop-blur text-white rounded-xl px-3 py-2 inline-flex items-center gap-2 hover:bg-black/80"
          >
            <Minimize2 className="w-4 h-4" />
            خروج
          </button>
        </div>

        {selected && (
          <DriverPanel driver={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="الخريطة الحية"
        subtitle={`${total} متصل · ${idle} متاح · ${inRide} في رحلة`}
      />

      <div className="px-6 pt-6 -mb-2 flex items-center justify-between gap-3 flex-wrap">
        {countrySelector}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="btn-outline"
            title="بثّ مباشر بملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
            ملء الشاشة
          </button>
          <button
            onClick={() => setDispatcherOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            إنشاء طلب يدوي (Dispatcher)
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">متاحون</div>
              <div className="text-xl font-extrabold text-gray-900">{idle}</div>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">في رحلة</div>
              <div className="text-xl font-extrabold text-gray-900">
                {inRide}
              </div>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hancr-violet/10 text-hancr-violet flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">الإجمالي Online</div>
              <div className="text-xl font-extrabold text-gray-900">
                {total}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* Map */}
          <div className="card overflow-hidden h-[70vh] relative">
            {mapBlock}
            {GOOGLE_MAPS_KEY && isLoaded && (
              <button
                onClick={() => setFullscreen(true)}
                className="absolute top-3 end-3 bg-white shadow-md rounded-lg p-2 hover:bg-gray-50 z-10"
                title="بثّ مباشر بملء الشاشة"
              >
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </div>

          {/* Side panel */}
          <div className="card overflow-hidden flex flex-col h-[70vh]">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input ps-3 pe-9"
                  placeholder="اسم/هاتف/لوحة/معرّف…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && drivers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">جارٍ التحميل…</div>
              ) : drivers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  {country
                    ? 'لا يوجد سائقون متصلون في هذه الدولة'
                    : 'لا يوجد سائقون متصلون'}
                </div>
              ) : (
                drivers.map((d) => {
                  const isInRide = d.status === 'in_ride';
                  return (
                    <button
                      key={d.driverId as number}
                      onClick={() => setSelected(d)}
                      className={`w-full text-start p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 ${
                        selected?.driverId === d.driverId
                          ? 'bg-hancr-violet/5'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isInRide ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {(d.driverName as string) ?? `سائق #${d.driverId as number}`}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {(d.plateNumber as string) ?? ''}
                          {d.carBrand ? ` · ${d.carBrand as string}` : ''}
                        </div>
                      </div>
                      <span
                        className={`badge ${isInRide ? 'badge-blue' : 'badge-green'} text-[10px] shrink-0`}
                      >
                        {isInRide ? 'في رحلة' : 'متاح'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <DriverPanel driver={selected} onClose={() => setSelected(null)} />
      )}
      {dispatcherOpen && (
        <DispatcherDrawer onClose={() => setDispatcherOpen(false)} />
      )}
    </div>
  );
}

// ─── Live map canvas — flat Mercator map that auto-fits to the live cars ──────

function MapCanvas({
  drivers,
  country,
  isLoaded,
  hasKey,
  onSelect,
}: {
  drivers: Driver[];
  country: string;
  isLoaded: boolean;
  hasKey: boolean;
  onSelect: (d: Driver) => void;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);

  // عند تغيّر السائقين أو الدولة: لائم الحدود على السيارات الظاهرة (شاشة مسطّحة
  // مركّزة على الأسطول الفعلي بدل كرة أرضية).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || drivers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const d of drivers) {
      bounds.extend({ lat: d.lat as number, lng: d.lng as number });
    }
    map.fitBounds(bounds, 64);
    // لا تُفرِط في التكبير عند سيارة واحدة
    const once = google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
    });
    return () => google.maps.event.removeListener(once);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers.length, country, isLoaded]);

  if (!hasKey) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm p-8 text-center">
        <div>
          <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-bold">مفتاح Google Maps غير مُعيَّن</p>
          <p className="text-xs mt-2">
            أضف <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> في .env.prod وأعد بناء
            admin-panel
          </p>
        </div>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        جارٍ تحميل الخريطة…
      </div>
    );
  }
  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={DEFAULT_CENTER}
      zoom={11}
      onLoad={(map) => {
        mapRef.current = map;
      }}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      }}
    >
      {drivers.map((d) => {
        const heading = Number(d.heading) || 0;
        const color = d.status === 'in_ride' ? '#3B82F6' : '#10B981';
        // سهم اتجاهي يدور حسب heading ليُظهر وجهة سير السيارة؛ نقطة ثابتة عند
        // غياب الاتجاه (سيارة متوقّفة).
        const icon =
          heading > 0
            ? {
                path: 3, // FORWARD_CLOSED_ARROW
                scale: 5,
                rotation: heading,
                fillColor: color,
                fillOpacity: 0.95,
                strokeColor: '#ffffff',
                strokeWeight: 1.5,
              }
            : {
                path: 0, // CIRCLE
                scale: 7,
                fillColor: color,
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              };
        return (
          <MarkerF
            key={d.driverId as number}
            position={{ lat: d.lat as number, lng: d.lng as number }}
            icon={icon}
            title={(d.driverName as string) ?? `سائق #${d.driverId as number}`}
            onClick={() => onSelect(d)}
          />
        );
      })}
    </GoogleMap>
  );
}

// ─── K4 — Dispatcher drawer ─────────────────────────────────────────────────

type RiderHit = { id: number; name: string; phone: string };

function DispatcherDrawer({ onClose }: { onClose: () => void }) {
  const [riderQuery, setRiderQuery] = useState('');
  const [picked, setPicked] = useState<RiderHit | null>(null);
  const [originLat, setOriginLat] = useState('24.7136');
  const [originLng, setOriginLng] = useState('46.6753');
  const [destLat, setDestLat] = useState('24.6877');
  const [destLng, setDestLng] = useState('46.7219');
  const [originAddr, setOriginAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [serviceId, setServiceId] = useState('1');
  const [regionId, setRegionId] = useState('1');
  const [driverIdHint, setDriverIdHint] = useState('');

  const [search, { data: lookupData, loading: searching }] = useLazyQuery(
    ADMIN_RIDER_LOOKUP,
    { fetchPolicy: 'network-only' },
  );

  useEffect(() => {
    if (riderQuery.trim().length < 3 || picked) return;
    const handle = setTimeout(() => {
      search({ variables: { phone: riderQuery.trim() } });
    }, 300);
    return () => clearTimeout(handle);
  }, [riderQuery, picked, search]);

  const hits: RiderHit[] = lookupData?.adminRiderLookup ?? [];

  const [create, { loading: creating }] = useMutation(
    ADMIN_CREATE_MANUAL_ORDER,
    {
      onCompleted: (data) => {
        const id = data?.adminCreateManualOrder?.id;
        toast.success(`تم إنشاء الطلب #${id}`);
        onClose();
      },
      onError: (e) => toast.error(e.message),
    },
  );

  const canSubmit =
    picked !== null &&
    !!originLat &&
    !!originLng &&
    !!destLat &&
    !!destLng &&
    !!serviceId &&
    !!regionId &&
    !creating;

  const handleSubmit = () => {
    if (!picked) return;
    create({
      variables: {
        input: {
          riderId: picked.id,
          serviceId: Number(serviceId),
          regionId: Number(regionId),
          origin: { lat: Number(originLat), lng: Number(originLng) },
          destination: { lat: Number(destLat), lng: Number(destLng) },
          originAddress: originAddr || undefined,
          destinationAddress: destAddr || undefined,
          driverIdHint: driverIdHint ? Number(driverIdHint) : undefined,
        },
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:w-[480px] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <div>
            <div className="text-xs text-gray-500">Dispatcher</div>
            <h2 className="font-extrabold text-gray-900 text-lg">
              إنشاء طلب يدوي
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── 1. Rider lookup ── */}
          <div>
            <label className="label">1) ابحث عن الراكب (بالهاتف)</label>
            {picked ? (
              <div className="card p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">{picked.name}</div>
                  <div className="text-xs text-gray-500 ltr">
                    {picked.phone} · #{picked.id}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPicked(null);
                    setRiderQuery('');
                  }}
                  className="btn-outline btn-sm"
                >
                  تغيير
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    className="input ps-3 pe-9"
                    placeholder="+9665…"
                    value={riderQuery}
                    onChange={(e) => setRiderQuery(e.target.value)}
                  />
                  {searching ? (
                    <Loader2 className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>
                {hits.length > 0 && riderQuery.length >= 3 ? (
                  <div className="mt-2 card divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {hits.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setPicked(h)}
                        className="w-full text-start p-2.5 hover:bg-gray-50"
                      >
                        <div className="font-bold text-gray-900 text-sm">
                          {h.name}
                        </div>
                        <div className="text-xs text-gray-500 ltr">
                          {h.phone} · #{h.id}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* ── 2. Route ── */}
          <div>
            <label className="label">2) المسار</label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="origin lat"
                  value={originLat}
                  onChange={(e) => setOriginLat(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="origin lng"
                  value={originLng}
                  onChange={(e) => setOriginLng(e.target.value)}
                />
              </div>
              <input
                className="input"
                placeholder="عنوان الانطلاق (اختياري)"
                value={originAddr}
                onChange={(e) => setOriginAddr(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <input
                  className="input"
                  placeholder="dest lat"
                  value={destLat}
                  onChange={(e) => setDestLat(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="dest lng"
                  value={destLng}
                  onChange={(e) => setDestLng(e.target.value)}
                />
              </div>
              <input
                className="input"
                placeholder="عنوان الوصول (اختياري)"
                value={destAddr}
                onChange={(e) => setDestAddr(e.target.value)}
              />
            </div>
          </div>

          {/* ── 3. Service + region ── */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">3) معرّف الخدمة</label>
              <input
                className="input"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              />
            </div>
            <div>
              <label className="label">معرّف المنطقة</label>
              <input
                className="input"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              />
            </div>
          </div>

          {/* ── 4. Optional force-assign ── */}
          <div>
            <label className="label">4) تعيين سائق محدد (اختياري)</label>
            <input
              className="input"
              placeholder="معرّف السائق — اتركه فارغاً للمطابقة العادية"
              value={driverIdHint}
              onChange={(e) => setDriverIdHint(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-2">
            <button onClick={onClose} className="btn-outline flex-1">
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary flex-1"
            >
              {creating ? 'جارٍ الإنشاء…' : 'إنشاء الطلب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverPanel({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:w-[400px] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">سائق #{driver.driverId as number}</div>
            <h2 className="font-extrabold text-gray-900 text-lg">
              {(driver.driverName as string) ?? `سائق #${driver.driverId as number}`}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="card p-4 bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white">
            <div className="text-xs opacity-80 mb-1">الحالة</div>
            <div className="text-2xl font-extrabold">
              {driver.status === 'in_ride' ? '🚗 في رحلة' : '✅ متاح'}
            </div>
            {Number(driver.currentOrderId) > 0 ? (
              <Link
                href={`/orders/${driver.currentOrderId as number}`}
                className="inline-flex items-center gap-1 text-xs underline mt-2"
              >
                طلب #{driver.currentOrderId as number}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : null}
          </div>

          <div className="card p-4 space-y-2 text-sm">
            <Row label="الهاتف" value={
              driver.driverPhone ? (
                <a
                  href={`tel:${driver.driverPhone}`}
                  className="inline-flex items-center gap-1 text-hancr-violet hover:underline ltr"
                >
                  <Phone className="w-3 h-3" />
                  {driver.driverPhone as string}
                </a>
              ) : '—'
            } />
            <Row label="المركبة" value={
              [driver.carBrand, driver.carModel].filter(Boolean).join(' ') || '—'
            } />
            <Row label="رقم اللوحة" value={(driver.plateNumber as string) ?? '—'} />
            <Row label="الموقع" value={
              `${Number(driver.lat).toFixed(5)}, ${Number(driver.lng).toFixed(5)}`
            } />
          </div>

          <Link
            href={`/users/drivers/${driver.driverId as number}`}
            className="btn-outline w-full"
          >
            عرض الملف الكامل
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
