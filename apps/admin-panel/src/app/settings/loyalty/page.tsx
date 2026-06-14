'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Gift, Save, Globe2, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SDUI_CONFIG,
  UPDATE_LOYALTY_CONFIG,
  GLOBAL_LOYALTY_OVERVIEW,
} from '@/lib/gql';
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

        <GlobalLoyaltyCard />

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

// ── Global Hancr Miles overview (super only) ─────────────────────────────────

const TIER_AR: Record<string, string> = {
  Bronze: 'برونزي',
  Silver: 'فضّي',
  Gold: 'ذهبي',
  Platinum: 'بلاتيني',
};
const TIER_COLOR: Record<string, string> = {
  Bronze: 'text-amber-700 bg-amber-50',
  Silver: 'text-gray-600 bg-gray-100',
  Gold: 'text-yellow-700 bg-yellow-50',
  Platinum: 'text-slate-700 bg-slate-100',
};

type Bucket = { tier: string; members: number; availableMiles: number };

function GlobalLoyaltyCard() {
  const { data } = useQuery(GLOBAL_LOYALTY_OVERVIEW, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'ignore', // غير super → نتجاهل بدل كسر الصفحة
  });
  const o = data?.globalLoyaltyOverview;
  if (!o) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Globe2 className="w-5 h-5 text-hancr-violet" />
        <h3 className="font-extrabold text-gray-900">
          نظرة عالمية على Hancr Miles
        </h3>
        <span className="text-xs text-gray-400">
          استبدال موحَّد عبر كل الدول
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">إجمالي الأعضاء</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {o.totalMembers.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">أميال قائمة</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {Number(o.totalAvailableMiles).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
          <div className="text-xs text-emerald-700 inline-flex items-center gap-1">
            <Coins className="w-3 h-3" /> الالتزام المالي
          </div>
          <div className="text-2xl font-extrabold text-emerald-800">
            {Number(o.liabilityBase).toLocaleString()} {o.baseCurrency}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            الميل = {Number(o.mileValueBase).toFixed(4)} {o.baseCurrency}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(o.tiers as Bucket[]).map((t) => (
          <div
            key={t.tier}
            className={`rounded-xl p-3 ${TIER_COLOR[t.tier] ?? 'bg-gray-50'}`}
          >
            <div className="text-xs font-bold">{TIER_AR[t.tier] ?? t.tier}</div>
            <div className="text-xl font-extrabold">
              {t.members.toLocaleString()}
            </div>
            <div className="text-[10px] opacity-70">
              {Number(t.availableMiles).toLocaleString()} ميل
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
