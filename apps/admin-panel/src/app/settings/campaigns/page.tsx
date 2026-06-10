'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Megaphone, Plus, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SDUI_CONFIG,
  UPDATE_OPERATIONS_CONFIG,
  DISPATCH_CAMPAIGNS,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

/**
 * N11 — الحملات المجدولة. تُخزَّن في operationsConfig.campaigns ويُرسلها
 * cron في admin-api تلقائياً في موعدها (أو يدوياً عبر "إرسال المستحق").
 */
type Campaign = {
  id: string;
  title: string;
  body: string;
  target: 'Riders' | 'Drivers' | 'All';
  scheduledAt: string;
  status?: string;
  sentAt?: string;
};

export default function CampaignsPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_OPERATIONS_CONFIG, {
    onCompleted: () => {
      toast.success('تم الحفظ');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [dispatch, { loading: dispatching }] = useMutation(DISPATCH_CAMPAIGNS, {
    onCompleted: (d) => {
      toast.success(`أُرسلت ${d.dispatchDueCampaigns} حملة مستحقّة`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [list, setList] = useState<Campaign[]>([]);
  const [draft, setDraft] = useState<Campaign>({
    id: '',
    title: '',
    body: '',
    target: 'All',
    scheduledAt: '',
  });

  useEffect(() => {
    const ops = (data?.appConfig?.operationsConfig ?? {}) as {
      campaigns?: Campaign[];
    };
    setList(Array.isArray(ops.campaigns) ? ops.campaigns : []);
  }, [data]);

  const persist = (next: Campaign[]) => {
    const ops = {
      ...((data?.appConfig?.operationsConfig ?? {}) as Record<string, unknown>),
    };
    ops.campaigns = next;
    save({ variables: { operationsConfig: ops } });
  };

  const add = () => {
    if (!draft.title.trim() || !draft.scheduledAt) {
      toast.error('العنوان والموعد مطلوبان');
      return;
    }
    const next = [
      ...list,
      { ...draft, id: `c_${list.length}_${draft.scheduledAt}`, status: 'scheduled' },
    ];
    setList(next);
    persist(next);
    setDraft({ id: '', title: '', body: '', target: 'All', scheduledAt: '' });
  };

  const remove = (id: string) => {
    const next = list.filter((c) => c.id !== id);
    setList(next);
    persist(next);
  };

  return (
    <div>
      <Topbar
        title="الحملات المجدولة"
        subtitle="جدوِل إشعارات للركّاب/السائقين تُرسَل تلقائياً في موعدها."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />
        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <>
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 text-gray-900">
                <Megaphone className="w-5 h-5 text-hancr-violet" />
                <h2 className="font-extrabold">حملة جديدة</h2>
              </div>
              <input
                className="input"
                placeholder="العنوان"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <textarea
                className="input"
                rows={2}
                placeholder="النص"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  className="input"
                  value={draft.target}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      target: e.target.value as Campaign['target'],
                    })
                  }
                >
                  <option value="All">الجميع</option>
                  <option value="Riders">الركّاب</option>
                  <option value="Drivers">السائقون</option>
                </select>
                <input
                  className="input"
                  type="datetime-local"
                  value={draft.scheduledAt}
                  onChange={(e) =>
                    setDraft({ ...draft, scheduledAt: e.target.value })
                  }
                />
              </div>
              <button onClick={add} disabled={saving} className="btn-primary">
                <Plus className="w-4 h-4" /> جدولة
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => dispatch()}
                disabled={dispatching}
                className="btn-outline btn-sm"
              >
                <Send className="w-4 h-4" />
                {dispatching ? 'جارٍ…' : 'إرسال المستحق الآن'}
              </button>
            </div>

            <div className="space-y-2">
              {list.length === 0 && (
                <div className="card p-8 text-center text-gray-400">لا حملات</div>
              )}
              {list.map((c) => (
                <div
                  key={c.id}
                  className="card p-4 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">
                      {c.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.target} · {c.scheduledAt?.replace('T', ' ')} ·{' '}
                      <Status s={c.status} />
                    </div>
                  </div>
                  <button onClick={() => remove(c.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Status({ s }: { s?: string }) {
  const map: Record<string, string> = {
    scheduled: 'مجدولة',
    sent: 'أُرسلت',
    failed: 'فشلت',
  };
  const color =
    s === 'sent'
      ? 'text-green-600'
      : s === 'failed'
        ? 'text-red-500'
        : 'text-amber-600';
  return <span className={`font-bold ${color}`}>{map[s ?? 'scheduled'] ?? s}</span>;
}
