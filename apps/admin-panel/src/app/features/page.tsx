'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Zap,
  Save,
  RefreshCw,
  Sparkles,
  Brain,
  Smile,
  Shield,
  Car,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GET_APP_CONFIG, UPDATE_FEATURE_FLAGS } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';
import { useT } from '@/i18n/LocaleProvider';

// ─── Feature flag definitions ──────────────────────────────────────────────

interface FlagMeta {
  label: string;
  labelAr: string;
  description: string;
  category: string;
}

const FLAG_META: Record<string, FlagMeta> = {
  bidMode: {
    label: 'Bid Mode',
    labelAr: 'وضع المزايدة',
    description: 'يسمح للراكب باقتراح سعر، والسائقون يتقدّمون بعروضهم',
    category: 'Core',
  },
  pooling: {
    label: 'Ride Pooling',
    labelAr: 'مشاركة الرحلات',
    description: 'دمج طلبات متعدّدة في نفس المسار لخفض السعر',
    category: 'Core',
  },
  guestBooking: {
    label: 'Guest Booking',
    labelAr: 'الحجز كضيف',
    description: 'حجز رحلة واحدة بدون إنشاء حساب',
    category: 'Core',
  },
  advanceBooking: {
    label: 'Advance Booking',
    labelAr: 'الحجز المسبق',
    description: 'جدولة رحلات لتاريخ مستقبلي',
    category: 'Core',
  },

  aiVoiceBooking: {
    label: 'AI Voice Booking',
    labelAr: 'الحجز الصوتي بالذكاء الاصطناعي',
    description: 'طلب الرحلات عبر أوامر صوتية',
    category: 'AI',
  },
  smartTripMemory: {
    label: 'Smart Trip Memory',
    labelAr: 'الذاكرة الذكية للوجهات',
    description: 'اقتراح الوجهات المتكررة تلقائياً',
    category: 'AI',
  },
  captainFinanceAI: {
    label: 'Captain Finance AI',
    labelAr: 'مستشار أرباح ذكي',
    description: 'رؤى ذكية للسائق حول أرباحه',
    category: 'AI',
  },

  multiModalTransit: {
    label: 'Multi-Modal Transit',
    labelAr: 'النقل متعدّد الوسائل',
    description: 'دمج التاكسي مع المترو والباصات',
    category: 'UX',
  },
  rideMoods: {
    label: 'Ride Moods',
    labelAr: 'أجواء الرحلة',
    description: 'اختيار نمط الموسيقى والمحادثة',
    category: 'UX',
  },
  shareTrip: {
    label: 'Share Trip',
    labelAr: 'مشاركة الرحلة',
    description: 'مشاركة حالة الرحلة مع جهات الاتصال',
    category: 'UX',
  },
  loyaltyEnabled: {
    label: 'Loyalty Program',
    labelAr: 'برنامج الولاء',
    description: 'تفعيل نظام HANCR Miles والمستويات',
    category: 'UX',
  },

  sosButton: {
    label: 'SOS Button',
    labelAr: 'زر الطوارئ',
    description: 'زر طوارئ مرئي أثناء الرحلة',
    category: 'Safety',
  },
  numberMasking: {
    label: 'Number Masking',
    labelAr: 'إخفاء الأرقام',
    description: 'إخفاء أرقام الراكب والسائق عند الاتصال',
    category: 'Safety',
  },
  hancrShield: {
    label: 'HANCR Shield',
    labelAr: 'درع HANCR',
    description: 'تأمين على الرحلات للراكب',
    category: 'Safety',
  },

  liveHeatmap: {
    label: 'Live Demand Heatmap',
    labelAr: 'خريطة الطلب المباشرة',
    description: 'عرض مناطق الطلب المرتفع للسائقين',
    category: 'Driver',
  },
  corporatePool: {
    label: 'Corporate Pool',
    labelAr: 'حسابات الشركات',
    description: 'حسابات مشتركة للموظفين',
    category: 'Driver',
  },
};

const CONFIG_KEY = 'global';

export default function FeaturesPage() {
  const t = useT();
  const CATEGORIES: { key: 'Core' | 'AI' | 'UX' | 'Safety' | 'Driver'; icon: React.ElementType; color: string }[] = [
    { key: 'Core',   icon: Sparkles, color: 'text-hancr-violet bg-hancr-violet-light' },
    { key: 'AI',     icon: Brain,    color: 'text-blue-600 bg-blue-100' },
    { key: 'UX',     icon: Smile,    color: 'text-emerald-600 bg-emerald-100' },
    { key: 'Safety', icon: Shield,   color: 'text-rose-600 bg-rose-100' },
    { key: 'Driver', icon: Car,      color: 'text-amber-600 bg-amber-100' },
  ];

  const { data, loading, refetch } = useQuery(GET_APP_CONFIG, {
    variables: { configKey: CONFIG_KEY },
  });
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  const [updateConfig, { loading: saving }] = useMutation(UPDATE_FEATURE_FLAGS, {
    onCompleted: () => {
      toast.success(t('features.savedToast'));
      setIsDirty(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const config = data?.appConfig;

  useEffect(() => {
    if (config?.featureFlags) {
      // Server returns flags as { key: boolean } OR { key: { enabled: boolean } }
      // — handle both shapes gracefully
      const raw = config.featureFlags as Record<string, unknown>;
      const normalized: Record<string, boolean> = {};
      for (const key of Object.keys(raw)) {
        const val = raw[key];
        if (typeof val === 'boolean') normalized[key] = val;
        else if (typeof val === 'object' && val !== null && 'enabled' in val) {
          normalized[key] = Boolean((val as { enabled: boolean }).enabled);
        }
      }
      setFlags(normalized);
    }
  }, [config]);

  const toggle = (key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const save = () => {
    updateConfig({
      variables: {
        configKey: CONFIG_KEY,
        input: { featureFlags: flags },
      },
    });
  };

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(FLAG_META).length;

  return (
    <div>
      <Topbar
        title={t('features.title')}
        subtitle={t('features.subtitle', { enabled: enabledCount, total: totalCount })}
      />

      <div className="p-6 space-y-5">
        {/* ── Action bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500 font-medium">
            {config
              ? <>{t('features.lastUpdated')} <span className="font-bold text-gray-800">{formatDate(config.updatedAt)}</span> · {t('features.version')} <span className="font-mono text-xs">{config.version}</span></>
              : t('common.loading')}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-outline"
              onClick={() => {
                refetch();
                setIsDirty(false);
              }}
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh')}
            </button>
            <button
              className="btn-primary"
              disabled={!isDirty || saving}
              onClick={save}
            >
              <Save className="w-4 h-4" />
              {saving ? t('features.saving') : t('features.save')}
            </button>
          </div>
        </div>

        {/* ── Unsaved changes banner ── */}
        {isDirty && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                {t('features.unsavedTitle')}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t('features.unsavedHint')}
              </p>
            </div>
          </div>
        )}

        {/* ── Categories ── */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
              {t('common.loading')}
            </div>
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const items = Object.entries(FLAG_META).filter(([, m]) => m.category === cat.key);
            if (items.length === 0) return null;
            const Icon = cat.icon;
            const catEnabledCount = items.filter(([k]) => flags[k]).length;

            return (
              <div key={cat.key} className="card p-5">
                {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-base">
                      {t(`features.categories.${cat.key}`)}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 px-2.5 py-1 bg-gray-100 rounded-full">
                    {catEnabledCount}/{items.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {items.map(([key, meta]) => {
                    const isEnabled = flags[key] ?? false;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex-1 min-w-0 pe-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">
                              {meta.labelAr}
                            </p>
                            <span className="text-xs text-gray-400 font-mono">
                              {meta.label}
                            </span>
                            {isEnabled && (
                              <span className="badge badge-green text-[10px]">
                                {t('common.enabled')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>

                        {/* Toggle switch */}
                        <button
                          onClick={() => toggle(key)}
                          aria-pressed={isEnabled}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full
                            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-hancr-violet/30
                            ${isEnabled ? 'bg-hancr-violet shadow-violet' : 'bg-gray-300'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transform
                              ring-0 transition duration-200 mt-0.5 ${
                                isEnabled ? 'translate-x-[1.4rem]' : 'translate-x-0.5'
                              }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Legend */}
        {!loading && (
          <div className="card p-5 bg-gradient-to-br from-hancr-violet-light/30 to-transparent border-hancr-violet-light">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hancr-violet text-white shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-hancr-navy">{t('features.aboutTitle')}</h4>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {t('features.aboutBody')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
