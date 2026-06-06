'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Gift, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, UPDATE_LOYALTY_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type Loyalty = {
  tierThresholds: { Bronze: number; Silver: number; Gold: number; Platinum: number };
  milesPerCurrency: number;
  milesToCurrency: number;
  minRedeem: number;
  redeemStep: number;
  referralBonus: number;
};

const DEFAULTS: Loyalty = {
  tierThresholds: { Bronze: 0, Silver: 500, Gold: 2000, Platinum: 5000 },
  milesPerCurrency: 1,
  milesToCurrency: 0.05,
  minRedeem: 100,
  redeemStep: 50,
  referralBonus: 15,
};

const TIER_META: Array<{ key: keyof Loyalty['tierThresholds']; label: string; color: string }> = [
  { key: 'Bronze', label: 'برونزي', color: 'text-amber-700' },
  { key: 'Silver', label: 'فضي', color: 'text-gray-500' },
  { key: 'Gold', label: 'ذهبي', color: 'text-yellow-600' },
  { key: 'Platinum', label: 'بلاتيني', color: 'text-slate-600' },
];

export default function LoyaltySettingsPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_LOYALTY_CONFIG, {
    onCompleted: () => {
      toast.success('تم حفظ إعدادات الولاء');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<Loyalty>(DEFAULTS);

  useEffect(() => {
    if (!data) return;
    const remote = (data.appConfig?.loyaltyConfig ?? {}) as Partial<Loyalty>;
    setForm({
      ...DEFAULTS,
      ...remote,
      tierThresholds: { ...DEFAULTS.tierThresholds, ...(remote.tierThresholds ?? {}) },
    });
  }, [data]);

  const setTier = (k: keyof Loyalty['tierThresholds'], v: number) =>
    setForm({ ...form, tierThresholds: { ...form.tierThresholds, [k]: v } });

  const cashbackPct = (form.milesToCurrency * form.milesPerCurrency * 100).toFixed(1);

  return (
    <div>
      <Topbar
        title="إعدادات الولاء (HANCR Miles)"
        subtitle="عتبات المستويات، معدّل الكسب، الاسترداد، ومكافأة الإحالة."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <div className="space-y-5 max-w-2xl">
            {/* Tier thresholds */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-900">
                <Gift className="w-5 h-5 text-hancr-violet" />
                <h2 className="font-extrabold">عتبات المستويات (نقاط مدى الحياة)</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {TIER_META.map((t) => (
                  <div key={t.key}>
                    <label className={`label ${t.color} font-bold`}>{t.label}</label>
                    <input
                      type="number"
                      className="input"
                      min={0}
                      value={form.tierThresholds[t.key]}
                      onChange={(e) => setTier(t.key, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Earn / redeem */}
            <div className="card p-6 space-y-4">
              <h2 className="font-extrabold text-gray-900">الكسب والاسترداد</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">نقاط لكل وحدة عملة مدفوعة</label>
                  <input type="number" className="input" min={0} step={0.1}
                    value={form.milesPerCurrency}
                    onChange={(e) => setForm({ ...form, milesPerCurrency: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">قيمة النقطة عند الاسترداد (عملة)</label>
                  <input type="number" className="input" min={0} step={0.01}
                    value={form.milesToCurrency}
                    onChange={(e) => setForm({ ...form, milesToCurrency: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">أقل عدد نقاط للاسترداد</label>
                  <input type="number" className="input" min={0} step={10}
                    value={form.minRedeem}
                    onChange={(e) => setForm({ ...form, minRedeem: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">مضاعفات الاسترداد</label>
                  <input type="number" className="input" min={1} step={10}
                    value={form.redeemStep}
                    onChange={(e) => setForm({ ...form, redeemStep: Number(e.target.value) })} />
                </div>
              </div>
              <div className="bg-hancr-violet/5 border border-hancr-violet/20 rounded-lg p-3 text-sm text-gray-700">
                نسبة الكاش-باك الفعلية ≈ <strong className="text-hancr-violet">{cashbackPct}%</strong> من قيمة الرحلة
              </div>
            </div>

            {/* Referral */}
            <div className="card p-6 space-y-3">
              <h2 className="font-extrabold text-gray-900">مكافأة الإحالة</h2>
              <div className="max-w-xs">
                <label className="label">المكافأة لكل طرف (بعملته)</label>
                <input type="number" className="input" min={0} step={1}
                  value={form.referralBonus}
                  onChange={(e) => setForm({ ...form, referralBonus: Number(e.target.value) })} />
              </div>
            </div>

            <button
              onClick={() => save({ variables: { loyaltyConfig: form } })}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جارٍ الحفظ…' : 'حفظ كل إعدادات الولاء'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
