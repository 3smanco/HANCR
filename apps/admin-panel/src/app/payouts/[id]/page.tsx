'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PAYOUT_SESSION_DETAIL,
  PROCESS_PAYOUT_SESSION,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Entry = Record<string, unknown>;

const ENTRY_BADGE: Record<string, string> = {
  pending: 'badge-yellow',
  processing: 'badge-blue',
  completed: 'badge-green',
  failed: 'badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'مسودّة',
  processing: 'جارٍ التنفيذ',
  completed: 'مكتملة',
  partial_failure: 'فشل جزئي',
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-yellow',
  processing: 'badge-blue',
  completed: 'badge-green',
  partial_failure: 'badge-orange',
};

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [confirming, setConfirming] = useState(false);

  const { data, loading, refetch } = useQuery(PAYOUT_SESSION_DETAIL, {
    variables: { id },
    skip: !Number.isFinite(id),
  });
  const [process, { loading: processing }] = useMutation(
    PROCESS_PAYOUT_SESSION,
    {
      onCompleted: () => {
        toast.success('تم تنفيذ الجلسة');
        setConfirming(false);
        refetch();
      },
      onError: (e) => toast.error(e.message),
    },
  );

  if (loading) {
    return (
      <div className="p-6">
        <Topbar title="جارٍ التحميل…" />
      </div>
    );
  }

  const s = data?.payoutSession;
  if (!s) {
    return (
      <div className="p-6">
        <Topbar title="جلسة غير موجودة" />
      </div>
    );
  }

  const entries: Entry[] = s.entries ?? [];
  const isDraft = s.status === 'draft';

  return (
    <div>
      <Topbar
        title={`جلسة دفع #${s.id}`}
        subtitle={`${s.driverCount} سائق · ${Number(s.totalAmount).toFixed(2)} ${s.currency}`}
      />
      <div className="p-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="btn-outline btn-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500">الحالة</div>
              <span className={`badge mt-1 ${STATUS_BADGE[s.status] ?? 'badge-gray'}`}>
                {STATUS_LABEL[s.status] ?? s.status}
              </span>
            </div>
            <div className="text-end">
              <div className="text-xs text-gray-500">المجموع</div>
              <div className="text-2xl font-extrabold text-gray-900">
                {Number(s.totalAmount).toFixed(2)} {s.currency}
              </div>
            </div>
          </div>

          {s.note ? (
            <div className="text-sm text-gray-600 pt-3 border-t border-gray-100">
              {s.note as string}
            </div>
          ) : null}

          <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
            <span>أُنشئت {formatDate(s.createdAt as string)}</span>
            {s.completedAt ? (
              <>
                <span>·</span>
                <span>نُفذت {formatDate(s.completedAt as string)}</span>
              </>
            ) : null}
            <span>·</span>
            <span>{s.mode === 'auto' ? 'تلقائي' : 'يدوي'}</span>
          </div>

          {isDraft && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setConfirming(true)}
                className="btn-primary w-full"
              >
                <Play className="w-4 h-4" />
                تنفيذ الجلسة (خصم من المحافظ)
              </button>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th>السائق</th>
                <th>الطريقة</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>الإشعار</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id as number}>
                  <td>
                    <div className="font-bold text-gray-900">
                      {(e.driverName as string) ?? `سائق #${e.driverId as number}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      #{e.driverId as number}
                      {e.driverPhone ? (
                        <>
                          {' · '}
                          <span dir="ltr">{e.driverPhone as string}</span>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-sm">
                    {e.methodSummary ? (
                      <span className="text-gray-700">
                        {e.methodSummary as string}
                      </span>
                    ) : (
                      <span className="text-orange-600 inline-flex items-center gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        بدون طريقة
                      </span>
                    )}
                  </td>
                  <td className="font-extrabold text-gray-900">
                    {Number(e.amount).toFixed(2)} {s.currency}
                  </td>
                  <td>
                    <span
                      className={`badge ${ENTRY_BADGE[e.status as string] ?? 'badge-gray'} inline-flex items-center gap-1`}
                    >
                      {e.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : e.status === 'failed' ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {e.status as string}
                    </span>
                  </td>
                  <td className="text-xs">
                    {e.errorMessage ? (
                      <span className="text-red-600">
                        {e.errorMessage as string}
                      </span>
                    ) : e.completedAt ? (
                      <span className="text-gray-400">
                        {formatDate(e.completedAt as string)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          loading={processing}
          total={Number(s.totalAmount)}
          currency={s.currency as string}
          count={s.driverCount as number}
          onCancel={() => setConfirming(false)}
          onConfirm={() => process({ variables: { id: s.id } })}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  loading,
  total,
  currency,
  count,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  total: number;
  currency: string;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="card-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="font-extrabold text-gray-900 text-lg">
            تأكيد التنفيذ
          </h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          سيُخصَم{' '}
          <strong>
            {total.toFixed(2)} {currency}
          </strong>{' '}
          من محافظ {count} سائق ويُسجَّل كـ DriverWithdrawal. لا يمكن التراجع.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="btn-primary flex-1"
          >
            {loading ? 'جارٍ…' : 'تأكيد التنفيذ'}
          </button>
        </div>
      </div>
    </div>
  );
}
