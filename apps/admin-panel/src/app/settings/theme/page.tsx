'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Palette, Save, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, UPDATE_THEME_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

/**
 * N2 — Live theme editor. Writes themeConfig consumed by the Flutter apps
 * (N5). Keys mirror the AuroraColors data-class the apps will read.
 */
type ThemeConfig = {
  mode: 'dark' | 'light';
  ember: string;
  emberLight: string;
  emberDeep: string;
  obsidian: string;
  coal: string;
  ash: string;
  gold: string;
  pearl: string;
  success: string;
  danger: string;
  fontFamily: string;
  borderRadius: number;
};

const DEFAULTS: ThemeConfig = {
  mode: 'dark',
  ember: '#FF7A1A',
  emberLight: '#FF9D4D',
  emberDeep: '#E55F00',
  obsidian: '#0A0807',
  coal: '#13100E',
  ash: '#1F1A17',
  gold: '#FFB547',
  pearl: '#FFF5EE',
  success: '#10B981',
  danger: '#FF4D4D',
  fontFamily: 'Cairo',
  borderRadius: 16,
};

const COLOR_FIELDS: Array<{ key: keyof ThemeConfig; label: string }> = [
  { key: 'ember', label: 'اللون الأساسي (Ember)' },
  { key: 'emberLight', label: 'Ember فاتح' },
  { key: 'emberDeep', label: 'Ember غامق' },
  { key: 'gold', label: 'الذهبي (Premium)' },
  { key: 'obsidian', label: 'الخلفية الأعمق' },
  { key: 'coal', label: 'خلفية الأسطح' },
  { key: 'ash', label: 'البطاقات' },
  { key: 'pearl', label: 'النص الرئيسي' },
  { key: 'success', label: 'النجاح' },
  { key: 'danger', label: 'الخطر' },
];

const FONTS = ['Cairo', 'Tajawal', 'Almarai', 'IBM Plex Sans Arabic', 'Inter'];

export default function ThemeSettingsPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_THEME_CONFIG, {
    onCompleted: () => {
      toast.success('تم نشر الثيم — سيظهر في التطبيقات خلال دقيقة');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [t, setT] = useState<ThemeConfig>(DEFAULTS);

  useEffect(() => {
    if (!data) return;
    const remote = (data.appConfig?.themeConfig ?? {}) as Partial<ThemeConfig>;
    setT({ ...DEFAULTS, ...remote });
  }, [data]);

  const isLight = t.mode === 'light';
  const previewBg = isLight ? '#FFFFFF' : t.obsidian;
  const previewCard = isLight ? '#F4F1EE' : t.ash;
  const previewText = isLight ? '#1A1410' : t.pearl;

  return (
    <div>
      <Topbar
        title="محرّر الثيم الحيّ"
        subtitle="غيّر ألوان التطبيق وخطه ونمطه — يُبث للأجهزة دون تحديث المتجر."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            {/* Editor */}
            <div className="card p-6 space-y-5">
              <div className="flex items-center gap-2 text-gray-900">
                <Palette className="w-5 h-5 text-hancr-violet" />
                <h2 className="font-extrabold">الألوان والخط</h2>
              </div>

              {/* Mode */}
              <div>
                <label className="label">الوضع</label>
                <div className="flex gap-2">
                  {(['dark', 'light'] as const).map((m) => (
                    <button key={m} onClick={() => setT({ ...t, mode: m })}
                      className={`btn-sm ${t.mode === m ? 'btn-primary' : 'btn-outline'}`}>
                      {m === 'dark' ? 'داكن' : 'فاتح'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="grid sm:grid-cols-2 gap-3">
                {COLOR_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                      value={t[f.key] as string}
                      onChange={(e) => setT({ ...t, [f.key]: e.target.value })}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-700 truncate">{f.label}</div>
                      <input
                        className="input py-1 text-xs font-mono"
                        value={t[f.key] as string}
                        onChange={(e) => setT({ ...t, [f.key]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Font + radius */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">الخط</label>
                  <select className="input" value={t.fontFamily}
                    onChange={(e) => setT({ ...t, fontFamily: e.target.value })}>
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">نصف قطر الحواف ({t.borderRadius}px)</label>
                  <input type="range" min={0} max={28} step={2} className="w-full"
                    value={t.borderRadius}
                    onChange={(e) => setT({ ...t, borderRadius: Number(e.target.value) })} />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <button onClick={() => save({ variables: { themeConfig: t } })}
                  disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? 'جارٍ النشر…' : 'نشر الثيم'}
                </button>
                <button onClick={() => setT(DEFAULTS)} className="btn-outline btn-sm">
                  استعادة الافتراضي
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="card p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <Smartphone className="w-4 h-4" /> معاينة
              </div>
              <div
                className="rounded-[28px] border-4 border-gray-800 overflow-hidden shadow-xl"
                style={{ background: previewBg, fontFamily: t.fontFamily }}
              >
                <div className="p-4 space-y-3" dir="rtl">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 grid place-items-center font-extrabold text-white"
                      style={{ background: t.ember, borderRadius: t.borderRadius }}>H</div>
                    <span className="font-extrabold" style={{ color: previewText }}>HANCR</span>
                  </div>
                  <div className="p-3" style={{ background: previewCard, borderRadius: t.borderRadius }}>
                    <div className="text-sm font-bold" style={{ color: previewText }}>رحلتك القادمة</div>
                    <div className="text-xs mt-1" style={{ color: isLight ? '#857B72' : '#A89B96' }}>
                      من المنزل إلى العمل
                    </div>
                  </div>
                  <button className="w-full py-2.5 font-bold text-white text-sm"
                    style={{ background: t.ember, borderRadius: t.borderRadius }}>
                    احجز الآن
                  </button>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-1 font-bold text-white"
                      style={{ background: t.success, borderRadius: t.borderRadius / 2 }}>متاح</span>
                    <span className="text-[10px] px-2 py-1 font-bold"
                      style={{ background: t.gold, color: '#1A1410', borderRadius: t.borderRadius / 2 }}>ذهبي</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                معاينة تقريبية. التطبيق يطبّق الثيم بالكامل.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
