'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Star, Plus, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  REVIEW_PARAMETERS,
  UPSERT_REVIEW_PARAMETER,
  DELETE_REVIEW_PARAMETER,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';
import { UpsertReasonModal } from '../_UpsertReasonModal';

type Param = Record<string, unknown>;

const TARGET_LABEL: Record<string, string> = {
  driver: 'تقييم السائق',
  rider: 'تقييم الراكب',
};

export default function ReviewParamsPage() {
  const [editing, setEditing] = useState<Param | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(REVIEW_PARAMETERS);
  const [upsert, { loading: saving }] = useMutation(
    UPSERT_REVIEW_PARAMETER,
    {
      onCompleted: () => {
        toast.success('تم الحفظ');
        setEditing(null);
        setCreating(false);
        refetch();
      },
      onError: (e) => toast.error(e.message),
    },
  );
  const [del] = useMutation(DELETE_REVIEW_PARAMETER, {
    onCompleted: () => {
      toast.success('تم الحذف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const all: Param[] = data?.reviewParameters ?? [];
  const byTarget = {
    driver: all.filter((p) => p.target === 'driver'),
    rider: all.filter((p) => p.target === 'rider'),
  };

  return (
    <div>
      <Topbar title="معايير التقييم" subtitle={`${all.length} معيار`} />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            إضافة معيار
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : all.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد معايير</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['driver', 'rider'] as const).map((target) => (
              <div key={target} className="card overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <h3 className="font-bold text-gray-900 text-sm inline-flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    {TARGET_LABEL[target]} ({byTarget[target].length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {byTarget[target].length === 0 ? (
                    <div className="p-4 text-xs text-gray-400 text-center">
                      لا توجد
                    </div>
                  ) : (
                    byTarget[target].map((p) => (
                      <div
                        key={p.id as number}
                        className={`p-3 flex items-start gap-2 ${!p.active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm">
                            {p.labelAr as string}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.labelEn as string}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            {p.code as string} · #{p.sortOrder as number}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setEditing(p)}
                            className="btn-icon"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`حذف "${p.labelAr}"؟`))
                                del({ variables: { id: p.id } });
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
        <UpsertReasonModal
          initial={editing}
          isParam={true}
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
