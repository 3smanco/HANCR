'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { GET_APP_CONFIG, UPDATE_APP_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { useT } from '@/i18n/LocaleProvider';

const CONFIG_KEY = 'main';

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  order: number;
}

export default function BannersPage() {
  const t = useT();
  const [banners, setBanners] = useState<Banner[]>([]);

  const { data, loading } = useQuery(GET_APP_CONFIG, {
    variables: { configKey: CONFIG_KEY },
  });
  const home = data?.appConfig?.homeScreenConfig as
    | { banners?: Banner[] }
    | undefined;

  useEffect(() => {
    if (home?.banners) {
      setBanners(
        [...home.banners]
          .map((b, i) => ({ ...b, active: b.active ?? true, order: b.order ?? i }))
          .sort((a, b) => a.order - b.order),
      );
    }
  }, [home]);

  const [save, { loading: saving }] = useMutation(UPDATE_APP_CONFIG, {
    onCompleted: () => toast.success('تم حفظ البانرات'),
    onError: (e) => toast.error(e.message),
  });

  const persist = (list: Banner[]) => {
    const reindexed = list.map((b, i) => ({ ...b, order: i }));
    save({
      variables: {
        configKey: CONFIG_KEY,
        input: { homeScreenConfig: { ...(home ?? {}), banners: reindexed } },
      },
    });
  };

  const addBanner = () =>
    setBanners((b) => [
      ...b,
      {
        id: `b${Date.now()}`,
        imageUrl: '',
        title: '',
        subtitle: '',
        link: '',
        active: true,
        order: b.length,
      },
    ]);

  const update = (i: number, patch: Partial<Banner>) =>
    setBanners((b) => b.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const remove = (i: number) =>
    setBanners((b) => b.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) =>
    setBanners((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const copy = [...b];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div>
      <Topbar
        title={t('nav.banners')}
        subtitle={t('bannersPage.subtitle')}
      />
      <div className="p-6 max-w-3xl space-y-4">
        <div className="flex justify-between">
          <button onClick={addBanner} className="btn-outline">
            <Plus className="w-4 h-4" />
            بانر جديد
          </button>
          <button
            onClick={() => persist(banners)}
            disabled={saving}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جارٍ الحفظ…' : 'حفظ ونشر'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">جارٍ التحميل…</div>
        ) : banners.length === 0 ? (
          <div className="card p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-bold text-lg">لا توجد بانرات</p>
            <p className="text-sm text-gray-500 mt-2">
              أضف بانراً ليظهر في رئيسية الراكب
            </p>
          </div>
        ) : (
          banners.map((b, i) => (
            <div key={b.id} className="card p-4">
              <div className="flex gap-4">
                <div className="w-28 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {b.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.imageUrl}
                      alt={b.title ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    className="input"
                    placeholder="رابط الصورة (https://…)"
                    value={b.imageUrl}
                    onChange={(e) => update(i, { imageUrl: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="العنوان"
                      value={b.title ?? ''}
                      onChange={(e) => update(i, { title: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="الوجهة (اختياري)"
                      value={b.link ?? ''}
                      onChange={(e) => update(i, { link: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={b.active}
                        onChange={(e) => update(i, { active: e.target.checked })}
                      />
                      مفعّل
                    </label>
                    <div className="flex gap-1 ms-auto">
                      <button onClick={() => move(i, -1)} className="btn-icon" disabled={i === 0}>
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => move(i, 1)} className="btn-icon" disabled={i === banners.length - 1}>
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(i)} className="btn-icon text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
