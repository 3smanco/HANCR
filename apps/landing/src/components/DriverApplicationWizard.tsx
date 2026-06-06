'use client';

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  CheckCircle2,
  CircleDot,
  Loader2,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import { type Locale, translator } from '@/i18n/messages';

// ── GraphQL ────────────────────────────────────────────────────────────────

const GEN_UPLOAD_URL = gql`
  mutation GenAppUploadUrl($input: GenerateApplicationDocUploadUrlInput!) {
    generateApplicationDocUploadUrl(input: $input) {
      uploadUrl
      publicUrl
      objectKey
    }
  }
`;

const SUBMIT_APPLICATION = gql`
  mutation SubmitApp($input: SubmitDriverApplicationInput!) {
    submitDriverApplication(input: $input) {
      id
      status
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

type DocType =
  | 'national_id'
  | 'license'
  | 'vehicle_registration'
  | 'insurance'
  | 'profile_photo';

interface DocSlot {
  type: DocType;
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
  required: boolean;
}

const DOCS: DocSlot[] = [
  {
    type: 'national_id',
    labelAr: 'الهوية الوطنية',
    labelEn: 'National ID',
    hintAr: 'الوجه الذي يحمل الصورة',
    hintEn: 'Photo side, both sides accepted',
    required: true,
  },
  {
    type: 'license',
    labelAr: 'رخصة القيادة',
    labelEn: 'Driving License',
    hintAr: 'رخصة سارية المفعول',
    hintEn: 'Must be currently valid',
    required: true,
  },
  {
    type: 'vehicle_registration',
    labelAr: 'استمارة السيارة',
    labelEn: 'Vehicle Registration',
    hintAr: 'سارية المفعول',
    hintEn: 'Currently valid',
    required: true,
  },
  {
    type: 'insurance',
    labelAr: 'تأمين السيارة',
    labelEn: 'Vehicle Insurance',
    hintAr: 'تأمين شامل سارٍ',
    hintEn: 'Comprehensive cover, valid',
    required: true,
  },
  {
    type: 'profile_photo',
    labelAr: 'صورة شخصية',
    labelEn: 'Profile Photo',
    hintAr: 'صورة واضحة للوجه',
    hintEn: 'A clear face photo',
    required: true,
  },
];

interface Personal {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  nationalIdNumber: string;
  dateOfBirth: string;
}

interface Vehicle {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  plateNumber: string;
}

type UploadedDocs = Partial<Record<DocType, { publicUrl: string; fileName: string }>>;

// ── Component ──────────────────────────────────────────────────────────────

export function DriverApplicationWizard({ locale }: { locale: Locale }) {
  const tt = translator(locale);
  const isAr = locale === 'ar';

  const [step, setStep] = useState(0); // 0..3
  const [personal, setPersonal] = useState<Personal>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    nationalIdNumber: '',
    dateOfBirth: '',
  });
  const [vehicle, setVehicle] = useState<Vehicle>({
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: '',
  });
  const [docs, setDocs] = useState<UploadedDocs>({});
  const [submitted, setSubmitted] = useState<{ id: number } | null>(null);

  const [generateUrl] = useMutation(GEN_UPLOAD_URL);
  const [submit, { loading: submitting, error: submitError }] = useMutation(
    SUBMIT_APPLICATION,
    {
      onCompleted: (data) => {
        setSubmitted({ id: data.submitDriverApplication.id });
      },
    },
  );

  // ── Validators ──
  const personalValid =
    personal.fullName.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email) &&
    /^\+?[0-9]{8,20}$/.test(personal.phone.replace(/\s/g, '')) &&
    personal.city.trim().length > 0;

  const vehicleValid =
    vehicle.vehicleBrand.trim().length > 0 &&
    vehicle.vehicleModel.trim().length > 0 &&
    /^[0-9]{4}$/.test(vehicle.vehicleYear) &&
    Number(vehicle.vehicleYear) >= 2010 &&
    Number(vehicle.vehicleYear) <= new Date().getFullYear() + 1 &&
    vehicle.plateNumber.trim().length > 0;

  const docsValid = DOCS.filter((d) => d.required).every((d) => !!docs[d.type]);

  if (submitted) {
    return <Success locale={locale} applicationId={submitted.id} />;
  }

  return (
    <div className="bg-ash/60 border border-stone/60 rounded-2xl p-6 sm:p-8">
      {/* ── Stepper ── */}
      <Stepper step={step} isAr={isAr} />

      <div className="mt-8">
        {step === 0 && (
          <StepPersonal
            locale={locale}
            value={personal}
            onChange={setPersonal}
          />
        )}
        {step === 1 && (
          <StepVehicle
            locale={locale}
            value={vehicle}
            onChange={setVehicle}
          />
        )}
        {step === 2 && (
          <StepDocuments
            locale={locale}
            docs={docs}
            onDocUploaded={(type, info) =>
              setDocs((prev) => ({ ...prev, [type]: info }))
            }
            generateUrl={async (input) => {
              const res = await generateUrl({ variables: { input } });
              return res.data!.generateApplicationDocUploadUrl;
            }}
          />
        )}
        {step === 3 && (
          <StepReview locale={locale} personal={personal} vehicle={vehicle} docs={docs} />
        )}
      </div>

      {submitError ? (
        <p className="text-danger text-sm mt-4">{tt('common.error')}</p>
      ) : null}

      {/* ── Navigation ── */}
      <div className="mt-8 pt-6 border-t border-stone/40 flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone hover:border-ember/50 hover:text-ember disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isAr ? 'السابق' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 0 && !personalValid) ||
              (step === 1 && !vehicleValid) ||
              (step === 2 && !docsValid)
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ember hover:bg-ember-deep text-pearl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-ember"
          >
            {isAr ? 'التالي' : 'Next'}
            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting || !personalValid || !vehicleValid || !docsValid}
            onClick={() =>
              submit({
                variables: {
                  input: {
                    ...personal,
                    fullName: personal.fullName.trim(),
                    email: personal.email.trim(),
                    phone: personal.phone.replace(/\s/g, ''),
                    city: personal.city.trim() || undefined,
                    nationalIdNumber: personal.nationalIdNumber.trim() || undefined,
                    dateOfBirth: personal.dateOfBirth || undefined,
                    vehicleBrand: vehicle.vehicleBrand.trim(),
                    vehicleModel: vehicle.vehicleModel.trim(),
                    vehicleYear: Number(vehicle.vehicleYear),
                    vehicleColor: vehicle.vehicleColor.trim() || undefined,
                    plateNumber: vehicle.plateNumber.trim(),
                    docNationalIdUrl: docs.national_id?.publicUrl,
                    docLicenseUrl: docs.license?.publicUrl,
                    docVehicleRegistrationUrl: docs.vehicle_registration?.publicUrl,
                    docInsuranceUrl: docs.insurance?.publicUrl,
                    docProfilePhotoUrl: docs.profile_photo?.publicUrl,
                  },
                },
              })
            }
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ember hover:bg-ember-deep text-pearl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-ember"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {tt('common.loading')}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? 'إرسال الطلب' : 'Submit application'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Stepper indicator ──────────────────────────────────────────────────────

function Stepper({ step, isAr }: { step: number; isAr: boolean }) {
  const labels = isAr
    ? ['البيانات الشخصية', 'بيانات السيارة', 'الوثائق', 'المراجعة']
    : ['Personal info', 'Vehicle info', 'Documents', 'Review'];
  const icons = [User, Car, Upload, ShieldCheck];
  return (
    <ol className="flex items-start gap-2 sm:gap-3 overflow-x-auto">
      {labels.map((label, idx) => {
        const Icon = icons[idx];
        const done = idx < step;
        const active = idx === step;
        return (
          <li key={label} className="flex items-start gap-2 flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full grid place-items-center text-xs font-bold transition ${
                  done
                    ? 'bg-success/20 text-success border border-success/40'
                    : active
                      ? 'bg-ember text-pearl shadow-ember'
                      : 'bg-ash border border-stone text-muted'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1.5 text-center max-w-[80px] leading-tight ${
                  active ? 'text-pearl font-bold' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < labels.length - 1 ? (
              <div
                className={`flex-1 h-px mt-4 ${done ? 'bg-success/40' : 'bg-stone'}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

// ── Step 1 — Personal ──────────────────────────────────────────────────────

function StepPersonal({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: Personal;
  onChange: (p: Personal) => void;
}) {
  const tt = translator(locale);
  const isAr = locale === 'ar';
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold text-pearl">
        {isAr ? 'من نتعامل معه؟' : 'Tell us about yourself'}
      </h3>
      <p className="text-muted text-sm">
        {isAr
          ? 'استخدم بياناتك كما تظهر في وثائقك الرسمية.'
          : 'Use details exactly as they appear on your official documents.'}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <TextField
          label={tt('common.name')}
          value={value.fullName}
          onChange={(v) => onChange({ ...value, fullName: v })}
          required
        />
        <TextField
          label={tt('common.email')}
          type="email"
          value={value.email}
          onChange={(v) => onChange({ ...value, email: v })}
          required
        />
        <TextField
          label={tt('common.phone')}
          type="tel"
          placeholder="+9665…"
          value={value.phone}
          onChange={(v) => onChange({ ...value, phone: v })}
          required
        />
        <TextField
          label={tt('common.city')}
          value={value.city}
          onChange={(v) => onChange({ ...value, city: v })}
          required
        />
        <TextField
          label={isAr ? 'رقم الهوية الوطنية' : 'National ID number'}
          value={value.nationalIdNumber}
          onChange={(v) => onChange({ ...value, nationalIdNumber: v })}
        />
        <TextField
          label={isAr ? 'تاريخ الميلاد' : 'Date of birth'}
          type="date"
          value={value.dateOfBirth}
          onChange={(v) => onChange({ ...value, dateOfBirth: v })}
        />
      </div>
    </div>
  );
}

// ── Step 2 — Vehicle ───────────────────────────────────────────────────────

function StepVehicle({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: Vehicle;
  onChange: (v: Vehicle) => void;
}) {
  const isAr = locale === 'ar';
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold text-pearl">
        {isAr ? 'بيانات سيارتك' : 'Your vehicle'}
      </h3>
      <p className="text-muted text-sm">
        {isAr
          ? 'موديل 2014 أو أحدث، استمارة سارية، وتأمين شامل.'
          : 'Model 2014 or newer, valid registration, comprehensive insurance.'}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <TextField
          label={isAr ? 'الماركة' : 'Brand'}
          placeholder={isAr ? 'مثلاً Toyota' : 'e.g. Toyota'}
          value={value.vehicleBrand}
          onChange={(v) => onChange({ ...value, vehicleBrand: v })}
          required
        />
        <TextField
          label={isAr ? 'الموديل' : 'Model'}
          placeholder={isAr ? 'مثلاً Camry' : 'e.g. Camry'}
          value={value.vehicleModel}
          onChange={(v) => onChange({ ...value, vehicleModel: v })}
          required
        />
        <TextField
          label={isAr ? 'سنة الصنع' : 'Year'}
          type="number"
          placeholder="2020"
          value={value.vehicleYear}
          onChange={(v) => onChange({ ...value, vehicleYear: v })}
          required
        />
        <TextField
          label={isAr ? 'اللون' : 'Color'}
          value={value.vehicleColor}
          onChange={(v) => onChange({ ...value, vehicleColor: v })}
        />
        <div className="sm:col-span-2">
          <TextField
            label={isAr ? 'رقم اللوحة' : 'Plate number'}
            placeholder={isAr ? 'مثلاً ABC 1234' : 'e.g. ABC 1234'}
            value={value.plateNumber}
            onChange={(v) => onChange({ ...value, plateNumber: v })}
            required
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Documents ─────────────────────────────────────────────────────

function StepDocuments({
  locale,
  docs,
  onDocUploaded,
  generateUrl,
}: {
  locale: Locale;
  docs: UploadedDocs;
  onDocUploaded: (
    type: DocType,
    info: { publicUrl: string; fileName: string },
  ) => void;
  generateUrl: (input: {
    type: DocType;
    contentType: string;
  }) => Promise<{ uploadUrl: string; publicUrl: string; objectKey: string }>;
}) {
  const isAr = locale === 'ar';
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold text-pearl">
        {isAr ? 'الوثائق المطلوبة' : 'Required documents'}
      </h3>
      <p className="text-muted text-sm">
        {isAr
          ? 'كل البيانات سرية. صور واضحة JPG/PNG/PDF — كل ملف حتى 10 ميغا.'
          : 'All data is confidential. Clear JPG/PNG/PDF — up to 10 MB each.'}
      </p>

      <div className="space-y-3 pt-2">
        {DOCS.map((doc) => (
          <DocUploadSlot
            key={doc.type}
            doc={doc}
            uploaded={docs[doc.type]}
            isAr={isAr}
            generateUrl={generateUrl}
            onUploaded={(info) => onDocUploaded(doc.type, info)}
          />
        ))}
      </div>
    </div>
  );
}

function DocUploadSlot({
  doc,
  uploaded,
  isAr,
  generateUrl,
  onUploaded,
}: {
  doc: DocSlot;
  uploaded?: { publicUrl: string; fileName: string };
  isAr: boolean;
  generateUrl: (input: {
    type: DocType;
    contentType: string;
  }) => Promise<{ uploadUrl: string; publicUrl: string; objectKey: string }>;
  onUploaded: (info: { publicUrl: string; fileName: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputId = `doc-${doc.type}`;

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const contentType =
        file.type && file.type.match(/^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/)
          ? file.type
          : 'image/jpeg';
      const sign = await generateUrl({ type: doc.type, contentType });

      // Real PUT to GCS — skipped for the dev placeholder.
      if (sign.uploadUrl.startsWith('http')) {
        const put = await fetch(sign.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file,
        });
        if (!put.ok) throw new Error(`upload failed (${put.status})`);
      }

      onUploaded({ publicUrl: sign.publicUrl, fileName: file.name });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition ${
        uploaded
          ? 'border-success/40 bg-success/5'
          : busy
            ? 'border-ember/40 bg-ember/5'
            : 'border-stone/60 bg-obsidian/40 hover:border-ember/40'
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <label htmlFor={inputId} className="flex items-center gap-3 cursor-pointer">
        <div
          className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${
            uploaded
              ? 'bg-success/15 text-success'
              : busy
                ? 'bg-ember/15 text-ember'
                : 'bg-ash text-muted'
          }`}
        >
          {uploaded ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : doc.type === 'profile_photo' ? (
            <Camera className="w-5 h-5" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-pearl text-sm flex items-center gap-1.5">
            {isAr ? doc.labelAr : doc.labelEn}
            {doc.required ? <span className="text-ember">*</span> : null}
          </div>
          <div className="text-xs text-muted truncate">
            {uploaded
              ? uploaded.fileName
              : busy
                ? isAr
                  ? 'جارٍ الرفع...'
                  : 'Uploading...'
                : isAr
                  ? doc.hintAr
                  : doc.hintEn}
          </div>
          {error ? (
            <div className="text-xs text-danger mt-0.5">{error}</div>
          ) : null}
        </div>
        <div className="text-xs font-bold">
          {uploaded ? (
            <span className="text-success">
              {isAr ? 'تم' : 'Done'}
            </span>
          ) : (
            <span className="text-muted">
              {isAr ? 'اختر ملفاً' : 'Choose file'}
            </span>
          )}
        </div>
      </label>
    </div>
  );
}

// ── Step 4 — Review ────────────────────────────────────────────────────────

function StepReview({
  locale,
  personal,
  vehicle,
  docs,
}: {
  locale: Locale;
  personal: Personal;
  vehicle: Vehicle;
  docs: UploadedDocs;
}) {
  const isAr = locale === 'ar';
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-extrabold text-pearl">
        {isAr ? 'مراجعة الطلب' : 'Review your application'}
      </h3>
      <p className="text-muted text-sm">
        {isAr
          ? 'تأكَّد من البيانات قبل الإرسال. ستصلك رسالة بنتيجة المراجعة خلال 48 ساعة.'
          : 'Double-check everything below. We respond within 48 hours.'}
      </p>

      <Section title={isAr ? 'البيانات الشخصية' : 'Personal info'}>
        <SummaryRow label={isAr ? 'الاسم' : 'Name'} value={personal.fullName} />
        <SummaryRow label={isAr ? 'البريد' : 'Email'} value={personal.email} />
        <SummaryRow label={isAr ? 'الجوال' : 'Phone'} value={personal.phone} />
        <SummaryRow label={isAr ? 'المدينة' : 'City'} value={personal.city} />
      </Section>

      <Section title={isAr ? 'السيارة' : 'Vehicle'}>
        <SummaryRow
          label={isAr ? 'الماركة/الموديل' : 'Brand/Model'}
          value={`${vehicle.vehicleBrand} ${vehicle.vehicleModel} (${vehicle.vehicleYear})`}
        />
        {vehicle.vehicleColor ? (
          <SummaryRow label={isAr ? 'اللون' : 'Color'} value={vehicle.vehicleColor} />
        ) : null}
        <SummaryRow label={isAr ? 'اللوحة' : 'Plate'} value={vehicle.plateNumber} />
      </Section>

      <Section title={isAr ? 'الوثائق' : 'Documents'}>
        {DOCS.map((d) => (
          <SummaryRow
            key={d.type}
            label={isAr ? d.labelAr : d.labelEn}
            value={
              docs[d.type] ? (
                <span className="inline-flex items-center gap-1 text-success font-semibold">
                  <CircleDot className="w-3 h-3" />
                  {isAr ? 'مرفوع' : 'Uploaded'}
                </span>
              ) : (
                <span className="text-danger">
                  {isAr ? 'مفقود' : 'Missing'}
                </span>
              )
            }
          />
        ))}
      </Section>
    </div>
  );
}

// ── Success ────────────────────────────────────────────────────────────────

function Success({
  locale,
  applicationId,
}: {
  locale: Locale;
  applicationId: number;
}) {
  const isAr = locale === 'ar';
  return (
    <div className="bg-ash/60 border border-success/40 rounded-2xl p-8 text-center shadow-card-xl">
      <div className="w-16 h-16 rounded-2xl bg-success/15 text-success mx-auto grid place-items-center mb-4">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-2">
        {isAr ? 'استلمنا طلبك!' : 'Application received!'}
      </h2>
      <p className="text-muted mb-6">
        {isAr
          ? `رقم الطلب: #${applicationId}. سيراجعه فريقنا خلال 48 ساعة، وستصلك رسالة بالنتيجة على الجوال أو البريد.`
          : `Application #${applicationId}. Our team reviews within 48 hours and notifies you by SMS or email.`}
      </p>
      <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto text-start text-sm">
        <div className="bg-obsidian/60 border border-stone/60 rounded-xl p-4">
          <div className="text-ember font-bold mb-1">
            {isAr ? '1. مراجعة الوثائق' : '1. Document review'}
          </div>
          <div className="text-muted text-xs">
            {isAr
              ? 'نتحقَّق من الصلاحية والوضوح.'
              : "We verify validity and clarity."}
          </div>
        </div>
        <div className="bg-obsidian/60 border border-stone/60 rounded-xl p-4">
          <div className="text-ember font-bold mb-1">
            {isAr ? '2. تفعيل الحساب' : '2. Account activation'}
          </div>
          <div className="text-muted text-xs">
            {isAr
              ? 'عند القبول نُرسل لك بيانات الدخول.'
              : 'On approval we send your login details.'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small UI helpers ───────────────────────────────────────────────────────

function TextField({
  label,
  type = 'text',
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-pearl/90 mb-1.5">
        {label}
        {required ? <span className="text-ember"> *</span> : null}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-obsidian border border-stone rounded-lg px-4 py-2.5 text-pearl placeholder:text-hint focus:border-ember focus:outline-none transition"
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-obsidian/40 border border-stone/60 rounded-xl p-4 space-y-1.5">
      <h4 className="font-bold text-pearl text-sm mb-2">{title}</h4>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-stone/30 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-pearl font-semibold text-end">{value || '—'}</span>
    </div>
  );
}
