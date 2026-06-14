'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Route as RouteIcon,
  MessageSquare,
  Users,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Languages,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ORDER_DETAIL,
  ORDER_CANDIDATES,
  ASSIGN_DRIVER,
  ORDER_CONVERSATION,
  TRANSLATE_TEXT,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Tab = 'info' | 'timeline' | 'chat' | 'assign' | 'financials';

const PAYMENT_LABEL: Record<string, string> = {
  Cash: 'نقد',
  Wallet: 'محفظة',
  SavedPaymentMethod: 'بطاقة',
  PaymentGateway: 'بوابة دفع',
  Entitlement: 'حزمة رحلات',
  Company: 'حساب شركة',
};

const ACTIVITY_LABEL: Record<string, string> = {
  RequestedByRider: 'الراكب طلب الرحلة',
  BookedByRider: 'الراكب حجز مسبقاً',
  RequestedByOperator: 'المسؤول أنشأ الطلب',
  DriverAccepted: 'السائق قبل',
  ArrivedToPickupPoint: 'وصل للانطلاق',
  Started: 'بدأت الرحلة',
  ArrivedToDestination: 'وصل الوجهة',
  CanceledByDriver: 'ألغاها السائق',
  CanceledByRider: 'ألغاها الراكب',
  CanceledByOperator: 'ألغاها المسؤول',
  Paid: 'تم الدفع',
  Reviewed: 'تم التقييم',
  Expired: 'انتهت الصلاحية',
  OtpVerified: 'OTP صحيح',
  OtpFailed: 'OTP خاطئ',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [tab, setTab] = useState<Tab>('info');

  const { data, loading, refetch } = useQuery(ORDER_DETAIL, {
    variables: { id },
    skip: !Number.isFinite(id),
  });

  const [loadCandidates, { data: candData, loading: candLoading }] =
    useLazyQuery(ORDER_CANDIDATES, { fetchPolicy: 'network-only' });

  const [assignDriver, { loading: assigning }] = useMutation(ASSIGN_DRIVER, {
    onCompleted: () => {
      toast.success('تم تعيين السائق');
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

  const o = data?.adminOrderDetail;
  if (!o) {
    return (
      <div className="p-6">
        <Topbar title="طلب غير موجود" />
      </div>
    );
  }

  const candidates: Record<string, unknown>[] = candData?.adminOrderCandidates ?? [];

  return (
    <div>
      <Topbar
        title={`طلب #${o.id}`}
        subtitle={`${o.type} · ${o.status}`}
      />

      <div className="p-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="btn-outline btn-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        {/* Header */}
        <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="المبلغ" value={`${Number(o.costAfterCoupon).toFixed(2)} ${o.currency}`} />
          <Stat label="المسافة" value={`${(o.distanceBest / 1000).toFixed(1)} كم`} />
          <Stat label="المدة" value={`${(o.durationBest / 60).toFixed(0)} د`} />
          <Stat label="الدفع" value={PAYMENT_LABEL[o.paymentMode] ?? o.paymentMode ?? '—'} />
        </div>

        {/* Service signals */}
        <ServiceTags order={o as Record<string, unknown>} />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {(
            [
              ['info', 'المعلومات', MapPin],
              ['timeline', `الـ Timeline (${o.activities?.length ?? 0})`, Clock],
              ['chat', `الدردشة (${o.messages?.length ?? 0})`, MessageSquare],
              ['assign', 'التعيين اليدوي', Users],
              ['financials', 'المالية', DollarSign],
            ] as [Tab, string, typeof MapPin][]
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                if (key === 'assign' && candidates.length === 0) {
                  loadCandidates({ variables: { orderId: o.id } });
                }
              }}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap ${
                tab === key
                  ? 'border-hancr-violet text-hancr-violet'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'info' && <InfoTab o={o as Record<string, unknown>} />}
        {tab === 'timeline' && (
          <TimelineTab activities={(o.activities ?? []) as Record<string, unknown>[]} />
        )}
        {tab === 'chat' && (
          <ChatTab
            orderId={o.id as number}
            messages={(o.messages ?? []) as Record<string, unknown>[]}
          />
        )}
        {tab === 'assign' && (
          <AssignTab
            orderId={o.id}
            currentDriverId={o.driverId as number | null}
            candidates={candidates}
            loading={candLoading}
            assigning={assigning}
            onAssign={(driverId) =>
              assignDriver({ variables: { orderId: o.id, driverId } })
            }
            onRefresh={() => loadCandidates({ variables: { orderId: o.id } })}
          />
        )}
        {tab === 'financials' && <FinancialsTab o={o as Record<string, unknown>} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-extrabold text-gray-900 text-lg">{value}</div>
    </div>
  );
}

function ServiceTags({ order }: { order: Record<string, unknown> }) {
  const tags: { label: string; color: string }[] = [];
  if (order.preferredDriverId) tags.push({ label: 'VIP', color: 'bg-amber-100 text-amber-700' });
  if (order.nightShift) tags.push({ label: 'وضع الليل', color: 'bg-indigo-100 text-indigo-700' });
  if (order.familyMode || order.preferFemaleDriver)
    tags.push({ label: 'عائلة', color: 'bg-pink-100 text-pink-700' });
  if (order.bookedHours)
    tags.push({ label: `بالساعة · ${order.bookedHours}h`, color: 'bg-orange-100 text-orange-700' });
  if (order.entitlementId) tags.push({ label: 'مدفوع · حزمة', color: 'bg-violet-100 text-violet-700' });
  if (order.companyId) tags.push({ label: 'مدفوع · شركة', color: 'bg-gray-100 text-gray-700' });

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => (
        <span
          key={i}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${t.color}`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

function InfoTab({ o }: { o: Record<string, unknown> }) {
  const addresses = (o.addresses as string[]) ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <RouteIcon className="w-4 h-4" /> المسار
        </h3>
        {addresses.length > 0 ? (
          <ol className="space-y-2 text-sm">
            {addresses.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-hancr-violet/10 text-hancr-violet text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-700">{a}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-400 text-sm">لا توجد عناوين</p>
        )}
      </div>

      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-gray-900 mb-3">المعنيون</h3>
        <Row
          label="الراكب"
          value={
            o.riderName ? (
              <Link
                href={`/users/riders`}
                className="text-hancr-violet hover:underline"
              >
                #{o.riderId as number} — {o.riderName as string}
              </Link>
            ) : (
              `#${o.riderId as number}`
            )
          }
        />
        {o.riderPhone ? (
          <Row label="هاتف الراكب" value={<span dir="ltr">{o.riderPhone as string}</span>} />
        ) : null}
        <Row
          label="السائق"
          value={
            o.driverId ? (
              <Link
                href={`/users/drivers/${o.driverId as number}`}
                className="text-hancr-violet hover:underline"
              >
                #{o.driverId as number} — {(o.driverName as string) ?? '—'}
              </Link>
            ) : (
              <span className="text-gray-400">لم يُعيَّن</span>
            )
          }
        />
        {o.driverPhone ? (
          <Row label="هاتف السائق" value={<span dir="ltr">{o.driverPhone as string}</span>} />
        ) : null}
        <Row label="الخدمة" value={(o.serviceName as string) ?? `#${o.serviceId as number}`} />
        <Row label="تاريخ الإنشاء" value={formatDate(o.createdOn as string)} />
        {o.startTimestamp ? (
          <Row label="وقت البدء" value={formatDate(o.startTimestamp as string)} />
        ) : null}
        {o.finishTimestamp ? (
          <Row label="وقت الانتهاء" value={formatDate(o.finishTimestamp as string)} />
        ) : null}
      </div>
    </div>
  );
}

function TimelineTab({ activities }: { activities: Record<string, unknown>[] }) {
  if (activities.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>لا توجد أنشطة بعد</p>
      </div>
    );
  }
  return (
    <div className="card p-5">
      <ol className="relative border-s-2 border-gray-200 ps-4 space-y-4">
        {activities.map((a) => (
          <li key={a.id as number} className="relative">
            <span className="absolute -start-[1.4rem] inline-flex items-center justify-center w-4 h-4 rounded-full bg-hancr-violet ring-4 ring-white">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </span>
            <div className="ms-2">
              <div className="font-bold text-gray-900 text-sm">
                {ACTIVITY_LABEL[a.type as string] ?? (a.type as string)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {formatDate(a.createdAt as string)}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const SCRIPT_AR: Record<string, string> = {
  arabic: 'العربية',
  latin: 'لاتينية',
  other: 'أخرى',
  unknown: 'غير محدَّد',
};

function ConversationLanguageBanner({ orderId }: { orderId: number }) {
  const { data } = useQuery(ORDER_CONVERSATION, {
    variables: { orderId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'ignore',
  });
  const c = data?.orderConversation;
  if (!c) return null;

  return (
    <div
      className={`card p-3 flex items-center gap-2 flex-wrap text-sm ${
        c.needsTranslation
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-gray-50'
      }`}
    >
      <Languages className="w-4 h-4 text-hancr-violet" />
      <span className="text-gray-600">
        الراكب: <b>{SCRIPT_AR[c.riderScript ?? ''] ?? '—'}</b>
      </span>
      <span className="text-gray-600">
        · السائق: <b>{SCRIPT_AR[c.driverScript ?? ''] ?? '—'}</b>
      </span>
      {c.needsTranslation ? (
        <span className="mr-auto inline-flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold">
            تحتاج ترجمة فورية
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              c.translationReady
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-200 text-gray-600'
            }`}
            title={c.translationEnvKey}
          >
            {c.translationReady
              ? 'خدمة الترجمة جاهزة'
              : `بانتظار ${c.translationEnvKey}`}
          </span>
        </span>
      ) : (
        <span className="mr-auto text-xs text-gray-400">
          الطرفان بنفس اللغة
        </span>
      )}
    </div>
  );
}

function ChatTab({
  orderId,
  messages,
}: {
  orderId: number;
  messages: Record<string, unknown>[];
}) {
  if (messages.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>لا توجد رسائل بين الراكب والسائق</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <ConversationLanguageBanner orderId={orderId} />
      <div className="card p-5 space-y-2 max-h-[600px] overflow-y-auto">
        {messages.map((m) => (
          <MessageBubble key={m.id as number} m={m} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: Record<string, unknown> }) {
  const isRider = m.senderType === 'rider';
  const text = (m.message as string) ?? '';
  const [translate, { data, loading }] = useLazyQuery(TRANSLATE_TEXT, {
    fetchPolicy: 'network-only',
  });
  const result = data?.translateText;

  return (
    <div
      className={`max-w-[70%] p-3 rounded-2xl ${
        isRider
          ? 'bg-gray-100 text-gray-900 me-auto'
          : 'bg-hancr-violet/10 text-hancr-violet-deep ms-auto'
      }`}
    >
      <div className="text-xs font-bold mb-1 opacity-60">
        {isRider ? 'الراكب' : 'السائق'}
      </div>
      <div className="text-sm">{text}</div>

      {result?.translatedText && (
        <div className="mt-1.5 pt-1.5 border-t border-black/10 text-sm text-emerald-800">
          <span className="text-[10px] opacity-60">
            ترجمة
            {result.detectedSourceLanguage
              ? ` (من ${result.detectedSourceLanguage})`
              : ''}
            :{' '}
          </span>
          {result.translatedText}
        </div>
      )}
      {result && !result.configured && (
        <div className="mt-1 text-[10px] text-amber-600">
          خدمة الترجمة غير مُفعَّلة (أضف TRANSLATION_API_KEY)
        </div>
      )}
      {result?.error && (
        <div className="mt-1 text-[10px] text-red-500">
          تعذّرت الترجمة: {result.error}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="text-[10px] text-gray-400">
          {formatDate(m.sentAt as string)}
        </div>
        {text && !result?.translatedText && (
          <button
            onClick={() => translate({ variables: { text, target: 'ar' } })}
            disabled={loading}
            className="text-[10px] inline-flex items-center gap-0.5 text-hancr-violet hover:underline"
          >
            <Languages className="w-3 h-3" />
            {loading ? '…' : 'ترجم'}
          </button>
        )}
      </div>
    </div>
  );
}

function AssignTab({
  orderId,
  currentDriverId,
  candidates,
  loading,
  assigning,
  onAssign,
  onRefresh,
}: {
  orderId: number;
  currentDriverId: number | null;
  candidates: Record<string, unknown>[];
  loading: boolean;
  assigning: boolean;
  onAssign: (driverId: number) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-3">
      {currentDriverId ? (
        <div className="card p-4 bg-blue-50 border-blue-200 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700">
            <strong>الطلب مُسنَد بالفعل للسائق #{currentDriverId}</strong>.
            تعيين سائق آخر سيستبدله ويُحدِّث حالة الطلب.
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          أقرب السائقين المتاحين (نصف قطر 10 كم — تجاهل فلاتر VIP/Family)
        </p>
        <button onClick={onRefresh} className="btn-outline btn-sm">
          إعادة البحث
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">
          جارٍ البحث…
        </div>
      ) : candidates.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>لا يوجد سائقون قريبون متاحون</p>
          <p className="text-xs mt-2">جرّب بعد دقيقة أو وسّع نصف القطر</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th>السائق</th>
                <th>المسافة</th>
                <th>ETA</th>
                <th>الحالة</th>
                <th className="text-end">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.driverId as number}>
                  <td>
                    <Link
                      href={`/users/drivers/${c.driverId as number}`}
                      className="font-bold text-gray-900 hover:text-hancr-violet"
                    >
                      #{c.driverId as number} — {(c.driverName as string) ?? '—'}
                    </Link>
                    {c.driverPhone ? (
                      <div className="text-xs text-gray-400" dir="ltr">
                        {c.driverPhone as string}
                      </div>
                    ) : null}
                  </td>
                  <td className="font-medium text-gray-700">
                    {((c.distanceMeters as number) / 1000).toFixed(2)} كم
                  </td>
                  <td className="font-medium text-gray-700">
                    {c.etaMinutes as number} د
                  </td>
                  <td>
                    <span className="badge badge-green">{c.status as string}</span>
                  </td>
                  <td className="text-end">
                    <button
                      disabled={assigning}
                      onClick={() => {
                        if (confirm(`تعيين السائق #${c.driverId} لهذا الطلب؟`))
                          onAssign(c.driverId as number);
                      }}
                      className="btn-primary btn-sm"
                    >
                      تعيين
                    </button>
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

function FinancialsTab({ o }: { o: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> التسعير
        </h3>
        <Row label="التكلفة الأساسية" value={`${Number(o.costBest).toFixed(2)} ${o.currency as string}`} />
        <Row label="التكلفة بعد الكوبون" value={`${Number(o.costAfterCoupon).toFixed(2)} ${o.currency as string}`} />
        <Row label="الخصم" value={`${Number(o.discountAmount ?? 0).toFixed(2)} ${o.currency as string}`} />
        {o.couponCode ? <Row label="الكوبون" value={o.couponCode as string} /> : null}
        <Row label="المدفوع" value={`${Number(o.paidAmount).toFixed(2)} ${o.currency as string}`} />
        <Row label="حصة المنصة" value={`${Number(o.providerShare).toFixed(2)} ${o.currency as string}`} />
      </div>
      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-gray-900 mb-3">طريقة الدفع</h3>
        <Row label="الوضع" value={PAYMENT_LABEL[o.paymentMode as string] ?? (o.paymentMode as string) ?? '—'} />
        {o.entitlementId ? (
          <Row label="حزمة الرحلات" value={`#${o.entitlementId as number}`} />
        ) : null}
        {o.companyId ? (
          <Row label="حساب الشركة" value={`#${o.companyId as number}`} />
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
