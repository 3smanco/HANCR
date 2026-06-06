'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ADMIN_DRIVER_APPLICATIONS,
  UPDATE_DRIVER_APPLICATION_STATUS,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Application = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city?: string | null;
  nationalIdNumber?: string | null;
  dateOfBirth?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  plateNumber?: string | null;
  docNationalIdUrl?: string | null;
  docLicenseUrl?: string | null;
  docVehicleRegistrationUrl?: string | null;
  docInsuranceUrl?: string | null;
  docProfilePhotoUrl?: string | null;
  status: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; badge: string }> = {
  submitted: { label: 'مُرسَل', badge: 'badge-yellow' },
  in_review: { label: 'قيد المراجعة', badge: 'badge-blue' },
  approved: { label: 'مقبول', badge: 'badge-green' },
  rejected: { label: 'مرفوض', badge: 'badge-gray' },
  needs_more_info: { label: 'يحتاج بيانات', badge: 'badge-yellow' },
};

const DOC_FIELDS: Array<{
  key: keyof Application;
  label: string;
}> = [
  { key: 'docNationalIdUrl', label: 'الهوية' },
  { key: 'docLicenseUrl', label: 'رخصة القيادة' },
  { key: 'docVehicleRegistrationUrl', label: 'استمارة' },
  { key: 'docInsuranceUrl', label: 'تأمين' },
  { key: 'docProfilePhotoUrl', label: 'صورة شخصية' },
];

export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>('submitted');
  const [selected, setSelected] = useState<Application | null>(null);
  const limit = 20;

  const { data, loading, refetch } = useQuery(ADMIN_DRIVER_APPLICATIONS, {
    variables: { page, limit, status: statusFilter ?? undefined },
    pollInterval: 30000,
  });

  const items: Application[] = data?.adminDriverApplications?.items ?? [];
  const total = data?.adminDriverApplications?.total ?? 0;
  const submittedCount = data?.adminDriverApplications?.submittedCount ?? 0;
  const inReviewCount = data?.adminDriverApplications?.inReviewCount ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="طلبات تسجيل السائقين"
        subtitle={`${submittedCount} جديد · ${inReviewCount} قيد المراجعة`}
      />

      <div className="p-6 space-y-5">
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

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((a) => {
              const status = STATUS_META[a.status] ?? STATUS_META.submitted;
              const docCount = DOC_FIELDS.filter((d) => a[d.key]).length;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full text-start card p-4 hover:border-hancr-violet/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-hancr-violet/10 text-hancr-violet flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">
                          {a.fullName}
                        </span>
                        <span className={`badge ${status.badge} text-[10px]`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">#{a.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {a.phone}
                        </span>
                        {a.city ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {a.city}
                          </span>
                        ) : null}
                        {a.vehicleBrand ? (
                          <span className="inline-flex items-center gap-1">
                            <Car className="w-3 h-3" /> {a.vehicleBrand}{' '}
                            {a.vehicleModel} {a.vehicleYear ?? ''}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {docCount}/5
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {formatDate(a.createdAt)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

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

      {selected !== null && (
        <ApplicationDrawer
          application={selected}
          onClose={() => {
            setSelected(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ApplicationDrawer({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const [update, { loading: updating }] = useMutation(
    UPDATE_DRIVER_APPLICATION_STATUS,
    {
      onCompleted: () => {
        toast.success('تم التحديث');
        onClose();
      },
      onError: (e) => toast.error(e.message),
    },
  );
  const [reason, setReason] = useState('');
  const status = STATUS_META[application.status] ?? STATUS_META.submitted;

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
          <div>
            <div className="text-xs text-gray-500">طلب #{application.id}</div>
            <h2 className="font-extrabold text-gray-900 text-lg">
              {application.fullName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${status.badge}`}>{status.label}</span>
            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Personal */}
          <div className="card p-4 space-y-2 text-sm">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">
              البيانات الشخصية
            </h3>
            <Row icon={Mail} label="البريد" value={application.email} />
            <Row icon={Phone} label="الجوال" value={application.phone} />
            <Row icon={MapPin} label="المدينة" value={application.city ?? '—'} />
            {application.nationalIdNumber ? (
              <Row label="رقم الهوية" value={application.nationalIdNumber} />
            ) : null}
            {application.dateOfBirth ? (
              <Row label="تاريخ الميلاد" value={application.dateOfBirth} />
            ) : null}
          </div>

          {/* Vehicle */}
          <div className="card p-4 space-y-2 text-sm">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">السيارة</h3>
            <Row
              icon={Car}
              label="الماركة/الموديل"
              value={`${application.vehicleBrand ?? ''} ${application.vehicleModel ?? ''} ${
                application.vehicleYear ?? ''
              }`}
            />
            {application.vehicleColor ? (
              <Row label="اللون" value={application.vehicleColor} />
            ) : null}
            <Row label="رقم اللوحة" value={application.plateNumber ?? '—'} />
          </div>

          {/* Docs */}
          <div className="card p-4 text-sm">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">الوثائق</h3>
            <div className="grid grid-cols-2 gap-2">
              {DOC_FIELDS.map((d) => {
                const url = application[d.key] as string | null | undefined;
                return (
                  <a
                    key={d.key as string}
                    href={url ?? '#'}
                    target={url ? '_blank' : undefined}
                    rel="noopener"
                    aria-disabled={!url}
                    onClick={(e) => {
                      if (!url) e.preventDefault();
                    }}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                      url
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-bold">{d.label}</span>
                    {url ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {application.rejectionReason ? (
            <div className="card p-4 bg-red-50 border-red-200">
              <h3 className="font-bold text-red-900 mb-1 text-sm">
                ملاحظة الرفض
              </h3>
              <p className="text-sm text-red-800 whitespace-pre-wrap">
                {application.rejectionReason}
              </p>
            </div>
          ) : null}

          {/* Actions */}
          {application.status === 'submitted' ||
          application.status === 'in_review' ||
          application.status === 'needs_more_info' ? (
            <div className="card p-4 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">إجراءات</h3>
              {application.status === 'submitted' ? (
                <button
                  disabled={updating}
                  onClick={() =>
                    update({
                      variables: {
                        input: {
                          applicationId: application.id,
                          status: 'in_review',
                        },
                      },
                    })
                  }
                  className="btn-outline btn-sm w-full"
                >
                  <Eye className="w-3.5 h-3.5" />
                  بدء المراجعة
                </button>
              ) : null}
              <div>
                <label className="label">سبب الرفض / ملاحظة (اختياري)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: رخصة منتهية الصلاحية"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={updating}
                  onClick={() =>
                    update({
                      variables: {
                        input: {
                          applicationId: application.id,
                          status: 'approved',
                          rejectionReason: reason || undefined,
                        },
                      },
                    })
                  }
                  className="btn-sm btn-success"
                >
                  <Check className="w-3.5 h-3.5" />
                  قبول
                </button>
                <button
                  disabled={updating}
                  onClick={() =>
                    update({
                      variables: {
                        input: {
                          applicationId: application.id,
                          status: 'rejected',
                          rejectionReason: reason || undefined,
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
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Mail;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 inline-flex items-center gap-1.5">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        {label}
      </span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
