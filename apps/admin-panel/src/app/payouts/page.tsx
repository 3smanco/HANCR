'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import {
  Banknote,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  LIST_PAYOUT_SESSIONS,
  ELIGIBLE_DRIVERS,
  CREATE_PAYOUT_SESSION,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Session = Record<string, unknown>;
type Driver = Record<string, unknown>;

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-yellow',
  processing: 'badge-blue',
  completed: 'badge-green',
  partial_failure: 'badge-orange',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'مسودّة',
  processing: 'جارٍ التنفيذ',
  completed: 'مكتملة',
  partial_failure: 'فشل جزئي',
};

export default function PayoutsListPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { data, loading, refetch } = useQuery(LIST_PAYOUT_SESSIONS, {
    pollInterval: 15000,
  });
  const sessions: Session[] = data?.payoutSessions ?? [];

  return (
    <div>
      <Topbar title="جلسات الدفع للسائقين" subtitle={`${sessions.length} جلسة`} />
      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            جلسة جديدة
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : sessions.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Banknote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد جلسات</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الحالة</th>
                  <th>السائقون</th>
                  <th>المبلغ الكلّي</th>
                  <th>المنشأة في</th>
                  <th>تم التنفيذ في</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id as number}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/payouts/${s.id as number}`)}
                  >
                    <td className="font-mono text-gray-400 font-bold">
                      <Link
                        href={`/payouts/${s.id as number}`}
                        className="hover:text-hancr-violet"
                      >
                        #{s.id as number}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[s.status as string] ?? 'badge-gray'}`}
                      >
                        {STATUS_LABEL[s.status as string] ?? (s.status as string)}
                      </span>
                    </td>
                    <td className="font-bold text-gray-800">
                      {s.driverCount as number}
                    </td>
                    <td className="font-extrabold text-gray-900">
                      {Number(s.totalAmount).toFixed(2)} {s.currency as string}
                    </td>
                    <td className="text-gray-400 text-xs">
                      {formatDate(s.createdAt as string)}
                    </td>
                    <td className="text-gray-400 text-xs">
                      {s.completedAt ? formatDate(s.completedAt as string) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <CreateSessionWizard
          onClose={() => setCreating(false)}
          onSuccess={(sessionId) => {
            setCreating(false);
            refetch();
            router.push(`/payouts/${sessionId}`);
          }}
        />
      )}
    </div>
  );
}

function CreateSessionWizard({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (sessionId: number) => void;
}) {
  const { data, loading } = useQuery(ELIGIBLE_DRIVERS, {
    fetchPolicy: 'network-only',
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');
  const [createSession, { loading: saving }] = useMutation(
    CREATE_PAYOUT_SESSION,
    {
      onCompleted: (d) => {
        const id = d?.createPayoutSession?.id as number;
        toast.success(`تم إنشاء جلسة #${id}`);
        onSuccess(id);
      },
      onError: (e) => toast.error(e.message),
    },
  );

  const drivers: Driver[] = data?.eligibleDrivers ?? [];
  const total = drivers
    .filter((d) => selected.has(d.driverId as number))
    .reduce((s, d) => s + Number(d.balance), 0);

  const toggleAll = () => {
    if (selected.size === drivers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(drivers.map((d) => d.driverId as number)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-3xl max-h-[90vh] flex flex-col p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-extrabold text-gray-900 text-lg">
            جلسة دفع جديدة
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-gray-400">جارٍ التحميل…</div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              لا يوجد سائقون مؤهلون للسحب
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  اختر السائقين لإنشاء جلسة دفع. الذين بدون طريقة سحب
                  افتراضية سيُحفَظون في الـ entry بدون method.
                </p>
                <button
                  onClick={toggleAll}
                  className="btn-outline btn-sm"
                >
                  {selected.size === drivers.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </button>
              </div>

              <div className="space-y-2">
                {drivers.map((d) => {
                  const sel = selected.has(d.driverId as number);
                  const hasMethod = !!d.defaultPayoutMethodId;
                  return (
                    <label
                      key={d.driverId as number}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        sel
                          ? 'border-hancr-violet bg-hancr-violet/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleOne(d.driverId as number)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">
                          {d.driverName as string}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{d.phoneNumber as string}</span>
                          {hasMethod ? (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700">
                                {d.defaultMethodSummary as string}
                              </span>
                            </>
                          ) : (
                            <span className="text-orange-600 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              بدون طريقة افتراضية
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="font-extrabold text-gray-900">
                          {Number(d.balance).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {d.currency as string}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-5 space-y-3">
          <div>
            <label className="label">ملاحظة (اختيارية)</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="دفعة شهر…"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">المجموع</div>
              <div className="text-xl font-extrabold text-gray-900">
                {total.toFixed(2)} {drivers[0]?.currency as string ?? ''}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-outline">
                إلغاء
              </button>
              <button
                disabled={saving || selected.size === 0}
                onClick={() =>
                  createSession({
                    variables: {
                      input: {
                        driverIds: Array.from(selected),
                        note: note || undefined,
                      },
                    },
                  })
                }
                className="btn-primary"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving
                  ? 'جارٍ الإنشاء…'
                  : `إنشاء (${selected.size} سائق)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
