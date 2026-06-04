'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Power,
  PowerOff,
  Trash2,
  X,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_BUNDLES,
  CREATE_BUNDLE,
  TOGGLE_BUNDLE_ACTIVE,
  DELETE_BUNDLE,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

type Bundle = Record<string, unknown>;

export default function BundlesPage() {
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(LIST_BUNDLES);

  const [toggleActive] = useMutation(TOGGLE_BUNDLE_ACTIVE, {
    onCompleted: () => refetch(),
    onError: (e) => toast.error(e.message),
  });
  const [deleteBundle] = useMutation(DELETE_BUNDLE, {
    onCompleted: () => {
      toast.success('تم حذف الحزمة');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [createBundle, { loading: saving }] = useMutation(CREATE_BUNDLE, {
    onCompleted: () => {
      toast.success('تم إنشاء الحزمة');
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const bundles: Bundle[] = data?.adminBundles ?? [];
  const activeCount = bundles.filter((b) => b.active).length;

  return (
    <div>
      <Topbar
        title="حزم الرحلات"
        subtitle={`${bundles.length} حزمة • ${activeCount} مفعّلة`}
      />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            حزمة جديدة
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
              جارٍ التحميل…
            </div>
          </div>
        ) : bundles.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-bold text-lg">لا توجد حزم بعد</p>
            <p className="text-sm text-gray-500 mt-2">
              أنشئ أول حزمة رحلات للركّاب
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {bundles.map((b) => {
              const active = b.active as boolean;
              const maxKm = Number(b.maxDistanceKm);
              return (
                <div
                  key={b.id as number}
                  className={`card p-5 ${!active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white">
                      <Package className="w-6 h-6" />
                    </div>
                    <span
                      className={`badge ${active ? 'badge-green' : 'badge-gray'}`}
                    >
                      {active ? 'مفعّلة' : 'معطّلة'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-xl">
                    {b.name as string}
                  </h3>
                  <p className="text-sm text-hancr-violet-deep font-bold mt-1">
                    {`${b.ridesCount} رحلة — ${b.price} ${b.currency}`}
                  </p>

                  <div className="mt-4 space-y-1.5 pt-3 border-t border-gray-100 text-sm">
                    <Row
                      label="الصلاحية"
                      value={`${b.validityDays} يوم`}
                    />
                    <Row
                      label="أقصى مسافة"
                      value={maxKm === 0 ? 'بلا حدود' : `${maxKm} كم`}
                    />
                    <Row label="المنطقة" value={`${b.regionId}`} />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => toggleActive({ variables: { id: b.id } })}
                      className={`btn-sm flex-1 ${
                        active ? 'btn-outline' : 'btn-success'
                      }`}
                    >
                      {active ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5" />
                          تعطيل
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          تفعيل
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف الحزمة ${b.name}؟`))
                          deleteBundle({ variables: { id: b.id } });
                      }}
                      className="btn-sm btn-outline text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateBundleModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createBundle({ variables: { input } })}
        />
      )}
    </div>
  );
}

function CreateBundleModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState('');
  const [ridesCount, setRidesCount] = useState('10');
  const [price, setPrice] = useState('200');
  const [currency, setCurrency] = useState('SAR');
  const [validityDays, setValidityDays] = useState('30');
  const [maxDistanceKm, setMaxDistanceKm] = useState('0');
  const [regionId, setRegionId] = useState('1');

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('أدخل اسم الحزمة');
      return;
    }
    onSave({
      name: name.trim(),
      ridesCount: Number(ridesCount),
      price: Number(price),
      currency: currency.trim().toUpperCase() || 'SAR',
      validityDays: Number(validityDays),
      maxDistanceKm: Number(maxDistanceKm),
      regionId: Number(regionId),
    });
  };

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
          <h2 className="font-extrabold text-gray-900 text-lg">حزمة جديدة</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">اسم الحزمة</label>
            <input
              className="input"
              placeholder="حزمة 10 رحلات داخل المدينة"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Field
            label="عدد الرحلات"
            value={ridesCount}
            onChange={setRidesCount}
          />
          <Field label="السعر" value={price} onChange={setPrice} />
          <div>
            <label className="label">العملة</label>
            <input
              className="input uppercase"
              value={currency}
              maxLength={3}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
          <Field
            label="مدة الصلاحية (يوم)"
            value={validityDays}
            onChange={setValidityDays}
          />
          <Field
            label="أقصى مسافة لكل رحلة (كم — 0 = بلا حدود)"
            value={maxDistanceKm}
            onChange={setMaxDistanceKm}
          />
          <Field label="معرّف المنطقة" value={regionId} onChange={setRegionId} />
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ الحفظ…' : 'إنشاء'}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
