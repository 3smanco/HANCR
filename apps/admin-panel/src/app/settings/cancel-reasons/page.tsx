'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { XCircle, Plus, Trash2, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CANCEL_REASONS,
  UPSERT_CANCEL_REASON,
  DELETE_CANCEL_REASON,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type Reason = Record<string, unknown>;

const APPLIES_LABEL: Record<string, string> = {
  rider: 'الراكب',
  driver: 'السائق',
  both: 'الاثنان',
};

export default function CancelReasonsPage() {
  const [editing, setEditing] = useState<Reason | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(CANCEL_REASONS);
  const [upsert, { loading: saving }] = useMutation(UPSERT_CANCEL_REASON, {
    onCompleted: () => {
      toast.success('تم الحفظ');
      setEditing(null);
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [del] = useMutation(DELETE_CANCEL_REASON, {
    onCompleted: () => {
      toast.success('تم الحذف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const all: Reason[] = data?.cancelReasons ?? [];
  const byTarget = {
    rider: all.filter((r) => r.appliesTo === 'rider'),
    driver: all.filter((r) => r.appliesTo === 'driver'),
    both: all.filter((r) => r.appliesTo === 'both'),
  };

  return (
    <div>
      <Topbar title="أسباب الإلغاء" subtitle={`${all.length} سبب`} />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            إضافة سبب
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : all.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد أسباب</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['rider', 'driver', 'both'] as const).map((target) => (
              <div key={target} className="card overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {APPLIES_LABEL[target]} ({byTarget[target].length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {byTarget[target].length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 text-center">
                      لا توجد
                    </div>
                  ) : (
                    byTarget[target].map((r) => (
                      <div
                        key={r.id as number}
                        className={`p-3 flex items-start gap-2 ${!r.active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm">
                            {r.labelAr as string}
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.labelEn as string}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            {r.code as string} · #{r.sortOrder as number}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setEditing(r)}
                            className="btn-icon"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`حذف "${r.labelAr}"؟`))
                                del({ variables: { id: r.id } });
                            }}
                            className="btn-icon text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <UpsertModal
          initial={editing}
          isParam={false}
          saving={saving}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(input) => upsert({ variables: { input } })}
        />
      )}
    </div>
  );
}

function UpsertModal({
  initial,
  isParam,
  saving,
  onClose,
  onSave,
}: {
  initial: Reason | null;
  isParam: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [code, setCode] = useState((initial?.code as string) ?? '');
  const [labelAr, setLabelAr] = useState((initial?.labelAr as string) ?? '');
  const [labelEn, setLabelEn] = useState((initial?.labelEn as string) ?? '');
  const [appliesTo, setAppliesTo] = useState(
    ((initial?.appliesTo as string) ?? (initial?.target as string)) ??
      (isParam ? 'driver' : 'rider'),
  );
  const [sortOrder, setSortOrder] = useState(
    String((initial?.sortOrder as number) ?? 0),
  );
  const [active, setActive] = useState((initial?.active as boolean) ?? true);

  const options = isParam
    ? [
        { value: 'driver', label: 'تقييم السائق' },
        { value: 'rider', label: 'تقييم الراكب' },
      ]
    : [
        { value: 'rider', label: 'الراكب' },
        { value: 'driver', label: 'السائق' },
        { value: 'both', label: 'الاثنان' },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">
            {initial ? 'تعديل' : 'إضافة'} {isParam ? 'معيار' : 'سبب'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">الكود (يستخدم في الـ API)</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!!initial}
            />
          </div>
          <div>
            <label className="label">بالعربية</label>
            <input
              className="input"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
            />
          </div>
          <div>
            <label className="label">بالإنجليزية</label>
            <input
              className="input"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{isParam ? 'الهدف' : 'يظهر لـ'}</label>
            <select
              className="input"
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الترتيب</label>
            <input
              type="number"
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>نشط</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={saving || !code || !labelAr || !labelEn}
            onClick={() => {
              const base = {
                id: initial?.id,
                code: code.trim(),
                labelAr: labelAr.trim(),
                labelEn: labelEn.trim(),
                sortOrder: Number(sortOrder) || 0,
                active,
              };
              const payload = isParam
                ? { ...base, target: appliesTo }
                : { ...base, appliesTo };
              onSave(payload);
            }}
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ…' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
