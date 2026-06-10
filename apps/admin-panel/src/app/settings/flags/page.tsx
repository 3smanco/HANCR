'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { FlaskConical, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, UPDATE_FEATURE_FLAGS } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

/**
 * N11 — محرّر أعلام الميزات و A/B. يكتب featureFlags المقروء من التطبيقات.
 */
type Flag = {
  enabled: boolean;
  rolloutPercent: number;
  variants: string[];
  note?: string;
};
type Flags = Record<string, Flag>;

export default function FlagsPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_FEATURE_FLAGS, {
    onCompleted: () => {
      toast.success('تم حفظ الأعلام — تُبثّ للتطبيقات');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [flags, setFlags] = useState<Flags>({});
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (!data) return;
    setFlags((data.appConfig?.featureFlags ?? {}) as Flags);
  }, [data]);

  const upd = (k: string, patch: Partial<Flag>) =>
    setFlags((f) => ({ ...f, [k]: { ...f[k], ...patch } }));
  const add = () => {
    const k = newKey.trim();
    if (!k || flags[k]) return;
    setFlags((f) => ({
      ...f,
      [k]: { enabled: false, rolloutPercent: 100, variants: [] },
    }));
    setNewKey('');
  };
  const remove = (k: string) =>
    setFlags((f) => {
      const c = { ...f };
      delete c[k];
      return c;
    });

  return (
    <div>
      <Topbar
        title="أعلام الميزات و A/B"
        subtitle="فعّل/عطّل الميزات وتحكّم بنسبة الإطلاق التدريجي والمتغيّرات."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />
        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <div className="space-y-4">
            <div className="card p-4 flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="مفتاح علم جديد (مثال: bid_mode)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <button onClick={add} className="btn-outline btn-sm">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>

            {Object.keys(flags).length === 0 && (
              <div className="card p-8 text-center text-gray-400">لا أعلام بعد</div>
            )}

            {Object.entries(flags).map(([k, f]) => (
              <div key={k} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-hancr-violet" />
                    {k}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-bold">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        onChange={(e) => upd(k, { enabled: e.target.checked })}
                      />
                      مُفعَّل
                    </label>
                    <button onClick={() => remove(k)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      نسبة الإطلاق ({f.rolloutPercent ?? 100}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                      value={f.rolloutPercent ?? 100}
                      onChange={(e) =>
                        upd(k, { rolloutPercent: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">متغيّرات A/B (مفصولة بفاصلة)</label>
                    <input
                      className="input"
                      placeholder="control, variant_a"
                      value={(f.variants ?? []).join(', ')}
                      onChange={(e) =>
                        upd(k, {
                          variants: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                save({
                  variables: {
                    configKey: 'main',
                    input: { featureFlags: flags },
                  },
                })
              }
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جارٍ الحفظ…' : 'حفظ الأعلام'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
