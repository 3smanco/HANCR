'use client';

import { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { type Locale } from '@/i18n/messages';

const CHECK_STATUS = gql`
  query CheckStatus($applicationId: Int!, $phone: String!) {
    checkDriverApplicationStatus(applicationId: $applicationId, phone: $phone) {
      id
      status
      rejectionReason
      reviewedAt
      createdAt
    }
  }
`;

type Result = {
  id: number;
  status: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
} | null;

export function ApplicationStatusLookup({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';
  const [applicationId, setApplicationId] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);

  const [run, { data, loading, error }] = useLazyQuery<{ checkDriverApplicationStatus: Result }>(
    CHECK_STATUS,
    { fetchPolicy: 'network-only' },
  );

  const result = data?.checkDriverApplicationStatus ?? null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const idNum = Number(applicationId.trim());
    if (!idNum || idNum <= 0 || !phone.trim()) return;
    run({ variables: { applicationId: idNum, phone: phone.trim() } });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-ash/60 border border-stone/60 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-pearl/90 mb-1.5">
            {isAr ? 'رقم الطلب' : 'Application ID'}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="123"
            className="w-full bg-obsidian border border-stone rounded-lg px-4 py-2.5 text-pearl placeholder:text-hint focus:border-ember focus:outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-pearl/90 mb-1.5">
            {isAr ? 'رقم الجوال المسجَّل' : 'Phone used in the application'}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+9665…"
            className="w-full bg-obsidian border border-stone rounded-lg px-4 py-2.5 text-pearl placeholder:text-hint focus:border-ember focus:outline-none transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !applicationId.trim() || !phone.trim()}
        className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep disabled:opacity-50 disabled:cursor-not-allowed transition px-4 py-3 rounded-xl font-bold text-pearl shadow-ember"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isAr ? 'جارٍ البحث...' : 'Checking...'}
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {isAr ? 'فحص الحالة' : 'Check status'}
          </>
        )}
      </button>

      {error ? (
        <p className="text-danger text-sm">
          {isAr ? 'تعذَّر البحث، حاول لاحقاً.' : 'Could not check, try again later.'}
        </p>
      ) : null}

      {touched && !loading && !error && data && !result ? (
        <div className="bg-obsidian/60 border border-stone/60 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-muted shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-pearl mb-1">
              {isAr ? 'لا يوجد طلب مطابق' : 'No matching application'}
            </div>
            <div className="text-muted">
              {isAr
                ? 'تأكَّد من رقم الطلب ورقم الجوال المسجَّل في النموذج.'
                : 'Double-check the application ID and the phone you used.'}
            </div>
          </div>
        </div>
      ) : null}

      {result ? <ResultCard result={result} isAr={isAr} /> : null}
    </form>
  );
}

function ResultCard({
  result,
  isAr,
}: {
  result: NonNullable<Result>;
  isAr: boolean;
}) {
  const meta = STATUS_META[result.status] ?? STATUS_META.submitted;
  const Icon = meta.icon;
  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 ${meta.bg} ${meta.border}`}
    >
      <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${meta.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-pearl text-base mb-1">
          {isAr ? meta.titleAr : meta.titleEn}
        </div>
        <p className="text-sm text-muted leading-relaxed">
          {isAr ? meta.bodyAr : meta.bodyEn}
        </p>
        {result.rejectionReason ? (
          <div className="mt-3 pt-3 border-t border-stone/40">
            <div className="text-xs font-bold text-pearl/80 mb-1">
              {isAr ? 'ملاحظة فريقنا:' : 'Reviewer note:'}
            </div>
            <p className="text-sm text-pearl/70 whitespace-pre-wrap">
              {result.rejectionReason}
            </p>
          </div>
        ) : null}
        <div className="text-[10px] text-muted mt-3">
          #{result.id} ·{' '}
          {isAr ? 'قُدِّم في' : 'Submitted'} {result.createdAt.split('T')[0]}
        </div>
      </div>
    </div>
  );
}

const STATUS_META: Record<
  string,
  {
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    icon: typeof Clock;
    bg: string;
    border: string;
    iconColor: string;
  }
> = {
  submitted: {
    titleAr: 'تم استلام الطلب',
    titleEn: 'Application received',
    bodyAr: 'في انتظار التعيين لمراجع — عادةً يبدأ خلال 24 ساعة من تقديم الطلب.',
    bodyEn: 'Waiting to be assigned to a reviewer — usually starts within 24 hours.',
    icon: Clock,
    bg: 'bg-ember/10',
    border: 'border-ember/30',
    iconColor: 'text-ember',
  },
  in_review: {
    titleAr: 'قيد المراجعة',
    titleEn: 'Under review',
    bodyAr: 'فريقنا يدقِّق الوثائق الآن. ستصلك رسالة فور انتهاء المراجعة.',
    bodyEn: 'Our team is verifying your documents now. You\'ll be notified when it\'s done.',
    icon: Search,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  approved: {
    titleAr: 'تم القبول 🎉',
    titleEn: 'Approved 🎉',
    bodyAr: 'مبروك! تم تفعيل حسابك. حمِّل تطبيق السائق وسجِّل الدخول برقمك.',
    bodyEn: 'Congrats! Your account is active. Download the driver app and sign in with your phone.',
    icon: CheckCircle2,
    bg: 'bg-success/10',
    border: 'border-success/40',
    iconColor: 'text-success',
  },
  rejected: {
    titleAr: 'لم نتمكَّن من القبول',
    titleEn: 'Application not approved',
    bodyAr: 'عذراً، طلبك لم يستوفِ المتطلبات. اطَّلع على ملاحظة المراجع أدناه.',
    bodyEn: 'Sorry, your application didn\'t meet our criteria. See the reviewer note below.',
    icon: XCircle,
    bg: 'bg-danger/10',
    border: 'border-danger/40',
    iconColor: 'text-danger',
  },
  needs_more_info: {
    titleAr: 'نحتاج بيانات إضافية',
    titleEn: 'More info needed',
    bodyAr: 'فريقنا يحتاج توضيحاً أو وثيقة إضافية. تواصل معنا للمتابعة.',
    bodyEn: 'Our team needs a clarification or an extra document. Reach out to continue.',
    icon: ShieldAlert,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
  },
};
