'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { DollarSign, Plus, Edit3, Trash2, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PRICING_ZONES,
  UPSERT_PRICING_ZONE,
  DELETE_PRICING_ZONE,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Zone = Record<string, unknown>;

export default function PricingZonesPage() {
  const [editing, setEditing] = useState<Zone | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(PRICING_ZONES);
  const [upsert, { loading: saving }] = useMutation(UPSERT_PRICING_ZONE, {
    onCompleted: () => {
      toast.success('تم الحفظ');
      setEditing(null);
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [del] = useMutation(DELETE_PRICING_ZONE, {
    onCompleted: () => {
      toast.success('تم الحذف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const zones: Zone[] = data?.pricingZones ?? [];

  return (
    <div>
      <Topbar
        title="مناطق التسعير"
        subtitle={`${zones.length} منطقة · يطبَّق على الطلبات حسب المنطقة + الخدمة`}
      />
      <div className="p-6 space-y-5">
        <div className="card p-4 bg-blue-50 border-blue-200 text-sm text-blue-800">
          <strong>كيف تعمل؟</strong> عند إنشاء أي طلب، نبحث عن منطقة تسعير
          نشطة بنفس (region + service). الأولوية للمنطقة المرتبطة بأسطول السائق
          (إن وُجد)، ثم العامة. لو لا توجد، نعود لتسعير الخدمة الافتراضي.
        </div>

        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            منطقة تسعير جديدة
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : zones.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد مناطق</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المنطقة</th>
                  <th>الخدمة</th>
                  <th>الأسطول</th>
                  <th>Base</th>
                  <th>/km</th>
                  <th>/min</th>
                  <th>×</th>
                  <th>الجدولة</th>
                  <th>الحالة</th>
                  <th className="text-end">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const active = z.active as boolean;
                  return (
                    <tr key={z.id as number}>
                      <td className="font-bold text-gray-900">
                        {z.name as string}
                      </td>
                      <td className="font-mono text-xs text-gray-600">
                        #{z.regionId as number}
                      </td>
                      <td className="font-mono text-xs text-gray-600">
                        #{z.serviceId as number}
                      </td>
                      <td className="font-mono text-xs text-gray-600">
                        {z.fleetId ? `#${z.fleetId as number}` : '—'}
                      </td>
                      <td className="font-medium">
                        {Number(z.baseFare).toFixed(2)}
                      </td>
                      <td className="font-medium">
                        {Number(z.perKm).toFixed(2)}
                      </td>
                      <td className="font-medium">
                        {Number(z.perMinute).toFixed(2)}
                      </td>
                      <td className="font-bold text-hancr-violet">
                        {Number(z.multiplier).toFixed(2)}
                      </td>
                      <td className="text-xs text-gray-500">
                        {scheduleLabel(z)}
                      </td>
                      <td>
                        <span
                          className={`badge ${scheduleBadgeClass(active as boolean, z)}`}
                        >
                          {scheduleLiveLabel(active as boolean, z)}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => setEditing(z)}
                            className="btn-icon"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`حذف منطقة "${z.name}"؟`))
                                del({ variables: { id: z.id } });
                            }}
                            className="btn-icon text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(editing || creating) && (
        <UpsertModal
          initial={editing}
          saving={saving}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(input) => upsert({ variables: { input } })}
        />
      )}
    </div>
  );
}

function UpsertModal({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial: Zone | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState((initial?.name as string) ?? '');
  const [regionId, setRegionId] = useState(
    String((initial?.regionId as number) ?? 1),
  );
  const [serviceId, setServiceId] = useState(
    String((initial?.serviceId as number) ?? 1),
  );
  const [fleetId, setFleetId] = useState(
    initial?.fleetId ? String(initial.fleetId) : '',
  );
  const [baseFare, setBaseFare] = useState(
    String((initial?.baseFare as number) ?? 5),
  );
  const [perKm, setPerKm] = useState(String((initial?.perKm as number) ?? 2));
  const [perMinute, setPerMinute] = useState(
    String((initial?.perMinute as number) ?? 0.5),
  );
  const [multiplier, setMultiplier] = useState(
    String((initial?.multiplier as number) ?? 1.0),
  );
  const [active, setActive] = useState((initial?.active as boolean) ?? true);
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [polygon, setPolygon] = useState((initial?.polygon as string) ?? '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">
            {initial ? 'تعديل' : 'إنشاء'} منطقة تسعير
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="اسم المنطقة" value={name} onChange={setName} />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="معرّف المنطقة"
              value={regionId}
              onChange={setRegionId}
              type="number"
            />
            <Field
              label="معرّف الخدمة"
              value={serviceId}
              onChange={setServiceId}
              type="number"
            />
          </div>
          <Field
            label="معرّف الأسطول (اختياري)"
            value={fleetId}
            onChange={setFleetId}
            type="number"
            placeholder="فارغ = ينطبق على الجميع"
          />
          <div className="grid grid-cols-3 gap-2">
            <Field
              label="Base"
              value={baseFare}
              onChange={setBaseFare}
              type="number"
            />
            <Field
              label="per km"
              value={perKm}
              onChange={setPerKm}
              type="number"
            />
            <Field
              label="per min"
              value={perMinute}
              onChange={setPerMinute}
              type="number"
            />
          </div>
          <Field
            label="مضاعف (1.0 = بلا تغيير، 1.5 = +50%)"
            value={multiplier}
            onChange={setMultiplier}
            type="number"
          />

          {/* ── Schedule window ── */}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Clock className="w-3.5 h-3.5" />
              نافذة التفعيل (اختيارية)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="يبدأ في"
                value={startsAt}
                onChange={setStartsAt}
                type="datetime-local"
              />
              <Field
                label="ينتهي في"
                value={endsAt}
                onChange={setEndsAt}
                type="datetime-local"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              اتركها فارغة لتطبيق دائم. مفيدة للأسعار الموسمية أو ساعات الذروة.
            </p>
          </div>

          {/* ── L3 — PostGIS polygon (optional) ── */}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <div className="text-sm font-bold text-gray-700 mb-1">
              مضلَّع جغرافي (PostGIS — اختياري)
            </div>
            <textarea
              className="input font-mono text-xs"
              rows={3}
              value={polygon}
              onChange={(e) => setPolygon(e.target.value)}
              placeholder="POLYGON((46.6 24.7, 46.8 24.7, 46.8 24.6, 46.6 24.6, 46.6 24.7))"
            />
            <p className="text-xs text-gray-400 mt-1">
              صيغة WKT (lng lat). الصق من <a
                href="https://geojson.io"
                target="_blank"
                rel="noopener"
                className="text-hancr-violet underline"
              >geojson.io</a> أو QGIS. لو فارغ ستُستخدم منطقة <code>regionId</code> أعلاه.
              مضلَّعات تطغى على مطابقة المنطقة عند تطابق نقطة الانطلاق.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>نشطة</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={saving || !name || !regionId || !serviceId}
            onClick={() =>
              onSave({
                id: initial?.id,
                name: name.trim(),
                regionId: Number(regionId),
                serviceId: Number(serviceId),
                fleetId: fleetId ? Number(fleetId) : undefined,
                baseFare: Number(baseFare),
                perKm: Number(perKm),
                perMinute: Number(perMinute),
                multiplier: Number(multiplier),
                startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
                endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
                polygon: polygon.trim() || undefined,
                active,
              })
            }
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ…' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule helpers ─────────────────────────────────────────────────────

function toLocalInput(value: unknown): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return '';
  // Format as YYYY-MM-DDThh:mm for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function scheduleLabel(z: Zone): string {
  const s = z.startsAt ? new Date(z.startsAt as string) : null;
  const e = z.endsAt ? new Date(z.endsAt as string) : null;
  if (!s && !e) return 'دائم';
  if (s && e) return `${formatDate(z.startsAt as string)} → ${formatDate(z.endsAt as string)}`;
  if (s) return `من ${formatDate(z.startsAt as string)}`;
  if (e) return `حتى ${formatDate(z.endsAt as string)}`;
  return '—';
}

function isWithinSchedule(z: Zone): boolean {
  const now = new Date();
  const s = z.startsAt ? new Date(z.startsAt as string) : null;
  const e = z.endsAt ? new Date(z.endsAt as string) : null;
  if (s && now < s) return false;
  if (e && now > e) return false;
  return true;
}

function scheduleLiveLabel(active: boolean, z: Zone): string {
  if (!active) return 'موقوفة';
  if (!isWithinSchedule(z)) {
    const s = z.startsAt ? new Date(z.startsAt as string) : null;
    return s && new Date() < s ? 'مجدولة' : 'منتهية';
  }
  return 'نشطة';
}

function scheduleBadgeClass(active: boolean, z: Zone): string {
  if (!active) return 'badge-gray';
  if (!isWithinSchedule(z)) return 'badge-yellow';
  return 'badge-green';
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
