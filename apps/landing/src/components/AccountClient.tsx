'use client';

import { useEffect, useState } from 'react';
import {
  sendOtp,
  verifyOtp,
  fetchMe,
  getToken,
  clearToken,
  fetchServices,
  fetchSavedPlaces,
  routePreview,
  type RiderProfile,
  type WebService,
  type WebSavedPlace,
  type RouteEstimate,
} from '@/lib/riderAuth';

type Step = 'loading' | 'phone' | 'otp' | 'profile';

export function AccountClient({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [step, setStep] = useState<Step>('loading');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── تقدير الأجرة (E3 — قراءة فقط) ──
  const [services, setServices] = useState<WebService[]>([]);
  const [places, setPlaces] = useState<WebSavedPlace[]>([]);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [destId, setDestId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<RouteEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  function loadEstimateData() {
    fetchServices().then((s) => {
      setServices(s);
      if (s.length) setServiceId(s[0].id);
    }).catch(() => {});
    fetchSavedPlaces().then(setPlaces).catch(() => {});
  }

  useEffect(() => {
    if (getToken()) {
      fetchMe()
        .then((p) => {
          setProfile(p);
          setStep('profile');
          loadEstimateData();
        })
        .catch(() => {
          clearToken();
          setStep('phone');
        });
    } else {
      setStep('phone');
    }
  }, []);

  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError(t('الموقع غير مدعوم في متصفحك', 'Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError(t('تعذّر الحصول على موقعك', 'Could not get your location')),
    );
  };

  const calcEstimate = async () => {
    setError(null);
    setEstimate(null);
    const dest = places.find((p) => p.id === destId);
    if (!origin) {
      setError(t('حدّد موقعك الحالي أولاً', 'Set your current location first'));
      return;
    }
    if (!dest || !serviceId) {
      setError(t('اختر الوجهة والخدمة', 'Pick a destination and service'));
      return;
    }
    setEstimating(true);
    try {
      const r = await routePreview(origin, { lat: dest.lat, lng: dest.lng }, serviceId);
      setEstimate(r);
    } catch (e) {
      setError((e as Error).message);
    }
    setEstimating(false);
  };

  const onSendOtp = async () => {
    setError(null);
    const p = phone.trim();
    if (!/^\+\d{8,15}$/.test(p)) {
      setError(t('أدخل رقماً دولياً صحيحاً (+9665…)', 'Enter a valid international number (+9665…)'));
      return;
    }
    setBusy(true);
    try {
      await sendOtp(p);
      setStep('otp');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const onVerify = async () => {
    setError(null);
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await verifyOtp(phone.trim(), code.trim());
      setProfile(res.rider);
      setStep('profile');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const onLogout = () => {
    clearToken();
    setProfile(null);
    setPhone('');
    setCode('');
    setStep('phone');
  };

  const card =
    'mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur';
  const input =
    'w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-orange-500';
  const btn =
    'w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50';

  return (
    <section className="mx-auto max-w-3xl px-4 py-16" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="mb-2 text-center text-3xl font-extrabold text-white">
        {t('حسابي', 'My account')}
      </h1>
      <p className="mb-8 text-center text-white/60">
        {t('سجّل دخولك برقم جوالك عبر رمز التحقق', 'Sign in with your phone via a verification code')}
      </p>

      {error && (
        <div className="mx-auto mb-4 max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === 'loading' && (
        <p className="text-center text-white/50">{t('جارٍ التحميل…', 'Loading…')}</p>
      )}

      {step === 'phone' && (
        <div className={card}>
          <label className="mb-2 block text-sm text-white/70">
            {t('رقم الجوال', 'Phone number')}
          </label>
          <input
            className={input}
            dir="ltr"
            placeholder="+966500000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendOtp()}
          />
          <button className={`${btn} mt-4`} disabled={busy} onClick={onSendOtp}>
            {busy ? t('جارٍ الإرسال…', 'Sending…') : t('إرسال رمز التحقق', 'Send code')}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className={card}>
          <label className="mb-2 block text-sm text-white/70">
            {t('رمز التحقق المُرسَل إلى', 'Code sent to')} <span dir="ltr">{phone}</span>
          </label>
          <input
            className={`${input} text-center tracking-[0.5em]`}
            dir="ltr"
            inputMode="numeric"
            placeholder="------"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onVerify()}
          />
          <button className={`${btn} mt-4`} disabled={busy} onClick={onVerify}>
            {busy ? t('جارٍ التحقق…', 'Verifying…') : t('تأكيد', 'Verify')}
          </button>
          <button
            className="mt-3 w-full text-sm text-white/50 hover:text-white"
            onClick={() => setStep('phone')}
          >
            {t('تغيير الرقم', 'Change number')}
          </button>
        </div>
      )}

      {step === 'profile' && profile && (
        <div className={card}>
          <div className="mb-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-xl font-extrabold text-white">
              {(profile.firstName?.[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {[profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
                  t('راكب HANCR', 'HANCR rider')}
              </div>
              <div className="text-sm text-white/50" dir="ltr">
                {profile.phoneNumber}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label={t('الرصيد', 'Balance')} value={`${profile.balance.toFixed(2)} ${profile.currency}`} />
            <Stat label={t('الرحلات', 'Rides')} value={String(profile.totalRides)} />
            <Stat label={t('التقييم', 'Rating')} value={profile.rating.toFixed(1)} />
          </div>
          <button
            className="mt-6 w-full rounded-xl border border-white/15 px-4 py-3 font-medium text-white/80 hover:bg-white/5"
            onClick={onLogout}
          >
            {t('تسجيل الخروج', 'Log out')}
          </button>
        </div>
      )}

      {step === 'profile' && profile && (
        <div className={`${card} mt-4`}>
          <h2 className="mb-1 text-lg font-bold text-white">
            {t('تقدير رحلة', 'Trip estimate')}
          </h2>
          <p className="mb-4 text-xs text-white/50">
            {t('احسب الأجرة التقديرية من موقعك إلى أحد أماكنك المحفوظة.',
               'Estimate the fare from your location to a saved place.')}
          </p>

          <button
            className="mb-3 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
            onClick={useMyLocation}
          >
            {origin
              ? t('✓ تم تحديد موقعك', '✓ Location set')
              : t('📍 استخدم موقعي الحالي', '📍 Use my current location')}
          </button>

          {places.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
              {t('لا أماكن محفوظة بعد — أضِفها من التطبيق لتقدير الرحلات.',
                 'No saved places yet — add them in the app to estimate trips.')}
            </p>
          ) : (
            <>
              <label className="mb-1 block text-xs text-white/60">
                {t('الوجهة', 'Destination')}
              </label>
              <select
                className={`${input} mb-3`}
                value={destId ?? ''}
                onChange={(e) => setDestId(Number(e.target.value) || null)}
              >
                <option value="">{t('اختر مكاناً', 'Pick a place')}</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              <label className="mb-1 block text-xs text-white/60">
                {t('الخدمة', 'Service')}
              </label>
              <select
                className={`${input} mb-4`}
                value={serviceId ?? ''}
                onChange={(e) => setServiceId(Number(e.target.value) || null)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isAr ? s.name : s.nameEn ?? s.name}
                  </option>
                ))}
              </select>

              <button className={btn} disabled={estimating} onClick={calcEstimate}>
                {estimating ? t('جارٍ الحساب…', 'Calculating…') : t('احسب الأجرة', 'Estimate fare')}
              </button>
            </>
          )}

          {estimate && (
            <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <div className="text-2xl font-extrabold text-white">
                {estimate.estimatedFare.toFixed(2)} {estimate.currency}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {(estimate.distanceMeters / 1000).toFixed(1)} {t('كم', 'km')} ·{' '}
                {Math.round(estimate.durationSeconds / 60)} {t('دقيقة', 'min')}
              </div>
              <p className="mt-3 text-xs text-white/50">
                {t('أكمل الحجز الفعلي من تطبيق HANCR.',
                   'Complete the actual booking in the HANCR app.')}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-base font-bold text-white">{value}</div>
      <div className="mt-0.5 text-xs text-white/50">{label}</div>
    </div>
  );
}
