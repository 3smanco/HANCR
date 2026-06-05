'use client';

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { type Locale, translator } from '@/i18n/messages';

const SUBMIT_LEAD = gql`
  mutation SubmitLead($input: SubmitLeadInput!) {
    submitLead(input: $input)
  }
`;

export type LeadType = 'driver_signup' | 'business' | 'contact' | 'careers';

interface Props {
  locale: Locale;
  type: LeadType;
  heading?: string;
  subheading?: string;
  /** Show company + city fields (default for 'business' type). */
  showCompany?: boolean;
  showCity?: boolean;
  /** Hide message field (e.g. simple driver signup). */
  hideMessage?: boolean;
}

export function LeadForm({
  locale,
  type,
  heading,
  subheading,
  showCompany,
  showCity = true,
  hideMessage = false,
}: Props) {
  const tt = translator(locale);
  const isAr = locale === 'ar';
  const showCompanyField = showCompany ?? type === 'business';

  const [submit, { loading, called, error }] = useMutation(SUBMIT_LEAD);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    try {
      await submit({
        variables: {
          input: {
            type,
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            company: showCompanyField ? form.company || undefined : undefined,
            city: showCity ? form.city || undefined : undefined,
            message: hideMessage ? undefined : form.message || undefined,
          },
        },
      });
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', company: '', city: '', message: '' });
    } catch {
      /* error surfaced below */
    }
  };

  if (success) {
    return (
      <div className="bg-ash/60 border border-success/40 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
        <h3 className="text-xl font-bold text-pearl mb-2">
          {isAr ? 'تم الاستلام!' : 'Submitted!'}
        </h3>
        <p className="text-muted">{tt('common.thanks')}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ash/60 border border-stone/60 rounded-2xl p-6 sm:p-8 space-y-4"
    >
      {heading ? (
        <div className="mb-2">
          <h3 className="text-2xl font-extrabold text-pearl">{heading}</h3>
          {subheading ? (
            <p className="text-muted mt-1.5 text-sm">{subheading}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label={tt('common.name')}
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
          autoComplete="name"
        />
        <Field
          label={tt('common.email')}
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
          autoComplete="email"
        />
        <Field
          label={tt('common.phone')}
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          autoComplete="tel"
        />
        {showCity ? (
          <Field
            label={tt('common.city')}
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            autoComplete="address-level2"
          />
        ) : null}
        {showCompanyField ? (
          <div className="sm:col-span-2">
            <Field
              label={tt('common.company')}
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
              autoComplete="organization"
            />
          </div>
        ) : null}
      </div>

      {!hideMessage ? (
        <div>
          <label className="block text-sm font-semibold text-pearl/90 mb-1.5">
            {tt('common.message')}
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
            className="w-full bg-obsidian border border-stone rounded-lg px-4 py-2.5 text-pearl placeholder:text-hint focus:border-ember focus:outline-none transition"
          />
        </div>
      ) : null}

      {error && called ? (
        <p className="text-danger text-sm">{tt('common.error')}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-ember hover:bg-ember-deep disabled:opacity-60 disabled:cursor-not-allowed transition py-3.5 rounded-xl font-bold text-pearl shadow-ember flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {tt('common.loading')}
          </>
        ) : (
          tt('cta.submit')
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
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
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full bg-obsidian border border-stone rounded-lg px-4 py-2.5 text-pearl placeholder:text-hint focus:border-ember focus:outline-none transition"
      />
    </div>
  );
}
