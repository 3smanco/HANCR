'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Ticket,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Percent,
  BadgeDollarSign,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_COUPONS,
  CREATE_COUPON,
  TOGGLE_COUPON_ACTIVE,
  DELETE_COUPON,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

type Coupon = Record<string, unknown>;

export default function CouponsPage() {
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(LIST_COUPONS);

  const [toggleActive] = useMutation(TOGGLE_COUPON_ACTIVE, {
    onCompleted: () => refetch(),
    onError: (e) => toast.error(e.message),
  });
  const [deleteCoupon] = useMutation(DELETE_COUPON, {
    onCompleted: () => {
      toast.success('تم حذف الكوبون');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [createCoupon, { loading: saving }] = useMutation(CREATE_COUPON, {
    onCompleted: () => {
      toast.success('تم إنشاء الكوبون');
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const coupons: Coupon[] = data?.adminCoupons ?? [];
  const activeCount = coupons.filter((c) => c.active).length;

  return (
    <div>
      <Topbar
        title="الكوبونات وأكواد الخصم"
        subtitle={`${coupons.length} كوبون • ${activeCount} مفعّل`}
      />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            كوبون جديد
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
              جارٍ التحميل…
            </div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="card p-12 text-center">
            <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-bold text-lg">لا توجد كوبونات بعد</p>
            <p className="text-sm text-gray-500 mt-2">
              أنشئ أول كوبون خصم لركابك
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {coupons.map((c) => {
              const isPercent = c.type === 'Percent';
              const active = c.active as boolean;
              const maxUses = c.maxUses as number;
              const used = c.usedCount as number;
              const expiresAt = c.expiresAt
                ? new Date(c.expiresAt as string)
                : null;
              const expired =
                expiresAt !== null && expiresAt.getTime() < Date.now();

              return (
                <div
                  key={c.id as number}
                  className={`card p-5 ${!active || expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white">
                      {isPercent ? (
                        <Percent className="w-6 h-6" />
                      ) : (
                        <BadgeDollarSign className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`badge ${
                        expired
                          ? 'badge-gray'
                          : active
                          ? 'badge-green'
                          : 'badge-gray'
                      }`}
                    >
                      {expired ? 'منتهٍ' : active ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-xl tracking-wider">
                    {c.code as string}
                  </h3>
                  <p className="text-sm text-hancr-violet-deep font-bold mt-1">
                    {isPercent
                      ? `${Number(c.value)}% خصم`
                      : `${Number(c.value)} خصم ثابت`}
                    {isPercent && Number(c.maxDiscount) > 0
                      ? ` (حتى ${Number(c.maxDiscount)})`
                      : ''}
                  </p>

                  <div className="mt-4 space-y-1.5 pt-3 border-t border-gray-100 text-sm">
                    <Row label="أقل أجرة" value={`${Number(c.minFare)}`} />
                    <Row
                      label="الاستخدام"
                      value={`${used}${maxUses > 0 ? ` / ${maxUses}` : ' / ∞'}`}
                    />
                    <Row
                      label="لكل مستخدم"
                      value={
                        (c.perUserLimit as number) > 0
                          ? `${c.perUserLimit}`
                          : '∞'
                      }
                    />
                    <Row
                      label="ينتهي"
                      value={
                        expiresAt
                          ? expiresAt.toLocaleDateString('ar')
                          : 'بلا انتهاء'
                      }
                    />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => toggleActive({ variables: { id: c.id } })}
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
                        if (confirm(`حذف الكوبون ${c.code}؟`))
                          deleteCoupon({ variables: { id: c.id } });
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
        <CreateCouponModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createCoupon({ variables: { input } })}
        />
      )}
    </div>
  );
}

function CreateCouponModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [code, setCode] = useState('');
  const [type, setType] = useState('Percent');
  const [value, setValue] = useState('25');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [minFare, setMinFare] = useState('0');
  const [maxUses, setMaxUses] = useState('0');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [regionIds, setRegionIds] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSave = () => {
    if (!code.trim()) {
      toast.error('أدخل كود الخصم');
      return;
    }
    onSave({
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      maxDiscount: Number(maxDiscount),
      minFare: Number(minFare),
      maxUses: Number(maxUses),
      perUserLimit: Number(perUserLimit),
      regionIds: regionIds
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n) && n > 0),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
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
          <h2 className="font-extrabold text-gray-900 text-lg">كوبون جديد</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">كود الخصم</label>
            <input
              className="input uppercase"
              placeholder="WELCOME25"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="label">نوع الخصم</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Percent">نسبة مئوية %</option>
              <option value="Fixed">مبلغ ثابت</option>
            </select>
          </div>
          <Field
            label={type === 'Percent' ? 'النسبة (%)' : 'المبلغ'}
            value={value}
            onChange={setValue}
          />
          {type === 'Percent' && (
            <Field
              label="أقصى خصم (0 = بلا سقف)"
              value={maxDiscount}
              onChange={setMaxDiscount}
            />
          )}
          <Field label="أقل أجرة" value={minFare} onChange={setMinFare} />
          <Field
            label="أقصى استخدامات (0 = غير محدود)"
            value={maxUses}
            onChange={setMaxUses}
          />
          <Field
            label="حد لكل مستخدم (0 = غير محدود)"
            value={perUserLimit}
            onChange={setPerUserLimit}
          />
          <div>
            <label className="label">معرّفات المناطق (فارغ = الكل)</label>
            <input
              className="input"
              placeholder="1, 2, 3"
              value={regionIds}
              onChange={(e) => setRegionIds(e.target.value)}
            />
          </div>
          <div>
            <label className="label">تاريخ الانتهاء (اختياري)</label>
            <input
              type="date"
              className="input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
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
