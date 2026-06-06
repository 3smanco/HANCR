'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { LayoutGrid, Save, ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, UPDATE_HOME_LAYOUT_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type ServiceTile = {
  serviceId: number;
  label: string;
  icon: string;
  visible: boolean;
};

type HomeConfig = {
  welcomeMessage: { ar: string; en: string };
  servicesGrid: ServiceTile[];
  heroEnabled: boolean;
};

const DEFAULTS: HomeConfig = {
  welcomeMessage: { ar: 'أهلاً بك في HANCR', en: 'Welcome to HANCR' },
  servicesGrid: [],
  heroEnabled: true,
};

// Icon options the Flutter app knows how to render (Material icon names).
const ICONS = ['directions_car', 'local_taxi', 'two_wheeler', 'local_shipping', 'flight', 'shopping_bag', 'groups', 'school', 'medical_services', 'star'];

export default function HomeLayoutPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_HOME_LAYOUT_CONFIG, {
    onCompleted: () => {
      toast.success('تم نشر تخطيط الشاشة الرئيسية');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [cfg, setCfg] = useState<HomeConfig>(DEFAULTS);

  useEffect(() => {
    if (!data) return;
    const remote = (data.appConfig?.homeScreenConfig ?? {}) as Partial<HomeConfig>;
    setCfg({
      welcomeMessage: { ...DEFAULTS.welcomeMessage, ...(remote.welcomeMessage ?? {}) },
      servicesGrid: Array.isArray(remote.servicesGrid) ? remote.servicesGrid : [],
      heroEnabled: remote.heroEnabled ?? true,
    });
  }, [data]);

  const move = (i: number, dir: -1 | 1) => {
    setCfg((c) => {
      const arr = [...c.servicesGrid];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return c;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...c, servicesGrid: arr };
    });
  };
  const update = (i: number, patch: Partial<ServiceTile>) =>
    setCfg((c) => ({ ...c, servicesGrid: c.servicesGrid.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
  const remove = (i: number) =>
    setCfg((c) => ({ ...c, servicesGrid: c.servicesGrid.filter((_, idx) => idx !== i) }));
  const add = () =>
    setCfg((c) => ({
      ...c,
      servicesGrid: [...c.servicesGrid, { serviceId: 0, label: 'خدمة جديدة', icon: 'directions_car', visible: true }],
    }));

  return (
    <div>
      <Topbar
        title="تخطيط الشاشة الرئيسية"
        subtitle="ترتيب شبكة الخدمات، إظهار/إخفاء، رسالة الترحيب — يُبث للتطبيق."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <div className="space-y-5 max-w-2xl">
            {/* Welcome */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-900">
                <LayoutGrid className="w-5 h-5 text-hancr-violet" />
                <h2 className="font-extrabold">رسالة الترحيب</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">عربي</label>
                  <input className="input" value={cfg.welcomeMessage.ar}
                    onChange={(e) => setCfg({ ...cfg, welcomeMessage: { ...cfg.welcomeMessage, ar: e.target.value } })} />
                </div>
                <div>
                  <label className="label">English</label>
                  <input className="input" value={cfg.welcomeMessage.en}
                    onChange={(e) => setCfg({ ...cfg, welcomeMessage: { ...cfg.welcomeMessage, en: e.target.value } })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cfg.heroEnabled}
                  onChange={(e) => setCfg({ ...cfg, heroEnabled: e.target.checked })} />
                <span>إظهار قسم الـ Hero أعلى الشاشة</span>
              </label>
            </div>

            {/* Services grid */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-gray-900">شبكة الخدمات</h2>
                <button onClick={add} className="btn-outline btn-sm">
                  <Plus className="w-3.5 h-3.5" /> خدمة
                </button>
              </div>
              {cfg.servicesGrid.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  لا خدمات مُخصَّصة — التطبيق يعرض كل الخدمات النشطة افتراضياً.
                </p>
              ) : (
                <div className="space-y-2">
                  {cfg.servicesGrid.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                      <div className="flex flex-col">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="btn-icon h-6 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => move(i, 1)} disabled={i === cfg.servicesGrid.length - 1} className="btn-icon h-6 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                      </div>
                      <input type="number" className="input w-16" placeholder="ID" value={t.serviceId}
                        onChange={(e) => update(i, { serviceId: Number(e.target.value) })} />
                      <input className="input flex-1" placeholder="الاسم" value={t.label}
                        onChange={(e) => update(i, { label: e.target.value })} />
                      <select className="input w-36" value={t.icon} onChange={(e) => update(i, { icon: e.target.value })}>
                        {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                      <button onClick={() => update(i, { visible: !t.visible })}
                        className={`btn-icon ${t.visible ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {t.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => remove(i)} className="btn-icon text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => save({ variables: { homeScreenConfig: cfg } })}
              disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" />
              {saving ? 'جارٍ النشر…' : 'نشر التخطيط'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
