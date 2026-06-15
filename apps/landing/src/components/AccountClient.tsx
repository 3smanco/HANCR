'use client';

import { useEffect, useRef, useState } from 'react';
import {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
  googleAuth,
  logout,
  fetchMe,
  getToken,
  clearToken,
  fetchServices,
  fetchSavedPlaces,
  routePreview,
  createOrder,
  nearestRegion,
  type RiderProfile,
  type WebService,
  type WebSavedPlace,
  type RouteEstimate,
  type WebAuthResult,
} from '@/lib/riderAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWin = any;

/** يحمّل Google Identity Services مرّة واحدة. */
let gisPromise: Promise<void> | null = null;
function loadGoogleIdentity(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as AnyWin;
  if (w.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('GIS failed to load'));
    document.head.appendChild(s);
  });
  return gisPromise;
}

/** يحمّل Google Maps JS (مكتبة الأماكن) مرّة واحدة ويُرجع وعداً بالجاهزية. */
let mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as AnyWin;
  if (w.google?.maps?.places) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
  mapsPromise = new Promise<void>((resolve, reject) => {
    if (!key) {
      reject(new Error('Maps key missing'));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&language=ar`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Maps failed to load'));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// نمط خريطة داكن مطابق لهوية HANCR (ember/obsidian).
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#13100E' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#C9BDB6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0807' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#332C28' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A4039' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#16243A' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

type Step = 'loading' | 'phone' | 'otp' | 'email' | 'email-otp' | 'profile';

// مؤشّر تقدّم من 3 خطوات (دخول → رمز → ملف). loading/profile خارج المؤشّر.
const TOTAL_STEPS = 3;
const STEP_INDEX: Record<Step, number> = {
  loading: 0,
  phone: 1,
  email: 1,
  otp: 2,
  'email-otp': 2,
  profile: 3,
};

const RESEND_COOLDOWN = 30; // ثانية

/**
 * يحوّل خطأ `gql()` المُصنَّف (NETWORK_ERROR / SERVER_ERROR:status / VALIDATION:msg)
 * إلى رسالة عربية/إنجليزية مفهومة للمستخدم بدل تسريب نص تقني خام.
 */
function describeError(e: unknown, isAr: boolean): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === 'NETWORK_ERROR') {
    return isAr
      ? 'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت وحاول مجدداً.'
      : 'Could not reach the server. Check your connection and try again.';
  }
  if (msg.startsWith('SERVER_ERROR')) {
    return isAr
      ? 'حدث خطأ في الخادم. حاول بعد قليل.'
      : 'A server error occurred. Please try again shortly.';
  }
  if (msg.startsWith('VALIDATION:')) {
    // رسالة الخادم بعد البادئة — قابلة للعرض مباشرةً.
    return msg.slice('VALIDATION:'.length);
  }
  return msg;
}

export function AccountClient({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [step, setStep] = useState<Step>('loading');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  // عند true: شاشة الهاتف لإكمال حساب Google/الإيميل (ربط) لا دخول جديد
  const [linkMode, setLinkMode] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // عدّاد تنازلي لإعادة إرسال رمز التحقق (هاتف/إيميل).
  const [cooldown, setCooldown] = useState(0);

  // ── الحجز من الويب (E3) ──
  const [services, setServices] = useState<WebService[]>([]);
  const [places, setPlaces] = useState<WebSavedPlace[]>([]);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [regionCurrency, setRegionCurrency] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoord, setDestCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [destAddress, setDestAddress] = useState('');
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<RouteEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [mapsError, setMapsError] = useState(false);
  const destInputRef = useRef<HTMLInputElement | null>(null);
  // الخريطة البصرية
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<AnyWin>(null);
  const originMarkerRef = useRef<AnyWin>(null);
  const destMarkerRef = useRef<AnyWin>(null);
  const routeLineRef = useRef<AnyWin>(null);
  const orderIdRef = useRef<number | null>(null);
  orderIdRef.current = orderId;

  // مؤقّت العدّ التنازلي لإعادة الإرسال.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function loadSavedPlaces() {
    fetchSavedPlaces().then(setPlaces).catch(() => {});
  }

  /** يجلب خدمات المنطقة بعد تحديد regionId عبر nearestRegion. */
  async function loadServicesForRegion(rid: number) {
    try {
      const s = await fetchServices(rid);
      setServices(s);
      setServiceId(s.length ? s[0].id : null);
    } catch {
      setServices([]);
      setServiceId(null);
    }
  }

  useEffect(() => {
    if (getToken()) {
      fetchMe()
        .then((p) => {
          setProfile(p);
          setStep('profile');
          loadSavedPlaces();
        })
        .catch(() => {
          clearToken();
          setStep('phone');
        });
    } else {
      setStep('phone');
    }
  }, []);

  // ربط Google Places Autocomplete بحقل الوجهة عند ظهور لوحة الحساب
  useEffect(() => {
    if (step !== 'profile') return;
    loadGoogleMaps()
      .then(() => {
        const w = window as AnyWin;
        if (!w.google?.maps?.places || !destInputRef.current) return;
        const ac = new w.google.maps.places.Autocomplete(destInputRef.current, {
          fields: ['geometry', 'formatted_address', 'name'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (loc) {
            setDestCoord({ lat: loc.lat(), lng: loc.lng() });
            setDestAddress(place.formatted_address || place.name || '');
            setEstimate(null);
            setOrderId(null);
          }
        });
        setMapsError(false);
      })
      // لا نبتلع الفشل: نُظهر للمستخدم أن بحث الوجهة غير متاح (مفتاح خرائط/شبكة).
      .catch(() => setMapsError(true));
  }, [step]);

  // خريطة بصرية: علامتا الانطلاق (A أخضر) والوجهة (برتقالي) + خط المسار +
  // النقر على الخريطة يحدّد الوجهة. تُحدَّث عند تغيّر النقاط أو التقدير.
  useEffect(() => {
    if (step !== 'profile') return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        const g = (window as AnyWin).google?.maps;
        if (!g || !mapRef.current) return;

        if (!mapObjRef.current) {
          mapObjRef.current = new g.Map(mapRef.current, {
            center: origin ?? { lat: 25.2854, lng: 51.531 }, // الدوحة افتراضياً
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            styles: DARK_MAP_STYLE,
          });
          mapObjRef.current.addListener('click', (e: AnyWin) => {
            if (orderIdRef.current) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setDestCoord({ lat, lng });
            setDestAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            if (destInputRef.current)
              destInputRef.current.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setEstimate(null);
            setOrderId(null);
          });
        }
        const map = mapObjRef.current;

        const dot = (color: string) => ({
          path: g.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        });

        if (origin) {
          if (!originMarkerRef.current)
            originMarkerRef.current = new g.Marker({ map, position: origin, icon: dot('#10B981') });
          else originMarkerRef.current.setPosition(origin);
        }
        if (destCoord) {
          if (!destMarkerRef.current)
            destMarkerRef.current = new g.Marker({ map, position: destCoord, icon: dot('#FF7A1A') });
          else destMarkerRef.current.setPosition(destCoord);
        }

        if (routeLineRef.current) {
          routeLineRef.current.setMap(null);
          routeLineRef.current = null;
        }
        if (estimate?.polyline && g.geometry?.encoding) {
          routeLineRef.current = new g.Polyline({
            map,
            path: g.geometry.encoding.decodePath(estimate.polyline),
            strokeColor: '#FF7A1A',
            strokeWeight: 4,
            strokeOpacity: 0.9,
          });
        }

        if (origin && destCoord) {
          const b = new g.LatLngBounds();
          b.extend(origin);
          b.extend(destCoord);
          map.fitBounds(b, 60);
        } else if (origin) {
          map.setCenter(origin);
          map.setZoom(14);
        } else if (destCoord) {
          map.setCenter(destCoord);
          map.setZoom(14);
        }
      })
      .catch(() => setMapsError(true));
    return () => {
      cancelled = true;
    };
  }, [step, origin, destCoord, estimate]);

  const pickSavedPlace = (p: WebSavedPlace) => {
    setDestCoord({ lat: p.lat, lng: p.lng });
    setDestAddress(p.address || p.label);
    if (destInputRef.current) destInputRef.current.value = p.address || p.label;
    setEstimate(null);
    setOrderId(null);
  };

  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError(t('الموقع غير مدعوم في متصفحك', 'Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOrigin({ lat, lng });
        nearestRegion(lat, lng)
          .then((region) => {
            if (region) {
              setRegionId(region.id);
              setRegionCurrency(region.currency);
              loadServicesForRegion(region.id);
            } else {
              setRegionId(null);
              setRegionCurrency(null);
              setServices([]);
              setServiceId(null);
              setError(
                t('عذراً، الخدمة غير متاحة في موقعك حالياً.',
                  'Sorry, service is not yet available at your location.'),
              );
            }
          })
          .catch(() => {
            setError(t('تعذّر تحديد منطقة الخدمة', 'Could not determine your service area'));
          });
      },
      () => setError(t('تعذّر الحصول على موقعك', 'Could not get your location')),
    );
  };

  const calcEstimate = async () => {
    setError(null);
    setEstimate(null);
    if (!origin) {
      setError(t('حدّد موقعك الحالي أولاً', 'Set your current location first'));
      return;
    }
    if (!destCoord || !serviceId) {
      setError(t('اختر الوجهة والخدمة', 'Pick a destination and service'));
      return;
    }
    setEstimating(true);
    try {
      const r = await routePreview(origin, destCoord, serviceId);
      setEstimate(r);
    } catch (e) {
      setError(describeError(e, isAr));
    }
    setEstimating(false);
  };

  const doBook = async () => {
    setError(null);
    if (!origin || !destCoord || !serviceId || !regionId) {
      setError(t('أكمل بيانات الرحلة أولاً', 'Complete the trip details first'));
      return;
    }
    setBooking(true);
    try {
      const order = await createOrder({
        origin,
        destination: destCoord,
        originAddress: t('موقعي الحالي', 'My current location'),
        destinationAddress: destAddress || t('وجهة', 'Destination'),
        serviceId,
        regionId,
      });
      setOrderId(order.id);
      setOrderStatus(order.status);
    } catch (e) {
      setError(describeError(e, isAr));
    }
    setBooking(false);
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
      const res = await sendOtp(p);
      if (res.success) {
        setStep('otp');
        setCooldown(RESEND_COOLDOWN);
      } else {
        // الـ backend صادق الآن: success=false يعني لم يُرسَل (لا ننتقل لشاشة الرمز).
        setError(
          res.message ||
            t('تعذّر إرسال رمز التحقق حالياً. حاول لاحقاً.',
              'Could not send the verification code right now. Try again later.'),
        );
      }
    } catch (e) {
      setError(describeError(e, isAr));
    }
    setBusy(false);
  };

  const onVerify = async () => {
    setError(null);
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await verifyOtp(phone.trim(), code.trim());
      setLinkMode(false);
      setProfile(res.rider);
      setStep('profile');
    } catch (e) {
      setError(describeError(e, isAr));
    }
    setBusy(false);
  };

  // نتيجة موحّدة لدخول الإيميل/Google: دخول كامل أو ربط هاتف
  const applyAuthResult = (res: WebAuthResult) => {
    if (!res.success) {
      setError(
        res.message ||
          t('فشل الدخول. حاول مجدداً.', 'Sign-in failed. Try again.'),
      );
      return;
    }
    if (res.needsPhone) {
      setLinkMode(true);
      setCode('');
      setPhone('');
      setStep('phone');
      return;
    }
    if (res.rider) {
      setProfile(res.rider);
      setStep('profile');
    }
  };

  const onSendEmailOtp = async () => {
    setError(null);
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setError(t('أدخل بريداً صحيحاً', 'Enter a valid email'));
      return;
    }
    setBusy(true);
    try {
      const res = await sendEmailOtp(e);
      if (res.success) {
        setStep('email-otp');
        setCooldown(RESEND_COOLDOWN);
      } else {
        setError(res.message || t('تعذّر إرسال الرمز.', 'Could not send the code.'));
      }
    } catch (err) {
      setError(describeError(err, isAr));
    }
    setBusy(false);
  };

  const onVerifyEmailOtp = async () => {
    setError(null);
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), code.trim());
      applyAuthResult(res);
    } catch (err) {
      setError(describeError(err, isAr));
    }
    setBusy(false);
  };

  // Google Identity Services — يُهيّأ ويُرسم الزرّ عند شاشة الدخول الأولى
  useEffect(() => {
    if (step !== 'phone' || linkMode) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
    if (!clientId) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !googleBtnRef.current) return;
        const w = window as AnyWin;
        w.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: { credential: string }) => {
            setError(null);
            setBusy(true);
            try {
              const res = await googleAuth(resp.credential);
              applyAuthResult(res);
            } catch (err) {
              setError(describeError(err, isAr));
            }
            setBusy(false);
          },
        });
        googleBtnRef.current.innerHTML = '';
        w.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        });
      })
      .catch(() => {
        /* GIS لم يُحمّل — يبقى الهاتف والإيميل متاحين */
      });
    return () => {
      cancelled = true;
    };
  }, [step, linkMode]);

  const onLogout = async () => {
    await logout();
    setProfile(null);
    setPhone('');
    setCode('');
    setEmail('');
    setLinkMode(false);
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
      <p className="mb-6 text-center text-white/60">
        {t('سجّل دخولك برقم جوالك عبر رمز التحقق', 'Sign in with your phone via a verification code')}
      </p>

      {STEP_INDEX[step] >= 1 && STEP_INDEX[step] <= TOTAL_STEPS && step !== 'profile' && (
        <div className="mx-auto mb-6 flex max-w-md items-center gap-2" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const n = i + 1;
            const active = STEP_INDEX[step] >= n;
            return (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full transition ${
                  active ? 'bg-orange-500' : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>
      )}

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
          {linkMode && (
            <div className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
              <div className="font-bold">
                {t('خطوة أخيرة: أضف رقم هاتفك',
                   'One last step: add your phone number')}
              </div>
              <p className="mt-1 text-orange-200/80">
                {t(
                  'نربط رقم هاتفك بحسابك لتأمينه، ولنتمكّن من التواصل معك والسائق أثناء الرحلة. سنرسل لك رمز تحقق لمرّة واحدة.',
                  'We link a phone number to your account to secure it and to connect you with your driver during trips. We\'ll send a one-time verification code.',
                )}
              </p>
            </div>
          )}
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

          {!linkMode && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                {t('أو', 'or')}
                <span className="h-px flex-1 bg-white/10" />
              </div>
              {/* زرّ Google (Google Identity Services) */}
              <div ref={googleBtnRef} className="flex justify-center" />
              <button
                className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 font-semibold text-white transition hover:bg-white/5"
                onClick={() => {
                  setError(null);
                  setCode('');
                  setStep('email');
                }}
              >
                {t('الدخول عبر البريد الإلكتروني', 'Continue with email')}
              </button>
            </>
          )}
        </div>
      )}

      {step === 'email' && (
        <div className={card}>
          <label className="mb-2 block text-sm text-white/70">
            {t('البريد الإلكتروني', 'Email')}
          </label>
          <input
            className={input}
            dir="ltr"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendEmailOtp()}
          />
          <button
            className={`${btn} mt-4`}
            disabled={busy}
            onClick={onSendEmailOtp}
          >
            {busy ? t('جارٍ الإرسال…', 'Sending…') : t('إرسال الرمز', 'Send code')}
          </button>
          <button
            className="mt-3 w-full text-sm text-white/50 hover:text-white"
            onClick={() => setStep('phone')}
          >
            {t('الرجوع', 'Back')}
          </button>
        </div>
      )}

      {step === 'email-otp' && (
        <div className={card}>
          <label className="mb-2 block text-sm text-white/70">
            {t('الرمز المُرسَل إلى', 'Code sent to')} <span dir="ltr">{email}</span>
          </label>
          <input
            className={`${input} text-center tracking-[0.5em]`}
            dir="ltr"
            inputMode="numeric"
            placeholder="------"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onVerifyEmailOtp()}
          />
          <button
            className={`${btn} mt-4`}
            disabled={busy}
            onClick={onVerifyEmailOtp}
          >
            {busy ? t('جارٍ التحقق…', 'Verifying…') : t('تأكيد', 'Verify')}
          </button>
          <button
            className="mt-3 w-full text-sm text-white/50 hover:text-white disabled:opacity-40"
            disabled={busy || cooldown > 0}
            onClick={onSendEmailOtp}
          >
            {cooldown > 0
              ? t(`إعادة الإرسال خلال ${cooldown} ث`, `Resend in ${cooldown}s`)
              : t('إعادة إرسال الرمز', 'Resend code')}
          </button>
          <button
            className="mt-1 w-full text-sm text-white/50 hover:text-white"
            onClick={() => { setCooldown(0); setStep('email'); }}
          >
            {t('تغيير البريد', 'Change email')}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className={card}>
          {linkMode && (
            <div className="mb-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
              {t('نؤكّد رقم هاتفك لربطه بحسابك.',
                 'We\'re confirming your phone to link it to your account.')}
            </div>
          )}
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
            className="mt-3 w-full text-sm text-white/50 hover:text-white disabled:opacity-40"
            disabled={busy || cooldown > 0}
            onClick={onSendOtp}
          >
            {cooldown > 0
              ? t(`إعادة الإرسال خلال ${cooldown} ث`, `Resend in ${cooldown}s`)
              : t('إعادة إرسال الرمز', 'Resend code')}
          </button>
          <button
            className="mt-1 w-full text-sm text-white/50 hover:text-white"
            onClick={() => { setCooldown(0); setStep('phone'); }}
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
            {t('احجز رحلة', 'Book a ride')}
          </h2>
          <p className="mb-3 text-xs text-white/50">
            {t('من موقعك الحالي إلى أي وجهة — احسب الأجرة ثم احجز.',
               'From your location to any destination — estimate then book.')}
          </p>

          <div
            ref={mapRef}
            className="mb-2 h-56 w-full overflow-hidden rounded-xl border border-white/10 bg-black/30"
            aria-label={t('خريطة الحجز', 'Booking map')}
          />
          {!orderId && (
            <p className="mb-3 text-[11px] text-white/40">
              {t('انقر على الخريطة لتحديد الوجهة، أو ابحث عنها بالأسفل.',
                 'Tap the map to set the destination, or search below.')}
            </p>
          )}

          {orderId ? (
            (() => {
              const noDriver =
                orderStatus === 'NotFound' || orderStatus === 'NoCloseFound';
              return (
                <div
                  className={`rounded-xl border p-5 text-center ${
                    noDriver
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-green-500/30 bg-green-500/10'
                  }`}
                >
                  <div className="text-lg font-extrabold text-white">
                    {noDriver
                      ? t('لا سائقين متاحين قربك الآن', 'No drivers available nearby right now')
                      : t('تم إنشاء طلبك ✓', 'Your ride is requested ✓')}
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    {t('رقم الطلب', 'Order')} #{orderId}
                  </div>
                  <p className="mt-3 text-xs text-white/50">
                    {noDriver
                      ? t('حاول بعد قليل أو من تطبيق HANCR.',
                          'Try again shortly, or from the HANCR app.')
                      : t('تابع رحلتك وحالة السائق من تطبيق HANCR.',
                          'Track your ride and driver status in the HANCR app.')}
                  </p>
                  <button
                    className="mt-4 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
                    onClick={() => { setOrderId(null); setOrderStatus(null); setEstimate(null); }}
                  >
                    {t('حجز رحلة أخرى', 'Book another ride')}
                  </button>
                </div>
              );
            })()
          ) : (
            <>
              <button
                className="mb-3 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
                onClick={useMyLocation}
              >
                {origin
                  ? t('✓ تم تحديد موقعك', '✓ Location set')
                  : t('📍 استخدم موقعي الحالي', '📍 Use my current location')}
              </button>

              <label className="mb-1 block text-xs text-white/60">
                {t('الوجهة', 'Destination')}
              </label>
              <input
                ref={destInputRef}
                className={`${input} mb-2`}
                placeholder={t('ابحث عن وجهة…', 'Search a destination…')}
                onChange={() => { setDestCoord(null); setEstimate(null); }}
              />
              {mapsError && (
                <p className="mb-2 text-xs text-amber-300">
                  {t('تعذّر تحميل بحث الخرائط. اختر من أماكنك المحفوظة أو استخدم التطبيق.',
                     'Map search failed to load. Pick a saved place or use the app.')}
                </p>
              )}
              {places.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {places.map((p) => (
                    <button
                      key={p.id}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-orange-500 hover:text-white"
                      onClick={() => pickSavedPlace(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              <label className="mb-1 block text-xs text-white/60">
                {t('الخدمة', 'Service')}
              </label>
              {!origin ? (
                <p className="mb-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
                  {t('حدّد موقعك لعرض الخدمات المتاحة.',
                     'Set your location to see available services.')}
                </p>
              ) : services.length === 0 ? (
                <p className="mb-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
                  {t('لا خدمات متاحة في منطقتك حالياً.',
                     'No services available in your area right now.')}
                </p>
              ) : (
                <>
                  <select
                    className={`${input} mb-2`}
                    value={serviceId ?? ''}
                    onChange={(e) => setServiceId(Number(e.target.value) || null)}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {isAr ? s.name : s.nameEn ?? s.name}
                      </option>
                    ))}
                  </select>
                  {regionCurrency && (
                    <p className="mb-2 text-[11px] text-white/40">
                      {t(`الأسعار بعملة ${regionCurrency}`, `Prices shown in ${regionCurrency}`)}
                    </p>
                  )}
                </>
              )}

              <button className={btn} disabled={estimating || !destCoord || !serviceId} onClick={calcEstimate}>
                {estimating ? t('جارٍ الحساب…', 'Calculating…') : t('احسب الأجرة', 'Estimate fare')}
              </button>

              {estimate && (
                <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center">
                  <div className="text-2xl font-extrabold text-white">
                    {estimate.estimatedFare.toFixed(2)} {estimate.currency}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {(estimate.distanceMeters / 1000).toFixed(1)} {t('كم', 'km')} ·{' '}
                    {Math.round(estimate.durationSeconds / 60)} {t('دقيقة', 'min')}
                  </div>
                  <button
                    className={`${btn} mt-4`}
                    disabled={booking}
                    onClick={doBook}
                  >
                    {booking ? t('جارٍ الحجز…', 'Booking…') : t('احجز الآن', 'Book now')}
                  </button>
                </div>
              )}
            </>
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
