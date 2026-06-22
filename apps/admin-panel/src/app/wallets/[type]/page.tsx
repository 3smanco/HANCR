'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  Wallet,
  Search,
  Plus,
  Minus,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building2,
  Car,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  WALLET_BALANCES,
  WALLET_TRANSACTIONS,
  ADJUST_WALLET,
  ADMIN_REVERSE_WALLET_TX,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type WalletType = 'riders' | 'drivers' | 'companies';

const TYPE_META: Record<
  WalletType,
  {
    label: string;
    apiOwnerType: 'Rider' | 'Driver' | 'Company';
    icon: typeof UserIcon;
  }
> = {
  riders: { label: 'محافظ الركاب', apiOwnerType: 'Rider', icon: UserIcon },
  drivers: { label: 'محافظ السائقين', apiOwnerType: 'Driver', icon: Car },
  companies: { label: 'محافظ الشركات', apiOwnerType: 'Company', icon: Building2 },
};

export default function WalletsPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const type = params.type as WalletType;
  const meta = TYPE_META[type];

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<{
    id: number;
    name: string;
    balance: number;
    currency: string;
  } | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const limit = 20;

  const { data, loading, refetch } = useQuery(WALLET_BALANCES, {
    skip: !meta,
    variables: {
      ownerType: meta?.apiOwnerType ?? 'Rider',
      page,
      limit,
      search: searchQuery || undefined,
    },
  });

  // Redirect if invalid type
  if (!meta) {
    return (
      <div className="p-6">
        <Topbar title="نوع محفظة غير صالح" />
        <button onClick={() => router.push('/wallets/riders')} className="btn-primary mt-4">
          الذهاب لمحافظ الركاب
        </button>
      </div>
    );
  }

  const items: Record<string, unknown>[] = data?.adminWalletBalances?.items ?? [];
  const total = data?.adminWalletBalances?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title={meta.label}
        subtitle={`${total} حساب`}
      />

      <div className="p-6 space-y-5">
        {/* Type switcher */}
        <div className="flex gap-1 border-b border-gray-200">
          {(Object.keys(TYPE_META) as WalletType[]).map((t) => {
            const m = TYPE_META[t];
            const Icon = m.icon;
            return (
              <button
                key={t}
                onClick={() => router.push(`/wallets/${t}`)}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 ${
                  type === t
                    ? 'border-hancr-violet text-hancr-violet'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input ps-3 pe-9"
              placeholder="ابحث بالاسم أو رقم الهاتف…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(search);
                  setPage(1);
                }
              }}
            />
          </div>
          <button
            className="btn-outline"
            onClick={() => {
              setSearchQuery(search);
              setPage(1);
            }}
          >
            بحث
          </button>
          {searchQuery ? (
            <button
              className="btn-outline"
              onClick={() => {
                setSearch('');
                setSearchQuery('');
                setPage(1);
              }}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-12 text-center text-gray-400">
            جارٍ التحميل…
          </div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد حسابات</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th>الحساب</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th>الرصيد</th>
                  <th className="text-end">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.ownerId as number}>
                    <td>
                      <div className="font-bold text-gray-900">
                        {it.name as string}
                      </div>
                      <div className="text-xs text-gray-400">
                        #{it.ownerId as number}
                      </div>
                    </td>
                    <td>
                      {it.phone ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 font-mono ltr">
                          <Phone className="w-3 h-3" />
                          {it.phone as string}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeForStatus(it.status as string)}`}>
                        {it.status as string}
                      </span>
                    </td>
                    <td className="font-extrabold text-gray-900">
                      {Number(it.balance).toFixed(2)} {it.currency as string}
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() =>
                          setSelectedOwner({
                            id: it.ownerId as number,
                            name: it.name as string,
                            balance: Number(it.balance),
                            currency: it.currency as string,
                          })
                        }
                        className="btn-outline btn-sm"
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {selectedOwner && (
        <DetailsDrawer
          ownerType={meta.apiOwnerType}
          owner={selectedOwner}
          onClose={() => {
            setSelectedOwner(null);
            refetch();
          }}
          onAdjusting={setAdjusting}
          adjusting={adjusting}
        />
      )}
    </div>
  );
}

function badgeForStatus(s: string | undefined): string {
  if (!s) return 'badge-gray';
  if (s === 'active' || s === 'online') return 'badge-green';
  if (s === 'banned' || s === 'suspended') return 'badge-red';
  if (s === 'in_ride') return 'badge-blue';
  return 'badge-gray';
}

function DetailsDrawer({
  ownerType,
  owner,
  onClose,
  onAdjusting,
  adjusting,
}: {
  ownerType: 'Rider' | 'Driver' | 'Company';
  owner: { id: number; name: string; balance: number; currency: string };
  onClose: () => void;
  onAdjusting: (v: boolean) => void;
  adjusting: boolean;
}) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<Record<string, unknown> | null>(null);
  const { data, loading, refetch } = useQuery(WALLET_TRANSACTIONS, {
    variables: { ownerType, ownerId: owner.id, limit: 100, offset: 0 },
    fetchPolicy: 'network-only',
  });
  const [adjust] = useMutation(ADJUST_WALLET, {
    onCompleted: () => {
      toast.success('تم التعديل');
      setShowAdjust(false);
      refetch();
      onAdjusting(false);
    },
    onError: (e) => {
      toast.error(e.message);
      onAdjusting(false);
    },
  });
  const [reverse, { loading: reversing }] = useMutation(ADMIN_REVERSE_WALLET_TX, {
    onCompleted: () => {
      toast.success('تم إلغاء المعاملة');
      setReverseTarget(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const txs: Record<string, unknown>[] =
    data?.adminWalletTransactions?.items ?? [];
  const totalCredits = data?.adminWalletTransactions?.totalCredits ?? 0;
  const totalDebits = data?.adminWalletTransactions?.totalDebits ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:w-[600px] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <div>
            <div className="text-sm text-gray-500">{ownerType} #{owner.id}</div>
            <h2 className="font-extrabold text-gray-900 text-lg">
              {owner.name}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Balance card */}
          <div className="card p-5 text-center bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white">
            <div className="text-sm opacity-80 mb-1">الرصيد الحالي</div>
            <div className="text-3xl font-extrabold">
              {owner.balance.toFixed(2)} {owner.currency}
            </div>
            <div className="flex justify-center gap-6 mt-3 text-xs">
              <div>
                <span className="opacity-80">إجمالي إضافات: </span>
                <span className="font-bold">{Number(totalCredits).toFixed(2)}</span>
              </div>
              <div>
                <span className="opacity-80">إجمالي خصومات: </span>
                <span className="font-bold">{Number(totalDebits).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAdjust(true)}
              className="btn-primary flex-1"
            >
              <Plus className="w-4 h-4" />
              تعديل يدوي
            </button>
          </div>

          {/* Transactions */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">سجل المعاملات</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-400">جارٍ التحميل…</div>
            ) : txs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                لا توجد معاملات
              </div>
            ) : (
              <div className="space-y-2">
                {txs.map((t) => {
                  const isCredit = t.direction === 'Credit';
                  const canReverse =
                    (t.status as string) === 'Completed' &&
                    (t.type as string) !== 'AdminAdjustment';
                  return (
                    <div
                      key={t.id as number}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                          isCredit
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900">
                          {t.type as string}
                          {t.orderId ? (
                            <span className="text-xs text-gray-400 ms-2">
                              · order #{t.orderId as number}
                            </span>
                          ) : null}
                        </div>
                        {t.description ? (
                          <div className="text-xs text-gray-500 truncate">
                            {t.description as string}
                          </div>
                        ) : null}
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>{formatDate(t.createdAt as string)}</span>
                          {canReverse ? (
                            <button
                              onClick={() => setReverseTarget(t)}
                              className="text-red-500 hover:text-red-700 underline text-xs font-bold"
                            >
                              إلغاء المعاملة
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <div
                          className={`font-extrabold ${
                            isCredit ? 'text-emerald-700' : 'text-orange-700'
                          }`}
                        >
                          {isCredit ? '+' : '−'}
                          {Number(t.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          ← {Number(t.balanceAfter).toFixed(2)} {t.currency as string}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {reverseTarget && (
        <ReverseModal
          tx={reverseTarget}
          reversing={reversing}
          onClose={() => setReverseTarget(null)}
          onConfirm={(reason) =>
            reverse({
              variables: {
                transactionId: reverseTarget.id as number,
                reason,
              },
            })
          }
        />
      )}

      {showAdjust && (
        <AdjustModal
          ownerType={ownerType}
          owner={owner}
          adjusting={adjusting}
          onClose={() => setShowAdjust(false)}
          onSave={(amount, reason) => {
            onAdjusting(true);
            adjust({
              variables: {
                input: {
                  ownerType,
                  ownerId: owner.id,
                  amount,
                  reason: reason || undefined,
                },
              },
            });
          }}
        />
      )}
    </div>
  );
}

function AdjustModal({
  ownerType,
  owner,
  adjusting,
  onClose,
  onSave,
}: {
  ownerType: string;
  owner: { id: number; name: string; balance: number; currency: string };
  adjusting: boolean;
  onClose: () => void;
  onSave: (amount: number, reason: string) => void;
}) {
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSave = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('أدخل قيمة موجبة');
      return;
    }
    onSave(direction === 'credit' ? n : -n, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">
            تعديل محفظة {ownerType} #{owner.id}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">الرصيد الحالي</div>
          <div className="font-extrabold text-gray-900 text-lg">
            {owner.balance.toFixed(2)} {owner.currency}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('credit')}
              className={`p-3 rounded-lg border-2 font-bold text-sm transition-colors ${
                direction === 'credit'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <Plus className="w-4 h-4 inline mb-1" />
              <div>إضافة (Credit)</div>
            </button>
            <button
              onClick={() => setDirection('debit')}
              className={`p-3 rounded-lg border-2 font-bold text-sm transition-colors ${
                direction === 'debit'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <Minus className="w-4 h-4 inline mb-1" />
              <div>خصم (Debit)</div>
            </button>
          </div>

          <div>
            <label className="label">المبلغ ({owner.currency})</label>
            <input
              type="number"
              inputMode="decimal"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="label">السبب (يُحفظ في وصف المعاملة)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="مثلاً: تعويض عن مشكلة فنية"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={adjusting}
            className="btn-primary flex-1"
          >
            {adjusting ? 'جارٍ الحفظ…' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── N3 — Reverse transaction modal ─────────────────────────────────────────

function ReverseModal({
  tx,
  reversing,
  onClose,
  onConfirm,
}: {
  tx: Record<string, unknown>;
  reversing: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const isCredit = tx.direction === 'Credit';
  const amount = Number(tx.amount);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-extrabold text-gray-900 text-lg mb-2">
          إلغاء المعاملة #{tx.id as number}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          سيتم إنشاء معاملة معاكسة بنفس المبلغ. الأصل يبقى مسجَّلاً للـ audit.
        </p>
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">النوع</span>
            <span className="font-bold">{tx.type as string}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">المبلغ</span>
            <span
              className={`font-bold ${isCredit ? 'text-emerald-700' : 'text-orange-700'}`}
            >
              {isCredit ? '+' : '−'}
              {amount.toFixed(2)} {tx.currency as string}
            </span>
          </div>
          <div className="flex justify-between mt-1 pt-2 border-t border-gray-200">
            <span className="text-gray-600">سيُنشأ</span>
            <span
              className={`font-bold ${isCredit ? 'text-orange-700' : 'text-emerald-700'}`}
            >
              {isCredit ? '−' : '+'}
              {amount.toFixed(2)} {tx.currency as string}
            </span>
          </div>
        </div>
        <div className="mb-4">
          <label className="label">السبب (مطلوب — يُحفظ في الـ audit)</label>
          <textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثلاً: شحن مكرر بسبب خطأ في الـ webhook"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={reversing || reason.trim().length < 3}
            onClick={() => onConfirm(reason.trim())}
            className="btn-danger flex-1"
          >
            {reversing ? 'جارٍ…' : 'تأكيد الإلغاء'}
          </button>
        </div>
      </div>
    </div>
  );
}
