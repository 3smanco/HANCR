'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  Power,
  PowerOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_ANNOUNCEMENTS,
  CREATE_ANNOUNCEMENT,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';
import { MarketingTabs } from '../_MarketingTabs';

const TARGET_LABEL: Record<string, string> = {
  all: 'الجميع',
  rider: 'الركاب فقط',
  driver: 'السائقون فقط',
};

type Ann = Record<string, unknown>;

export default function AnnouncementsPage() {
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(LIST_ANNOUNCEMENTS);
  const [createAnn, { loading: saving }] = useMutation(CREATE_ANNOUNCEMENT, {
    onCompleted: () => {
      toast.success('تم النشر');
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [updateAnn] = useMutation(UPDATE_ANNOUNCEMENT, {
    onCompleted: () => refetch(),
    onError: (e) => toast.error(e.message),
  });
  const [deleteAnn] = useMutation(DELETE_ANNOUNCEMENT, {
    onCompleted: () => {
      toast.success('تم الحذف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const items: Ann[] = data?.adminAnnouncements ?? [];

  return (
    <div>
      <Topbar title="الإعلانات" subtitle={`${items.length} إعلان`} />
      <div className="p-6 space-y-5">
        <MarketingTabs />

        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            إعلان جديد
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد إعلانات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((a) => {
              const active = a.active as boolean;
              const inWindow = isInWindow(a.startsAt as string, a.endsAt as string | undefined);
              return (
                <div
                  key={a.id as number}
                  className={`card p-4 ${!active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-extrabold text-gray-900 truncate flex-1">
                      {a.title as string}
                    </h3>
                    <span className={`badge ${active && inWindow ? 'badge-green' : 'badge-gray'}`}>
                      {active && inWindow ? 'نشط' : !active ? 'موقوف' : 'خارج النافذة'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {a.body as string}
                  </p>
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-3 flex-wrap">
                    <span>{TARGET_LABEL[a.target as string] ?? (a.target as string)}</span>
                    <span>·</span>
                    <span>من {formatDate(a.startsAt as string)}</span>
                    {a.endsAt ? (
                      <>
                        <span>·</span>
                        <span>حتى {formatDate(a.endsAt as string)}</span>
                      </>
                    ) : null}
                  </div>
                  {a.url ? (
                    <a
                      href={a.url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-hancr-violet hover:underline mt-2 inline-block truncate max-w-full"
                    >
                      {a.url as string}
                    </a>
                  ) : null}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() =>
                        updateAnn({
                          variables: {
                            input: { id: a.id, active: !active },
                          },
                        })
                      }
                      className="btn-sm btn-outline flex-1"
                    >
                      {active ? (
                        <>
                          <PowerOff className="w-3 h-3" />
                          إيقاف
                        </>
                      ) : (
                        <>
                          <Power className="w-3 h-3" />
                          تفعيل
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف الإعلان "${a.title}"؟`))
                          deleteAnn({ variables: { id: a.id } });
                      }}
                      className="btn-sm btn-outline text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createAnn({ variables: { input } })}
        />
      )}
    </div>
  );
}

function isInWindow(startsAt: string, endsAt?: string): boolean {
  const now = new Date();
  const start = new Date(startsAt);
  if (start > now) return false;
  if (endsAt && new Date(endsAt) < now) return false;
  return true;
}

function CreateModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [url, setUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">إعلان جديد</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">العنوان</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">النص</label>
            <textarea
              className="input"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="label">الجمهور</label>
            <select
              className="input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {Object.entries(TARGET_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">رابط (اختياري)</label>
            <input
              className="input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">يبدأ من</label>
              <input
                className="input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="label">ينتهي (اختياري)</label>
              <input
                className="input"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={saving || title.length < 3 || body.length < 5}
            onClick={() =>
              onSave({
                title,
                body,
                target,
                url: url || undefined,
                startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
                endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
              })
            }
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ النشر…' : 'نشر'}
          </button>
        </div>
      </div>
    </div>
  );
}
