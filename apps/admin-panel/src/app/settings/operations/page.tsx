'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { SlidersHorizontal, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { SDUI_CONFIG, UPDATE_OPERATIONS_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type Ops = {
  otpTtlSeconds: number;
  maxOtpAttempts: number;
  otpResendCooldownSeconds: number;
  searchRadiusKm: number;
  etaMinutesPerKm: number;
  matchingTimeoutSeconds: number;
};

const DEFAULTS: Ops = {
  otpTtlSeconds: 300,
  maxOtpAttempts: 5,
  otpResendCooldownSeconds: 60,
  searchRadiusKm: 5,
  etaMinutesPerKm: 1.5,
  matchingTimeoutSeconds: 60,
};

const FIELDS: Array<{
  key: keyof Ops;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'otpTtlSeconds', label: 'مدة صلاحية OTP (ثانية)', hint: 'الافتراضي 300 (5 دقائق)', min: 30, max: 1800, step: 30 },
  { key: 'maxOtpAttempts', label: 'أقصى محاولات OTP', hint: 'قبل طلب رمز جديد', min: 1, max: 10, step: 1 },
  { key: 'otpResendCooldownSeconds', label: 'فترة الانتظار لإعادة الإرسال (ثانية)', hint: 'لمنع الإغراق', min: 0, max: 600, step: 10 },
  { key: 'searchRadiusKm', label: 'نصف قطر البحث عن السائقين (كم)', hint: 'الافتراضي 5 كم', min: 1, max: 50, step: 1 },
  { key: 'etaMinutesPerKm', label: 'دقائق التقدير لكل كيلومتر (ETA)', hint: 'الافتراضي 1.5', min: 0.5, max: 10, step: 0.1 },
  { key: 'matchingTimeoutSeconds', label: 'مهلة المطابقة (ثانية)', hint: 'قبل اعتبار الطلب بلا سائق', min: 15, max: 300, step: 5 },
];

export default function OperationsSettingsPage() {
  const { data, loading, refetch } = useQuery(SDUI_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_OPERATIONS_CONFIG, {
    onCompleted: () => {
      toast.success('تم حفظ الإعدادات التشغيلية');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<Ops>(DEFAULTS);

  useEffect(() => {
    if (!data) return;
    const remote = (data.appConfig?.operationsConfig ?? {}) as Partial<Ops>;
    setForm({ ...DEFAULTS, ...remote });
  }, [data]);

  return (
    <div>
      <Topbar
        title="الإعدادات التشغيلية"
        subtitle="OTP، نصف قطر البحث، ETA، المطابقة — تُطبَّق فوراً بدون تحديث التطبيق."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">جارٍ التحميل…</div>
        ) : (
          <div className="card p-6 space-y-5 max-w-2xl">
            <div className="flex items-center gap-2 text-gray-900">
              <SlidersHorizontal className="w-5 h-5 text-hancr-violet" />
              <h2 className="font-extrabold">قيم التشغيل الحيّة</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    type="number"
                    className="input"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: Number(e.target.value) })
                    }
                  />
                  <p className="help-text">{f.hint}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => save({ variables: { operationsConfig: form } })}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جارٍ الحفظ…' : 'حفظ'}
              </button>
              <p className="text-xs text-gray-400 mt-3">
                ⏱️ التغييرات تسري خلال 60 ثانية كحدٍّ أقصى (كاش الخادم).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
