'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  ArrowLeft,
  Car,
  Star,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Wallet,
  ListOrdered,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DRIVER_DETAIL,
  SET_DRIVER_STATUS,
  REVIEW_DRIVER_DOCUMENT,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Doc = Record<string, unknown>;
type Order = Record<string, unknown>;
type Tx = Record<string, unknown>;

type Tab = 'details' | 'documents' | 'orders' | 'financials' | 'reviews';

const STATUS_BADGE: Record<string, string> = {
  pending_docs: 'badge-yellow',
  docs_uploaded: 'badge-blue',
  approved: 'badge-green',
  soft_reject: 'badge-orange',
  hard_reject: 'badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  pending_docs: 'بانتظار رفع الوثائق',
  docs_uploaded: 'الوثائق مرفوعة — قيد المراجعة',
  approved: 'معتمد',
  soft_reject: 'رفض مؤقّت',
  hard_reject: 'رفض نهائي',
};

const DOC_TYPE_LABEL: Record<string, string> = {
  national_id: 'الهوية الوطنية',
  license: 'رخصة القيادة',
  vehicle_registration: 'استمارة المركبة',
  insurance: 'بوليصة التأمين',
  criminal_record: 'شهادة عدلية',
};

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [tab, setTab] = useState<Tab>('details');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data, loading, refetch } = useQuery(DRIVER_DETAIL, {
    variables: { id },
    skip: !Number.isFinite(id),
  });

  const [setStatus, { loading: savingStatus }] = useMutation(
    SET_DRIVER_STATUS,
    {
      onCompleted: () => {
        toast.success('تم تحديث حالة السائق');
        setShowStatusModal(false);
        refetch();
      },
      onError: (e) => toast.error(e.message),
    },
  );

  const [reviewDoc] = useMutation(REVIEW_DRIVER_DOCUMENT, {
    onCompleted: () => {
      toast.success('تمت مراجعة الوثيقة');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="p-6">
        <Topbar title="جارٍ التحميل…" />
      </div>
    );
  }

  const d = data?.adminDriverDetail;
  if (!d) {
    return (
      <div className="p-6">
        <Topbar title="سائق غير موجود" />
      </div>
    );
  }

  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ');
  const docs: Doc[] = d.documents ?? [];
  const orders: Order[] = d.recentOrders ?? [];
  const txs: Tx[] = d.recentTransactions ?? [];

  return (
    <div>
      <Topbar
        title={fullName || `سائق #${d.id}`}
        subtitle={d.phoneNumber as string}
      />

      <div className="p-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="btn-outline btn-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        {/* Header card */}
        <div className="card p-5 flex flex-wrap items-center gap-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white font-extrabold text-2xl shrink-0">
            {(fullName[0] ?? '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-gray-900 text-2xl">
              {fullName || '—'}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{d.phoneNumber}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                {Number(d.rating).toFixed(1)} ({d.ratingCount})
              </span>
              <span className="inline-flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                {[d.carBrand, d.carModel, d.carYear]
                  .filter(Boolean)
                  .join(' ') || '—'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ms-auto">
            <span
              className={`badge ${STATUS_BADGE[d.approvalStatus as string] ?? 'badge-gray'}`}
            >
              {STATUS_LABEL[d.approvalStatus as string] ?? d.approvalStatus}
            </span>
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn-primary btn-sm"
            >
              تغيير الحالة
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(
            [
              ['details', 'البيانات'],
              ['documents', `الوثائق (${docs.length})`],
              ['orders', `الطلبات (${orders.length})`],
              ['financials', 'المالية'],
              ['reviews', 'التقييمات'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                tab === key
                  ? 'border-hancr-violet text-hancr-violet'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'details' && <DetailsTab d={d as Record<string, unknown>} />}
        {tab === 'documents' && (
          <DocumentsTab docs={docs} onReview={reviewDoc} />
        )}
        {tab === 'orders' && <OrdersTab orders={orders} />}
        {tab === 'financials' && (
          <FinancialsTab balance={d.balance as number} currency={d.currency as string} txs={txs} />
        )}
        {tab === 'reviews' && (
          <div className="card p-12 text-center text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد تقييمات نصية بعد</p>
            <p className="text-xs mt-2">
              ستظهر التقييمات هنا عندما يُفعَّل نظام Review Parameters
              (مرحلة I7)
            </p>
          </div>
        )}
      </div>

      {showStatusModal && (
        <StatusModal
          current={d.approvalStatus as string}
          saving={savingStatus}
          onClose={() => setShowStatusModal(false)}
          onSave={(approvalStatus, reason) =>
            setStatus({
              variables: {
                input: {
                  driverId: d.id,
                  approvalStatus,
                  reason: reason || undefined,
                },
              },
            })
          }
        />
      )}
    </div>
  );
}

function DetailsTab({ d }: { d: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-gray-900 mb-3">معلومات الحساب</h3>
        <Row label="الجنس" value={(d.gender as string) ?? '—'} />
        <Row
          label="نقل مدرسي"
          value={d.kidsApproved ? 'معتمد ✓' : 'غير معتمد'}
        />
        <Row
          label="عمل ليلي"
          value={d.nightApproved ? 'معتمد ✓' : 'غير معتمد'}
        />
        <Row label="نشط" value={d.active ? '✓' : '✗'} />
        <Row label="محظور" value={d.banned ? '✓' : '✗'} />
        <Row label="تاريخ التسجيل" value={formatDate(d.createdAt as string)} />
        {d.rejectionReason ? (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <strong>سبب الرفض:</strong> {d.rejectionReason as string}
          </div>
        ) : null}
      </div>
      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-gray-900 mb-3">المركبة</h3>
        <Row label="الماركة" value={(d.carBrand as string) ?? '—'} />
        <Row label="الموديل" value={(d.carModel as string) ?? '—'} />
        <Row label="اللون" value={(d.carColor as string) ?? '—'} />
        <Row label="السنة" value={`${d.carYear ?? '—'}`} />
        <Row label="رقم اللوحة" value={(d.plateNumber as string) ?? '—'} />
      </div>
    </div>
  );
}

function DocumentsTab({
  docs,
  onReview,
}: {
  docs: Doc[];
  onReview: (opts: {
    variables: { input: { documentId: number; approve: boolean; rejectedReason?: string } };
  }) => unknown;
}) {
  if (docs.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>لم يرفع السائق أي وثيقة بعد</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map((doc) => {
        const status = doc.status as string;
        const icon =
          status === 'approved' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : status === 'rejected' ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-500" />
          );
        return (
          <div key={doc.id as number} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {DOC_TYPE_LABEL[doc.type as string] ?? (doc.type as string)}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  رُفعت في {formatDate(doc.uploadedAt as string)}
                </p>
              </div>
              {icon}
            </div>

            <a
              href={doc.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3 hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.url as string}
                alt={doc.type as string}
                className="w-full h-full object-cover"
              />
            </a>

            {status === 'rejected' && doc.rejectedReason ? (
              <div className="text-xs bg-red-50 border border-red-100 text-red-700 p-2 rounded mb-3">
                {doc.rejectedReason as string}
              </div>
            ) : null}

            {status === 'pending' ? (
              <div className="flex gap-2">
                <button
                  className="btn-sm btn-success flex-1"
                  onClick={() =>
                    onReview({
                      variables: {
                        input: { documentId: doc.id as number, approve: true },
                      },
                    })
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  موافقة
                </button>
                <button
                  className="btn-sm btn-outline text-red-600 flex-1"
                  onClick={() => {
                    const reason = prompt('سبب الرفض:');
                    if (reason && reason.trim().length > 0) {
                      onReview({
                        variables: {
                          input: {
                            documentId: doc.id as number,
                            approve: false,
                            rejectedReason: reason.trim(),
                          },
                        },
                      });
                    }
                  }}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  رفض
                </button>
              </div>
            ) : (
              <a
                href={doc.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sm btn-outline w-full"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <ListOrdered className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>لا توجد طلبات</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th>#</th>
            <th>النوع</th>
            <th>الحالة</th>
            <th>المبلغ</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id as number}>
              <td className="font-mono text-xs">{o.id as number}</td>
              <td>{o.type as string}</td>
              <td>{o.status as string}</td>
              <td className="font-bold">
                {Number(o.cost).toFixed(2)} {o.currency as string}
              </td>
              <td className="text-gray-400 text-xs">
                {formatDate(o.createdOn as string)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FinancialsTab({
  balance,
  currency,
  txs,
}: {
  balance: number;
  currency: string;
  txs: Tx[];
}) {
  return (
    <div className="space-y-4">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">الرصيد الحالي</div>
          <div className="text-3xl font-extrabold text-gray-900">
            {Number(balance).toFixed(2)} {currency}
          </div>
        </div>
        <Wallet className="w-10 h-10 text-hancr-violet/30" />
      </div>

      {txs.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          لا توجد معاملات
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th>النوع</th>
                <th>الاتجاه</th>
                <th>المبلغ</th>
                <th>الرصيد بعد</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id as number}>
                  <td className="font-medium text-gray-800 text-sm">
                    {t.type as string}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        t.direction === 'Credit' ? 'badge-green' : 'badge-orange'
                      }`}
                    >
                      {t.direction as string}
                    </span>
                  </td>
                  <td className="font-bold">
                    {t.direction === 'Credit' ? '+' : '−'}
                    {Number(t.amount).toFixed(2)}
                  </td>
                  <td className="text-gray-500">
                    {Number(t.balanceAfter).toFixed(2)} {t.currency as string}
                  </td>
                  <td className="text-xs">{t.status as string}</td>
                  <td className="text-gray-400 text-xs">
                    {formatDate(t.createdAt as string)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusModal({
  current,
  saving,
  onClose,
  onSave,
}: {
  current: string;
  saving: boolean;
  onClose: () => void;
  onSave: (status: string, reason: string) => void;
}) {
  const [status, setStatus] = useState(current);
  const [reason, setReason] = useState('');
  const requiresReason = status === 'soft_reject' || status === 'hard_reject';

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
            تغيير حالة السائق
          </h2>
        </div>

        <div className="space-y-3">
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                status === key
                  ? 'border-hancr-violet bg-hancr-violet/5'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                checked={status === key}
                onChange={() => setStatus(key)}
              />
              <span className="font-bold text-sm">{label}</span>
            </label>
          ))}

          {requiresReason && (
            <div>
              <label className="label">سبب الرفض</label>
              <textarea
                className="input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اشرح السبب…"
              />
            </div>
          )}

          {status === 'hard_reject' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                الرفض النهائي يُعطّل حساب السائق ولن يتمكن من إعادة التسجيل
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={saving || (requiresReason && !reason.trim())}
            onClick={() => onSave(status, reason.trim())}
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
