'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { DollarSign, Plus, Edit3, Trash2, X } from 'lucide-react';
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
                  <th>الأجرة الأساسية</th>
                  <th>per km</th>
                  <th>per min</th>
                  <th>×</th>
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
                      <td>
                        <span
                          className={`badge ${active ? 'badge-green' : 'badge-gray'}`}
                        >
                          {active ? 'نشطة' : 'موقوفة'}
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
