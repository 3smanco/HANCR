'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CreditCard, Save, Plug, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PROVIDER_CONFIG,
  UPDATE_GATEWAY_CONFIG,
  INTEGRATION_MATRIX,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type GatewayCode = 'hyperpay' | 'moyasar' | 'stripe' | 'applepay';
type GatewayCfg = {
  enabled: boolean;
  regions: string[];
  displayName?: string;
};
type GatewayState = Record<GatewayCode, GatewayCfg>;

const ALL_REGIONS = ['SA', 'AE', 'QA', 'KW', 'BH', 'OM'] as const;

const GATEWAYS: Array<{
  id: GatewayCode;
  label: string;
  description: string;
  envHint: string;
}> = [
  {
    id: 'hyperpay',
    label: 'HyperPay',
    description: 'بوابة سعودية. تدعم Mada، VISA، MasterCard، Apple Pay.',
    envHint: 'HYPERPAY_ACCESS_TOKEN + HYPERPAY_ENTITY_ID في .env.prod',
  },
  {
    id: 'moyasar',
    label: 'Moyasar',
    description: 'بوابة سعودية شعبية. أسعار تنافسية ودعم Mada قوي.',
    envHint: 'MOYASAR_API_KEY في .env.prod',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    description: 'الأنسب للإمارات وقطر. لا يدعم Mada.',
    envHint: 'STRIPE_SECRET_KEY في .env.prod',
  },
  {
    id: 'applepay',
    label: 'Apple Pay',
    description: 'تمر عبر HyperPay أو Stripe كـ tokenized PAN.',
    envHint: 'تُفعَّل تلقائياً عند تفعيل HyperPay أو Stripe',
  },
];

const DEFAULTS: GatewayState = {
  hyperpay: { enabled: false, regions: ['SA'] },
  moyasar: { enabled: false, regions: ['SA'] },
  stripe: { enabled: false, regions: ['AE', 'QA'] },
  applepay: { enabled: false, regions: ['SA', 'AE'] },
};

export default function GatewaysSettingsPage() {
  const { data, loading, refetch } = useQuery(PROVIDER_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_GATEWAY_CONFIG, {
    onCompleted: () => {
      toast.success('تم حفظ بوابات الدفع');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [state, setState] = useState<GatewayState>(DEFAULTS);

  useEffect(() => {
    if (!data) return;
    const remote = data.appConfig?.gatewayConfig as Partial<GatewayState> | undefined;
    if (!remote) return;
    const merged: GatewayState = { ...DEFAULTS };
    for (const code of Object.keys(DEFAULTS) as GatewayCode[]) {
      const r = remote[code];
      if (r && typeof r === 'object') {
        merged[code] = {
          enabled: Boolean(r.enabled),
          regions: Array.isArray(r.regions) ? r.regions : DEFAULTS[code].regions,
          displayName: typeof r.displayName === 'string' ? r.displayName : undefined,
        };
      }
    }
    setState(merged);
  }, [data]);

  const toggle = (code: GatewayCode, enabled: boolean) => {
    setState((s) => ({ ...s, [code]: { ...s[code], enabled } }));
  };
  const toggleRegion = (code: GatewayCode, region: string) => {
    setState((s) => {
      const cur = s[code].regions;
      const next = cur.includes(region)
        ? cur.filter((r) => r !== region)
        : [...cur, region];
      return { ...s, [code]: { ...s[code], regions: next } };
    });
  };

  return (
    <div>
      <Topbar
        title="بوابات الدفع"
        subtitle="فعِّل بوابات الدفع المتاحة لكل دولة. يطبَّق تلقائياً على تطبيقات الراكب."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        <IntegrationMatrixBoard />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">
            جارٍ التحميل…
          </div>
        ) : (
          <div className="card p-6 space-y-5 max-w-3xl">
            <div className="flex items-center gap-2 text-gray-900">
              <CreditCard className="w-5 h-5 text-hancr-violet" />
              <h2 className="font-extrabold">البوابات المتاحة</h2>
            </div>

            <div className="space-y-3">
              {GATEWAYS.map((g) => {
                const cfg = state[g.id];
                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-xl border-2 transition ${
                      cfg.enabled
                        ? 'border-hancr-violet/40 bg-hancr-violet/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{g.label}</div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {g.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5 font-mono">
                          {g.envHint}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-sm shrink-0">
                        <input
                          type="checkbox"
                          checked={cfg.enabled}
                          onChange={(e) => toggle(g.id, e.target.checked)}
                        />
                        <span className="font-bold">
                          {cfg.enabled ? 'مفعَّلة' : 'معطَّلة'}
                        </span>
                      </label>
                    </div>

                    {cfg.enabled ? (
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-2">
                          الدول المدعومة:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_REGIONS.map((r) => {
                            const on = cfg.regions.includes(r);
                            return (
                              <button
                                key={r}
                                onClick={() => toggleRegion(g.id, r)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                                  on
                                    ? 'bg-hancr-violet text-white border-hancr-violet'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => save({ variables: { gatewayConfig: state } })}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جارٍ الحفظ…' : 'حفظ الكل'}
              </button>
              <p className="text-xs text-gray-400 mt-3">
                ⚠️ مفاتيح API السرية لا تُحفظ هنا — فقط حالة التفعيل والنطاق
                الجغرافي. المفاتيح في <code>.env.prod</code> على السيرفر.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Integration readiness matrix (Phase 10) ──────────────────────────────────

const CHANNEL_LABEL: Record<string, string> = {
  payment: 'الدفع',
  sms: 'الرسائل',
  maps: 'الخرائط',
};

type Cell = { channel: string; provider: string; status: string; envKey: string };
type Row = {
  countryIso?: string | null;
  countryName: string;
  flag?: string | null;
  cells: Cell[];
};

function IntegrationMatrixBoard() {
  const { data, loading } = useQuery(INTEGRATION_MATRIX, {
    fetchPolicy: 'cache-and-network',
  });
  if (loading && !data) return null;
  const m = data?.integrationMatrix;
  if (!m) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <Plug className="w-5 h-5 text-hancr-violet" />
        <span className="font-extrabold text-gray-900">
          مصفوفة جاهزية التكامل
        </span>
        <span className="text-xs text-gray-400">
          المزوّد الموصى به لكل سوق وحالة تجهيزه (طبقة تجريد — لا تكشف مفاتيح)
        </span>
        <div className="mr-auto flex gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
            <CheckCircle2 className="w-3 h-3" /> {m.liveCount} جاهزة
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
            <Clock className="w-3 h-3" /> {m.pendingCount} بانتظار المالك
          </span>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th>الدولة</th>
            <th>الدفع</th>
            <th>الرسائل</th>
            <th>الخرائط</th>
          </tr>
        </thead>
        <tbody>
          {(m.countries as Row[]).map((c, i) => (
            <tr key={c.countryIso ?? i}>
              <td className="font-bold whitespace-nowrap">
                {c.flag ? `${c.flag} ` : ''}
                {c.countryName}
              </td>
              {['payment', 'sms', 'maps'].map((ch) => {
                const cell = c.cells.find((x) => x.channel === ch);
                if (!cell) return <td key={ch}>—</td>;
                return (
                  <td key={ch}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{cell.provider}</span>
                      <span
                        className={`text-[10px] inline-flex items-center gap-1 ${
                          cell.status === 'live'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                        title={cell.envKey}
                      >
                        {cell.status === 'live' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> جاهز
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> {cell.envKey}
                          </>
                        )}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-5 py-2 text-[11px] text-gray-400 border-t border-gray-50">
        {/* تلميح للمالك */}
        التفعيل: أضف متغيّر البيئة المعروض في <code>.env.prod</code> ثم أعد تشغيل
        الخدمة — تتحوّل الحالة تلقائياً إلى «جاهز».
        <span className="sr-only">{Object.values(CHANNEL_LABEL).join(' ')}</span>
      </div>
    </div>
  );
}
