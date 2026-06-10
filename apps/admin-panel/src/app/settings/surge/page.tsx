'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Zap, Save, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, SURGE_STATE, UPDATE_PRICING_RULES_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

/**
 * N11 — محرّك التسعير الديناميكي (Surge). يراقب الطلب/العرض (surgeState)
 * ويطبّق المضاعِف على pricingRulesConfig.surge (يدوياً أو تلقائياً).
 */
export default function SurgePage() {
  const cfg = useQuery(SDUI_CONFIG);
  const state = useQuery(SURGE_STATE, { pollInterval: 30000 });
  const [save, { loading: saving }] = useMutation(UPDATE_PRICING_RULES_CONFIG, {
    onCompleted: () => {
      toast.success('تم تطبيق التسعير');
      cfg.refetch();
      state.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [mult, setMult] = useState(1);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const prc = (cfg.data?.appConfig?.pricingRulesConfig ?? {}) as Record<
      string,
      { multiplier?: number; auto?: boolean } | undefined
    >;
    const s = prc.surge ?? {};
    setMult(Number(s.multiplier ?? 1));
    setAuto(Boolean(s.auto ?? false));
  }, [cfg.data]);

  const s = state.data?.surgeState;

  const apply = (m: number, a: boolean) => {
    const prc = {
      ...((cfg.data?.appConfig?.pricingRulesConfig ?? {}) as Record<
        string,
        unknown
      >),
    };
    prc.surge = { multiplier: m, auto: a };
    save({ variables: { pricingRulesConfig: prc } });
  };

  return (
    <div>
      <Topbar
        title="محرّك التسعير الديناميكي (Surge)"
        subtitle="راقب الطلب/العرض وطبّق مضاعِف التسعير يدوياً أو تلقائياً."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        <div className="grid sm:grid-cols-3 gap-4">
          <Stat label="الطلب (آخر 30د)" value={s?.recentDemand ?? '—'} />
          <Stat label="سائقون متصلون" value={s?.driversOnline ?? '—'} />
          <Stat
            label="المقترح"
            value={s ? `${s.suggestedMultiplier}×` : '—'}
            accent
          />
        </div>

        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 text-gray-900">
            <Zap className="w-5 h-5 text-hancr-violet" />
            <h2 className="font-extrabold">المضاعِف</h2>
          </div>
          <div>
            <label className="label">
              المضاعِف الحالي ({mult.toFixed(1)}×){auto ? ' — تلقائي' : ''}
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              className="w-full"
              value={mult}
              disabled={auto}
              onChange={(e) => setMult(Number(e.target.value))}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            تفعيل تلقائي (يطبّق المقترح كل دقيقة)
          </label>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => apply(mult, auto)}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جارٍ…' : 'تطبيق'}
            </button>
            {s && (
              <button
                onClick={() => {
                  setMult(s.suggestedMultiplier);
                  apply(s.suggestedMultiplier, auto);
                }}
                className="btn-outline btn-sm"
              >
                <TrendingUp className="w-4 h-4" />
                طبّق المقترح ({s.suggestedMultiplier}×)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500 font-bold">{label}</div>
      <div
        className={`text-2xl font-extrabold ${
          accent ? 'text-hancr-violet' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
