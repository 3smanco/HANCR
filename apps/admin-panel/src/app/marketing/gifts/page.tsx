'use client';

import { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import {
  Gift,
  Plus,
  X,
  FileDown,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_GIFT_BATCHES,
  CREATE_GIFT_BATCH,
  GIFT_BATCH_CODES,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';
import { MarketingTabs } from '../_MarketingTabs';

type Batch = Record<string, unknown>;

export default function GiftsPage() {
  const [creating, setCreating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
  const { data, loading, refetch } = useQuery(LIST_GIFT_BATCHES);
  const [createBatch, { loading: saving }] = useMutation(CREATE_GIFT_BATCH, {
    onCompleted: (d) => {
      const codes = d?.createGiftBatch?.codes as string[];
      toast.success(`تم إنشاء ${codes?.length ?? 0} كود`);
      setGeneratedCodes(codes ?? []);
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [fetchCodes] = useLazyQuery(GIFT_BATCH_CODES, {
    fetchPolicy: 'network-only',
  });

  const batches: Batch[] = data?.adminGiftBatches ?? [];

  const exportCsv = async (batchId: number, batchName: string) => {
    const res = await fetchCodes({ variables: { batchId } });
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    const codes = (res.data?.giftBatchCodes as string[]) ?? [];
    const blob = new Blob([codes.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gift-batch-${batchId}-${batchName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Topbar title="دفعات الهدايا" subtitle={`${batches.length} دفعة`} />
      <div className="p-6 space-y-5">
        <MarketingTabs />

        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            دفعة جديدة
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : batches.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد دفعات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b) => {
              const claimed = b.claimedCount as number;
              const total = b.totalCount as number;
              const pct = (claimed / total) * 100;
              return (
                <div key={b.id as number} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div className="text-end">
                      <div className="text-xl font-extrabold text-gray-900">
                        {Number(b.amount).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {b.currency as string}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 truncate">
                    {b.name as string}
                  </h3>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">المستخدم</span>
                      <span className="font-bold text-gray-900">
                        {claimed} / {total}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mt-3">
                    أُنشئت {formatDate(b.createdAt as string)}
                    {b.expiresAt ? (
                      <>
                        {' · '}
                        تنتهي {formatDate(b.expiresAt as string)}
                      </>
                    ) : null}
                  </div>

                  <button
                    onClick={() => exportCsv(b.id as number, b.name as string)}
                    className="btn-sm btn-outline w-full mt-3"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    تصدير CSV
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createBatch({ variables: { input } })}
        />
      )}

      {generatedCodes && (
        <CodesDialog
          codes={generatedCodes}
          onClose={() => setGeneratedCodes(null)}
        />
      )}
    </div>
  );
}

function CreateModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('50');
  const [currency, setCurrency] = useState('SAR');
  const [totalCount, setTotalCount] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

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
          <h2 className="font-extrabold text-gray-900 text-lg">دفعة هدايا جديدة</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="اسم الحملة" value={name} onChange={setName} />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label={`القيمة لكل كود`}
              value={amount}
              onChange={setAmount}
              type="number"
            />
            <div>
              <label className="label">العملة</label>
              <input
                className="input uppercase"
                value={currency}
                maxLength={3}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
          <Field
            label="عدد الأكواد"
            value={totalCount}
            onChange={setTotalCount}
            type="number"
          />
          <div>
            <label className="label">تاريخ الانتهاء (اختياري)</label>
            <input
              type="date"
              className="input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={saving || !name || Number(amount) <= 0 || Number(totalCount) < 1}
            onClick={() =>
              onSave({
                name,
                amount: Number(amount),
                currency,
                totalCount: Number(totalCount),
                expiresAt: expiresAt
                  ? new Date(expiresAt).toISOString()
                  : undefined,
              })
            }
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ التوليد…' : 'إنشاء'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CodesDialog({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  const copyAll = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    toast.success('تم النسخ');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-xl p-6 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">
            {codes.length} كود جاهز
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          احفظ الأكواد الآن — لن نعرضها مرة أخرى بهذا الشكل (لكن يمكنك تصديرها CSV
          من بطاقة الدفعة).
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-3 font-mono text-sm ltr">
          {codes.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={copyAll} className="btn-outline flex-1">
            <Copy className="w-4 h-4" />
            نسخ الكل
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            تم
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
