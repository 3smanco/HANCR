'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import {
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  Crown,
  Globe2,
  Home,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ADMIN_ADJUST_LOYALTY,
  ADMIN_RIDER_DETAIL,
  ADMIN_RIDER_LOYALTY,
  UPDATE_RIDER,
  VIP_PROFILE,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { DispatcherDrawer } from '@/components/DispatcherDrawer';
import { formatDate } from '@/lib/utils';

type Tab = 'overview' | 'vip' | 'orders' | 'loyalty' | 'places';

export default function RiderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id ?? 0);
  const [tab, setTab] = useState<Tab>('overview');
  const [bookOpen, setBookOpen] = useState(false);
  const [editForm, setEditForm] = useState<
    { firstName: string; lastName: string; email: string; phoneNumber: string } | null
  >(null);

  const { data, loading, refetch } = useQuery(ADMIN_RIDER_DETAIL, {
    variables: { id },
    skip: !id,
  });

  const [updateRider, { loading: saving }] = useMutation(UPDATE_RIDER, {
    onCompleted: () => {
      toast.success('تم حفظ التعديلات');
      setEditForm(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!id) return null;

  if (loading || !data) {
    return (
      <div>
        <Topbar title="..." subtitle="" />
        <div className="p-6 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin inline" />
        </div>
      </div>
    );
  }

  const detail = data.adminRiderDetail;
  const rider = detail.rider;
  const name =
    [rider.firstName, rider.lastName].filter(Boolean).join(' ') ||
    `Rider #${rider.id}`;

  return (
    <div>
      <Topbar title={name} subtitle={rider.phoneNumber} />

      <div className="p-6 space-y-5">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            عودة للقائمة
          </button>
        </div>

        {/* Header card */}
        <div className="card p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-hancr-violet/15 text-hancr-violet text-xl font-extrabold grid place-items-center shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-extrabold text-gray-900">{name}</h2>
              {rider.banned ? (
                <span className="badge badge-red">محظور</span>
              ) : rider.active ? (
                <span className="badge badge-green">نشط</span>
              ) : (
                <span className="badge badge-gray">غير نشط</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" /> {rider.phoneNumber}
              </span>
              {rider.email ? (
                <span className="truncate">{rider.email}</span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500" />
                {Number(rider.rating).toFixed(1)}
              </span>
              <span>· انضم {formatDate(rider.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              className="btn-primary btn-sm"
              onClick={() => setBookOpen(true)}
            >
              <Plus className="w-4 h-4" />
              احجز رحلة
            </button>
            <button
              className="btn-outline btn-sm"
              onClick={() =>
                setEditForm({
                  firstName: rider.firstName ?? '',
                  lastName: rider.lastName ?? '',
                  email: rider.email ?? '',
                  phoneNumber: rider.phoneNumber ?? '',
                })
              }
            >
              تعديل البيانات
            </button>
          </div>
        </div>

        {editForm && (
          <div className="fixed inset-0 bg-hancr-navy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card p-6 w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-gray-900 text-lg">تعديل بيانات الراكب</h3>
                <button onClick={() => setEditForm(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">الاسم الأول</label>
                    <input className="input" value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">الاسم الأخير</label>
                    <input className="input" value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <input className="input ltr" type="email" value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">رقم الجوال</label>
                  <input className="input ltr" value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-outline flex-1" onClick={() => setEditForm(null)}>إلغاء</button>
                <button className="btn-primary flex-1" disabled={saving}
                  onClick={() =>
                    updateRider({
                      variables: {
                        input: {
                          id: rider.id,
                          firstName: editForm.firstName.trim() || undefined,
                          lastName: editForm.lastName.trim() || undefined,
                          email: editForm.email.trim() || undefined,
                          phoneNumber: editForm.phoneNumber.trim() || undefined,
                        },
                      },
                    })
                  }>
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {bookOpen && (
          <DispatcherDrawer
            onClose={() => setBookOpen(false)}
            onCreated={() => refetch()}
            presetRider={{
              id: rider.id,
              name,
              phone: rider.phoneNumber,
            }}
          />
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile
            icon={Wallet}
            label="رصيد المحفظة"
            value={`${Number(rider.balance).toFixed(2)} ${rider.currency}`}
          />
          <StatTile
            icon={ShoppingBag}
            label="رحلات مكتملة"
            value={String(detail.ordersCompleted)}
          />
          <StatTile
            icon={X}
            label="رحلات ملغاة"
            value={String(detail.ordersCancelled)}
            tone="red"
          />
          <StatTile
            icon={TrendingUp}
            label="إجمالي الإنفاق"
            value={`${Number(detail.totalSpent).toFixed(2)} ${rider.currency}`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {(
            [
              ['overview', 'نظرة عامة'],
              ['vip', 'VIP عالمي'],
              ['orders', 'الرحلات'],
              ['loyalty', 'الولاء'],
              ['places', 'الأماكن'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                tab === key
                  ? 'border-hancr-violet text-hancr-violet'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <OverviewTab
            detail={detail}
            onChanged={refetch}
          />
        )}
        {tab === 'vip' && <VipTab riderId={rider.id} />}
        {tab === 'orders' && <OrdersTab orders={detail.recentOrders} />}
        {tab === 'loyalty' && <LoyaltyTab riderId={rider.id} />}
        {tab === 'places' && <PlacesTab places={detail.savedPlaces} />}
      </div>
    </div>
  );
}

// ── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: 'red';
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
          tone === 'red'
            ? 'bg-red-50 text-red-600'
            : 'bg-hancr-violet/10 text-hancr-violet'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-base font-extrabold text-gray-900 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({
  detail,
  onChanged,
}: {
  detail: { rider: { id: number; banned: boolean; banReason?: string | null } };
  onChanged: () => void;
}) {
  const rider = detail.rider;
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 mb-3">إجراءات الحساب</h3>
        <p className="text-xs text-gray-500 mb-4">
          الحظر يمنع الراكب من تسجيل الدخول وحجز رحلات جديدة. الرحلات
          النشطة لا تتأثر.
        </p>
        <BanControls
          riderId={rider.id}
          banned={rider.banned}
          banReason={rider.banReason ?? undefined}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

function BanControls({
  riderId,
  banned,
  banReason,
  onChanged,
}: {
  riderId: number;
  banned: boolean;
  banReason?: string;
  onChanged: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function call(action: 'ban' | 'unban') {
    setBusy(true);
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_ADMIN_API_URL ??
          'http://localhost:3002/graphql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${document.cookie.match(/hancr_admin_token=([^;]+)/)?.[1] ?? ''}`,
          },
          body: JSON.stringify({
            query:
              action === 'ban'
                ? `mutation($id:Int!,$r:String){banRider(id:$id,reason:$r){id banned}}`
                : `mutation($id:Int!){unbanRider(id:$id){id banned}}`,
            variables: action === 'ban' ? { id: riderId, r: reason } : { id: riderId },
          }),
        },
      );
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message ?? 'failed');
      toast.success(action === 'ban' ? 'تم الحظر' : 'تم رفع الحظر');
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (banned) {
    return (
      <div>
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm mb-3">
          <div className="font-bold mb-0.5">الراكب محظور</div>
          {banReason ? <div className="text-xs">{banReason}</div> : null}
        </div>
        <button
          disabled={busy}
          onClick={() => call('unban')}
          className="btn-outline btn-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          رفع الحظر
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">سبب الحظر</label>
        <input
          className="input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="مثال: نشاط احتيالي"
        />
      </div>
      <button
        disabled={busy || reason.trim().length < 3}
        onClick={() => call('ban')}
        className="btn-sm btn-outline text-red-600"
      >
        <Ban className="w-3.5 h-3.5" />
        حظر الراكب
      </button>
    </div>
  );
}

// ── VIP عالمي tab (Phase 5) ──────────────────────────────────────────────────

const TIER_STYLE: Record<string, { label: string; cls: string }> = {
  platinum: { label: 'بلاتيني', cls: 'bg-slate-200 text-slate-800 border-slate-300' },
  gold: { label: 'ذهبي', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  silver: { label: 'فضّي', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
  standard: { label: 'عادي', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

function VipTab({ riderId }: { riderId: number }) {
  const { data, loading } = useQuery(VIP_PROFILE, {
    variables: { riderId },
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin inline" />
      </div>
    );
  }

  const v = data?.vipProfile;
  if (!v) {
    return (
      <div className="card p-10 text-center text-gray-400">
        تعذّر تحميل ملف VIP
      </div>
    );
  }

  const tier = TIER_STYLE[v.tier] ?? TIER_STYLE.standard;

  return (
    <div className="space-y-4">
      {/* Tier + headline KPIs */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-hancr-violet/10 text-hancr-violet grid place-items-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-gray-900">ملف VIP 360 عالمي</h3>
            <p className="text-xs text-gray-500">
              رؤية موحَّدة عبر كل الدول — الإنفاق مُحوَّل لعملة الأساس
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-extrabold border ${tier.cls}`}
          >
            {tier.label}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile
            icon={TrendingUp}
            label="الإنفاق العالمي (أساس)"
            value={`${Number(v.lifetimeSpendBase).toFixed(2)} ${v.baseCurrency}`}
          />
          <StatTile
            icon={Globe2}
            label="دول استُخدمت"
            value={String(v.countriesVisited)}
          />
          <StatTile
            icon={ShoppingBag}
            label="إجمالي الرحلات"
            value={String(v.totalRides)}
          />
          <StatTile
            icon={Wallet}
            label="رصيد المحفظة"
            value={`${Number(v.walletBalance).toFixed(2)} ${v.walletCurrency}`}
          />
        </div>
      </div>

      {/* Fraud signals */}
      {v.fraudSignals.length > 0 && (
        <div className="card p-5 border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-700">
              إشارات احتيال عبر-الحدود ({v.fraudSignals.length})
            </h3>
          </div>
          <div className="space-y-2">
            {v.fraudSignals.map(
              (
                s: {
                  severity: string;
                  countryA: string;
                  countryB: string;
                  orderIdA: number;
                  orderIdB: number;
                  minutesApart: number;
                  message: string;
                },
                i: number,
              ) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm ${
                    s.severity === 'high'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold">
                      {s.countryA} ↔ {s.countryB}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 font-bold uppercase">
                      {s.severity === 'high' ? 'خطر عالٍ' : 'متوسط'}
                    </span>
                    <span className="text-xs opacity-70">
                      · {Number(s.minutesApart).toFixed(0)}د
                    </span>
                  </div>
                  <div className="text-xs">{s.message}</div>
                  <div className="text-[10px] font-mono opacity-60 mt-1">
                    #{s.orderIdA} · #{s.orderIdB}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Per-country spend */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-gray-900">
          الإنفاق لكل دولة
        </div>
        {v.byCountry.length === 0 ? (
          <div className="p-8 text-center text-gray-400">لا يوجد إنفاق مكتمل</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>الدولة</th>
                <th>الرحلات</th>
                <th>الإنفاق المحلي</th>
                <th>بعملة الأساس</th>
              </tr>
            </thead>
            <tbody>
              {v.byCountry.map(
                (
                  c: {
                    countryIso: string;
                    countryName: string;
                    flag?: string | null;
                    currency: string;
                    orders: number;
                    spentNative: number;
                    spentBase: number;
                  },
                  i: number,
                ) => (
                  <tr key={i}>
                    <td className="font-bold">
                      {c.flag ? `${c.flag} ` : ''}
                      {c.countryName}
                      <span className="text-xs text-gray-400 mr-1">
                        {c.countryIso}
                      </span>
                    </td>
                    <td>{c.orders}</td>
                    <td>
                      {Number(c.spentNative).toFixed(2)} {c.currency}
                    </td>
                    <td className="font-bold">
                      {Number(c.spentBase).toFixed(2)} {v.baseCurrency}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Orders tab ──────────────────────────────────────────────────────────────

function OrdersTab({
  orders,
}: {
  orders: Array<{
    id: number;
    status: string;
    costAfterCoupon: number;
    currency: string;
    serviceName?: string | null;
    driverId?: number | null;
    driverName?: string | null;
    createdOn: string;
  }>;
}) {
  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        لا توجد رحلات
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th>#</th>
            <th>الخدمة</th>
            <th>السائق</th>
            <th>التكلفة</th>
            <th>الحالة</th>
            <th>التاريخ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="font-mono text-xs text-gray-500">#{o.id}</td>
              <td>{o.serviceName ?? '—'}</td>
              <td>
                {o.driverId ? (
                  <Link
                    href={`/users/drivers/${o.driverId}`}
                    className="text-hancr-violet hover:underline"
                  >
                    {o.driverName ?? `Driver #${o.driverId}`}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td className="font-bold">
                {Number(o.costAfterCoupon).toFixed(2)} {o.currency}
              </td>
              <td>
                <span className="badge badge-gray text-[10px]">{o.status}</span>
              </td>
              <td className="text-xs text-gray-500">
                {formatDate(o.createdOn)}
              </td>
              <td>
                <Link
                  href={`/orders/${o.id}`}
                  className="text-hancr-violet text-xs font-bold hover:underline"
                >
                  فتح
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Loyalty tab ─────────────────────────────────────────────────────────────

function LoyaltyTab({ riderId }: { riderId: number }) {
  const { data, loading, refetch } = useQuery(ADMIN_RIDER_LOYALTY, {
    variables: { riderId },
    fetchPolicy: 'network-only',
  });
  const [adjust, { loading: adjusting }] = useMutation(ADMIN_ADJUST_LOYALTY, {
    onCompleted: () => {
      toast.success('تم التعديل');
      refetch();
      setDelta('');
      setReason('');
    },
    onError: (e) => toast.error(e.message),
  });
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  if (loading || !data) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin inline" />
      </div>
    );
  }

  const l = data.adminRiderLoyalty;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900">مستوى الولاء</h3>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="المستوى الحالي" value={l.tier} />
          <Row label="نقاط متاحة" value={String(l.availableMiles)} />
          <Row label="إجمالي العمر" value={String(l.lifetimeMiles)} />
          <Row label="نقاط مكتسبة" value={String(l.totalMiles)} />
          <Row
            label="ترقيات مجانية متبقية"
            value={String(l.freeUpgradesRemaining)}
          />
          <Row
            label="إلغاء مجاني"
            value={l.hasFreeCancellation ? 'نعم' : 'لا'}
          />
          {l.surgeImmunityUntil ? (
            <Row
              label="حصانة من Surge حتى"
              value={formatDate(l.surgeImmunityUntil)}
            />
          ) : null}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-hancr-violet" />
          <h3 className="font-bold text-gray-900">تعديل يدوي</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          استخدم الموجب للإضافة (مكافأة اعتذار)، والسالب للخصم (احتيال).
          المستوى يُعاد حسابه تلقائياً عند الرحلة التالية.
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">التغيير (نقاط)</label>
            <input
              className="input"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="100 أو -50"
            />
          </div>
          <div>
            <label className="label">السبب</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مكافأة شكوى مُحلَّة"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={
                adjusting ||
                !delta ||
                Number(delta) === 0 ||
                reason.trim().length < 3
              }
              onClick={() =>
                adjust({
                  variables: {
                    input: {
                      riderId,
                      delta: Math.abs(Number(delta)),
                      reason: reason.trim(),
                    },
                  },
                })
              }
              className="btn-sm btn-success"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة
            </button>
            <button
              disabled={
                adjusting ||
                !delta ||
                Number(delta) === 0 ||
                reason.trim().length < 3
              }
              onClick={() =>
                adjust({
                  variables: {
                    input: {
                      riderId,
                      delta: -Math.abs(Number(delta)),
                      reason: reason.trim(),
                    },
                  },
                })
              }
              className="btn-sm btn-outline text-red-600"
            >
              <Minus className="w-3.5 h-3.5" />
              خصم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Places tab ──────────────────────────────────────────────────────────────

function PlacesTab({
  places,
}: {
  places: Array<{
    id: number;
    label: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}) {
  if (places.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        لا توجد أماكن محفوظة
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {places.map((p) => (
        <div key={p.id} className="card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-hancr-violet/10 text-hancr-violet grid place-items-center shrink-0">
            {p.label.includes('منزل') || p.label.toLowerCase().includes('home') ? (
              <Home className="w-5 h-5" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900">{p.label}</div>
            <div className="text-xs text-gray-500 mb-1.5 line-clamp-1">
              {p.address}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Generic row helper ──────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
