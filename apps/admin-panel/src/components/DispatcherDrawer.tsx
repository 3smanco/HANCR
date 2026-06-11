'use client';

import { useState, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { X, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { ADMIN_RIDER_LOOKUP, ADMIN_CREATE_MANUAL_ORDER } from '@/lib/gql';

export type RiderHit = { id: number; name: string; phone: string };

/**
 * Dispatcher — إنشاء طلب يدوي (حجز رحلة لراكب).
 * مشترك بين /live و /orders و صفحة الراكب. يقبل راكباً مُسبَقاً اختيارياً.
 */
export function DispatcherDrawer({
  onClose,
  onCreated,
  presetRider,
}: {
  onClose: () => void;
  onCreated?: () => void;
  presetRider?: RiderHit | null;
}) {
  const [riderQuery, setRiderQuery] = useState('');
  const [picked, setPicked] = useState<RiderHit | null>(presetRider ?? null);
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
        onCreated?.();
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
