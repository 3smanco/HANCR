'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { MessageSquare, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { PROVIDER_CONFIG, UPDATE_SMS_CONFIG } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from '../_SettingsTabs';

type Provider = 'twilio' | 'vonage' | 'local';

const PROVIDERS: Array<{
  id: Provider;
  label: string;
  description: string;
  envHint: string;
}> = [
  {
    id: 'twilio',
    label: 'Twilio',
    description: 'الأكثر اعتماداً عالمياً. تسليم ممتاز في الخليج.',
    envHint: 'TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER في .env.prod',
  },
  {
    id: 'vonage',
    label: 'Vonage (Nexmo)',
    description: 'بديل أرخص لـ Twilio في بعض الأسواق.',
    envHint: 'VONAGE_API_KEY + VONAGE_API_SECRET في .env.prod',
  },
  {
    id: 'local',
    label: 'محلي (Mock OTP 1234)',
    description: 'يستخدم في التطوير والاختبار فقط. OTP ثابت: 1234.',
    envHint: 'لا حاجة لأي مفاتيح',
  },
];

export default function SmsSettingsPage() {
  const { data, loading, refetch } = useQuery(PROVIDER_CONFIG);
  const [save, { loading: saving }] = useMutation(UPDATE_SMS_CONFIG, {
    onCompleted: () => {
      toast.success('تم حفظ إعدادات SMS');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [provider, setProvider] = useState<Provider>('local');
  const [senderId, setSenderId] = useState('HANCR');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!data) return;
    const remote =
      (data?.appConfig?.smsConfig as Record<string, unknown> | undefined) ??
      {};
    if (typeof remote.provider === 'string') {
      setProvider(remote.provider as Provider);
    }
    if (typeof remote.senderId === 'string') {
      setSenderId(remote.senderId);
    }
    if (typeof remote.active === 'boolean') {
      setActive(remote.active);
    }
  }, [data]);

  const handleSave = () => {
    save({
      variables: {
        smsConfig: { provider, senderId: senderId.trim(), active },
      },
    });
  };

  return (
    <div>
      <Topbar
        title="مزوّد SMS"
        subtitle="اختر مزوّد رسائل OTP المستخدم في تسجيل الراكب والسائق."
      />
      <div className="p-6 space-y-5">
        <SettingsTabs />

        {loading ? (
          <div className="card p-10 text-center text-gray-400">
            جارٍ التحميل…
          </div>
        ) : (
          <div className="card p-6 space-y-6 max-w-2xl">
            <div className="flex items-center gap-2 text-gray-900">
              <MessageSquare className="w-5 h-5 text-hancr-violet" />
              <h2 className="font-extrabold">المزوّد النشط</h2>
            </div>

            <div className="space-y-3">
              {PROVIDERS.map((p) => {
                const selected = provider === p.id;
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                      selected
                        ? 'border-hancr-violet bg-hancr-violet/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={selected}
                      onChange={() => setProvider(p.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{p.label}</div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {p.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 font-mono">
                        {p.envHint}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="label">
                مُعرّف المُرسل (Sender ID)
              </label>
              <input
                className="input"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                maxLength={11}
                placeholder="HANCR"
              />
              <p className="help-text">
                يظهر للمستخدم كاسم مرسل الـ SMS. حتى 11 حرفاً، إنجليزي فقط.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>تفعيل إرسال SMS فعلي (وإلا يُستخدم OTP الثابت 1234)</span>
            </label>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جارٍ الحفظ…' : 'حفظ'}
              </button>
              <p className="text-xs text-gray-400 mt-3">
                ⚠️ المفاتيح السرية (Auth Token / API Secret) لا تُحفظ في
                قاعدة البيانات — تُضاف فقط في <code>.env.prod</code> على
                السيرفر.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
