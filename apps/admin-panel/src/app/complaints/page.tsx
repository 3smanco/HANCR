'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  DollarSign,
  Route,
  Sparkles,
  UserCheck,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_COMPLAINTS,
  COMPLAINT_DETAIL,
  UPDATE_COMPLAINT_STATUS,
  ADD_COMPLAINT_NOTE,
  REFUND_COMPLAINT,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Complaint = Record<string, unknown>;
type Activity = Record<string, unknown>;

const CATEGORY_META: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  safety: { label: 'سلامة', icon: Shield, color: 'text-red-600 bg-red-50' },
  fare: { label: 'أجرة', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  route: { label: 'مسار', icon: Route, color: 'text-blue-600 bg-blue-50' },
  cleanliness: {
    label: 'نظافة',
    icon: Sparkles,
    color: 'text-emerald-600 bg-emerald-50',
  },
  behavior: { label: 'سلوك', icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
  other: { label: 'أخرى', icon: HelpCircle, color: 'text-gray-600 bg-gray-50' },
};

const STATUS_META: Record<string, { label: string; badge: string }> = {
  submitted: { label: 'جديدة', badge: 'badge-yellow' },
  under_review: { label: 'قيد المراجعة', badge: 'badge-blue' },
  resolved: { label: 'محلولة', badge: 'badge-green' },
  dismissed: { label: 'مرفوضة', badge: 'badge-gray' },
};

export default function ComplaintsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const limit = 20;

  const { data, loading, refetch } = useQuery(LIST_COMPLAINTS, {
    variables: { page, limit, status: statusFilter ?? undefined },
    pollInterval: 30000,
  });

  const items: Complaint[] = data?.adminComplaints?.items ?? [];
  const total = data?.adminComplaints?.total ?? 0;
  const submittedCount = data?.adminComplaints?.submittedCount ?? 0;
  const underReviewCount = data?.adminComplaints?.underReviewCount ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="صندوق الشكاوى"
        subtitle={`${submittedCount} جديدة · ${underReviewCount} قيد المراجعة`}
      />

      <div className="p-6 space-y-5">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatusFilter(null);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              !statusFilter
                ? 'bg-hancr-violet text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل ({total})
          </button>
          {Object.entries(STATUS_META).map(([key, m]) => (
            <button
              key={key}
              onClick={() => {
                setStatusFilter(key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                statusFilter === key
                  ? 'bg-hancr-violet text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="card p-12 text-center text-gray-400">
            جارٍ التحميل…
          </div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد شكاوى</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const cat = CATEGORY_META[c.category as string] ?? CATEGORY_META.other;
              const status = STATUS_META[c.status as string] ?? STATUS_META.submitted;
              const CatIcon = cat.icon;
              return (
                <button
                  key={c.id as number}
                  onClick={() => setSelectedId(c.id as number)}
                  className="w-full text-start card p-4 hover:border-hancr-violet/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${cat.color}`}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">
                          {cat.label} · #{c.id as number}
                        </span>
                        <span className={`badge ${status.badge} text-[10px]`}>
                          {status.label}
                        </span>
                        {c.orderId ? (
                          <span className="text-xs text-gray-400">
                            · طلب #{c.orderId as number}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {c.description as string}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                        <span>
                          {(c.reportedByType as string) === 'rider' ? 'راكب' : 'سائق'}
                          {' '}
                          {(c.reporterName as string) ?? `#${c.reportedById as number}`}
                        </span>
                        <span>·</span>
                        <span>{formatDate(c.createdAt as string)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {items.length} من {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="btn-icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-4 py-1.5 text-sm font-bold text-gray-700 bg-gray-50 rounded-lg">
                {page} / {pages}
              </span>
              <button
                className="btn-icon"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedId !== null && (
        <ComplaintDetailDrawer
          id={selectedId}
          onClose={() => {
            setSelectedId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ComplaintDetailDrawer({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const { data, loading, refetch } = useQuery(COMPLAINT_DETAIL, {
    variables: { id },
    fetchPolicy: 'network-only',
  });
  const [updateStatus, { loading: updating }] = useMutation(
    UPDATE_COMPLAINT_STATUS,
    {
      onCompleted: () => {
        toast.success('تم تحديث الحالة');
        refetch();
      },
      onError: (e) => toast.error(e.message),
    },
  );
  const [addNote, { loading: addingNote }] = useMutation(ADD_COMPLAINT_NOTE, {
    onCompleted: () => {
      toast.success('تمت إضافة الملاحظة');
      setNote('');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [refund, { loading: refunding }] = useMutation(REFUND_COMPLAINT, {
    onCompleted: () => {
      toast.success('تم تنفيذ الإجراء المالي');
      setRefundAmount('');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [note, setNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/50"
        onClick={onClose}
      >
        <div className="bg-white w-full sm:w-[640px] h-full p-8 text-center">
          جارٍ التحميل…
        </div>
      </div>
    );
  }

  const c = data?.adminComplaintDetail;
  if (!c) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/50"
        onClick={onClose}
      >
        <div className="bg-white w-full sm:w-[640px] h-full p-8 text-center">
          شكوى غير موجودة
        </div>
      </div>
    );
  }

  const cat = CATEGORY_META[c.category] ?? CATEGORY_META.other;
  const status = STATUS_META[c.status] ?? STATUS_META.submitted;
  const CatIcon = cat.icon;
  const isOpen = c.status === 'submitted' || c.status === 'under_review';
  const activities: Activity[] = c.activities ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:w-[640px] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cat.color}`}>
              <CatIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">شكوى #{c.id}</div>
              <h2 className="font-extrabold text-gray-900 text-lg">
                {cat.label}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Header info */}
          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`badge ${status.badge}`}>{status.label}</span>
              <span className="text-xs text-gray-400">
                {formatDate(c.createdAt)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              من{' '}
              {c.reportedByType === 'rider' ? 'راكب' : 'سائق'}
              {' · '}
              {c.reporterName ?? `#${c.reportedById}`}
              {c.orderId ? (
                <>
                  {' · '}
                  <Link
                    href={`/orders/${c.orderId}`}
                    className="text-hancr-violet hover:underline"
                  >
                    طلب #{c.orderId}
                  </Link>
                </>
              ) : null}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {c.description}
              </p>
            </div>
            {c.resolutionNote ? (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">ملاحظة الحل</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {c.resolutionNote}
                </p>
              </div>
            ) : null}
          </div>

          {/* Status actions */}
          {isOpen && (
            <div className="card p-4 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">تحديث الحالة</h3>
              {c.status === 'submitted' && (
                <button
                  disabled={updating}
                  onClick={() =>
                    updateStatus({
                      variables: {
                        input: { complaintId: c.id, status: 'under_review' },
                      },
                    })
                  }
                  className="btn-outline btn-sm w-full"
                >
                  <Clock className="w-3.5 h-3.5" />
                  بدء المراجعة
                </button>
              )}
              <div>
                <label className="label">ملاحظة الحل (اختيارية)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="ماذا تم؟"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={updating}
                  onClick={() =>
                    updateStatus({
                      variables: {
                        input: {
                          complaintId: c.id,
                          status: 'resolved',
                          resolutionNote: resolutionNote || undefined,
                        },
                      },
                    })
                  }
                  className="btn-sm btn-success"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  حُلَّت
                </button>
                <button
                  disabled={updating}
                  onClick={() =>
                    updateStatus({
                      variables: {
                        input: {
                          complaintId: c.id,
                          status: 'dismissed',
                          resolutionNote: resolutionNote || undefined,
                        },
                      },
                    })
                  }
                  className="btn-sm btn-outline text-red-600"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  رفض
                </button>
              </div>
            </div>
          )}

          {/* SLA + الإجراءات المالية */}
          {c.dueAt && c.status !== 'resolved' && c.status !== 'dismissed' && (
            <div
              className={`card p-3 text-sm font-semibold ${
                new Date(c.dueAt as string).getTime() < Date.now()
                  ? 'text-red-600 bg-red-50'
                  : 'text-amber-700 bg-amber-50'
              }`}
            >
              {new Date(c.dueAt as string).getTime() < Date.now()
                ? '⚠️ تجاوزت مهلة الرد (SLA)'
                : `⏱ مهلة الرد حتى ${new Date(c.dueAt as string).toLocaleString('ar')}`}
            </div>
          )}
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">إجراء مالي للمُبلِّغ</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="المبلغ"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button
                disabled={refunding || !refundAmount}
                onClick={() =>
                  refund({
                    variables: {
                      complaintId: c.id,
                      amount: parseFloat(refundAmount),
                      voucher: false,
                    },
                  })
                }
                className="btn-sm bg-emerald-600 text-white disabled:opacity-50"
              >
                رد أموال
              </button>
              <button
                disabled={refunding || !refundAmount}
                onClick={() =>
                  refund({
                    variables: {
                      complaintId: c.id,
                      amount: parseFloat(refundAmount),
                      voucher: true,
                    },
                  })
                }
                className="btn-sm btn-outline disabled:opacity-50"
              >
                كوبون
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">السجل</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                لا توجد أنشطة بعد
              </p>
            ) : (
              <ol className="relative border-s-2 border-gray-200 ps-4 space-y-3">
                {activities.map((a) => (
                  <li key={a.id as number} className="relative">
                    <span className="absolute -start-[1.4rem] inline-flex w-3 h-3 rounded-full bg-hancr-violet ring-2 ring-white"></span>
                    <div className="text-xs text-gray-500">
                      {a.actorType as string} · {a.type as string}
                    </div>
                    {a.note ? (
                      <div className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">
                        {a.note as string}
                      </div>
                    ) : null}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {formatDate(a.createdAt as string)}
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Add note */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="إضافة ملاحظة…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && note.trim().length >= 2) {
                      addNote({
                        variables: {
                          input: { complaintId: c.id, note: note.trim() },
                        },
                      });
                    }
                  }}
                />
                <button
                  disabled={addingNote || note.trim().length < 2}
                  onClick={() =>
                    addNote({
                      variables: {
                        input: { complaintId: c.id, note: note.trim() },
                      },
                    })
                  }
                  className="btn-primary btn-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
