'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { TrendingUp, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, UPDATE_PRICING_RULES_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type SurgeRule = {
  regionId?: number | null;
  dayOfWeek?: number | null;
  fromHour: number;
  toHour: number;
  multiplier: number;
};

type PricingRules = {
  cancellationFee: number;
  cancellationGraceSeconds: number;
  cancellableStatuses: string[];
  surge: SurgeRule[];
};

const ALL_STATUSES = [
  'Requested',
  'NotFound',
  'Found',
  'DriverAccepted',
  'Booked',
  'Started',
];

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const DEFAULTS: PricingRules = {
  cancellationFee: 0,
  cancellationGraceSeconds: 120,
  cancellableStatuses: ['Requested', 'NotFound', 'Found', 'DriverAccepted', 'Booked'],
  surge: [],
};

export default function PricingRulesPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_PRICING_RULES_CONFIG, {
    onCompleted: () => {
      toast.success('تم حفظ قواعد التسعير');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<PricingRules>(DEFAULTS);

  useEffect(() => {
    if (!data) return;
    const remote = (data.appConfig?.pricingRulesConfig ?? {}) as Partial<PricingRules>;
    setForm({
      ...DEFAULTS,
      ...remote,
      cancellableStatuses: remote.cancellableStatuses ?? DEFAULTS.cancellableStatuses,
      surge: Array.isArray(remote.surge) ? remote.surge : [],
    });
  }, [data]);

  const toggleStatus = (s: string) =>
    setForm((f) => ({
      ...f,
      cancellableStatuses: f.cancellableStatuses.includes(s)
        ? f.cancellableStatuses.filter((x) => x !== s)
        : [...f.cancellableStatuses, s],
    }));

  const addSurge = () =>
    setForm((f) => ({
      ...f,
      surge: [...f.surge, { regionId: null, dayOfWeek: null, fromHour: 7, toHour: 9, multiplier: 1.5 }],
    }));

  const updateSurge = (i: number, patch: Partial<SurgeRule>) =>
    setForm((f) => ({
      ...f,
      surge: f.surge.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));

  const removeSurge = (i: number) =>
    setForm((f) => ({ ...f, surge: f.surge.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <Topbar
        title="قواعد التسعير والإلغاء"
        subtitle="رسوم الإلغاء، الحالات القابلة للإلغاء، وجدول التسعير الديناميكي (Surge)."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {/* Cancellation */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-hancr-violet" />
                <h2 className="font-extrabold">الإلغاء</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">رسوم الإلغاء (بعد فترة السماح)</label>
                  <input type="number" className="input" min={0} step={1}
                    value={form.cancellationFee}
                    onChange={(e) => setForm({ ...form, cancellationFee: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">فترة السماح المجانية (ثانية)</label>
                  <input type="number" className="input" min={0} step={10}
                    value={form.cancellationGraceSeconds}
                    onChange={(e) => setForm({ ...form, cancellationGraceSeconds: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">الحالات المسموح فيها بالإلغاء</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => {
                    const on = form.cancellableStatuses.includes(s);
                    return (
                      <button key={s} onClick={() => toggleStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                          on ? 'bg-hancr-violet text-white border-hancr-violet' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Surge */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-gray-900">التسعير الديناميكي (Surge)</h2>
                <button onClick={addSurge} className="btn-outline btn-sm">
                  <Plus className="w-3.5 h-3.5" /> قاعدة
                </button>
              </div>
              {form.surge.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  لا قواعد surge — السعر طبيعي في كل الأوقات.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.surge.map((r, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end bg-gray-50 rounded-xl p-3">
                      <div>
                        <label className="label text-[10px]">المنطقة (ID)</label>
                        <input type="number" className="input" placeholder="الكل"
                          value={r.regionId ?? ''}
                          onChange={(e) => updateSurge(i, { regionId: e.target.value ? Number(e.target.value) : null })} />
                      </div>
                      <div>
                        <label className="label text-[10px]">اليوم</label>
                        <select className="input"
                          value={r.dayOfWeek ?? ''}
                          onChange={(e) => updateSurge(i, { dayOfWeek: e.target.value === '' ? null : Number(e.target.value) })}>
                          <option value="">كل الأيام</option>
                          {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label text-[10px]">من ساعة</label>
                        <input type="number" className="input" min={0} max={23}
                          value={r.fromHour}
                          onChange={(e) => updateSurge(i, { fromHour: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label text-[10px]">إلى ساعة</label>
                        <input type="number" className="input" min={0} max={23}
                          value={r.toHour}
                          onChange={(e) => updateSurge(i, { toHour: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label text-[10px]">المضاعف ×</label>
                        <input type="number" className="input" min={1} max={5} step={0.1}
                          value={r.multiplier}
                          onChange={(e) => updateSurge(i, { multiplier: Number(e.target.value) })} />
                      </div>
                      <button onClick={() => removeSurge(i)} className="btn-icon text-red-600 mb-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">
                أول قاعدة مطابقة (منطقة + يوم + نافذة ساعات) تُطبَّق على السعر التقديري.
              </p>
            </div>

            <button
              onClick={() => save({ variables: { pricingRulesConfig: form } })}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جارٍ الحفظ…' : 'حفظ قواعد التسعير'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
