import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, ArrowRight } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { Hero } from '@/components/Hero';
import { LeadForm } from '@/components/LeadForm';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'nav.help') + ' — ' + (locale === 'ar' ? 'الوظائف' : 'Careers'),
    description:
      locale === 'ar'
        ? 'انضم لفريق HANCR. نبني مستقبل التنقل حول العالم.'
        : 'Join the HANCR team. We are building the future of mobility, everywhere.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

interface JobOpening {
  title: string;
  team: string;
  location: string;
  type: string;
}

export default function CareersPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  const openings: JobOpening[] = isAr
    ? [
        { title: 'مهندس Backend (NestJS)', team: 'الهندسة', location: 'الرياض / عن بُعد', type: 'دوام كامل' },
        { title: 'مهندس Flutter', team: 'الهندسة', location: 'عن بُعد', type: 'دوام كامل' },
        { title: 'مدير عمليات إقليمي', team: 'العمليات', location: 'الرياض', type: 'دوام كامل' },
        { title: 'مسؤول دعم سائقين', team: 'الدعم', location: 'الرياض', type: 'دوام كامل' },
        { title: 'مصمم منتج (Product Designer)', team: 'التصميم', location: 'عن بُعد', type: 'دوام كامل' },
        { title: 'مدير تسويق رقمي', team: 'التسويق', location: 'الرياض', type: 'دوام كامل' },
      ]
    : [
        { title: 'Backend Engineer (NestJS)', team: 'Engineering', location: 'Riyadh / Remote', type: 'Full-time' },
        { title: 'Flutter Engineer', team: 'Engineering', location: 'Remote', type: 'Full-time' },
        { title: 'Regional Ops Manager', team: 'Operations', location: 'Riyadh', type: 'Full-time' },
        { title: 'Driver Support Specialist', team: 'Support', location: 'Riyadh', type: 'Full-time' },
        { title: 'Product Designer', team: 'Design', location: 'Remote', type: 'Full-time' },
        { title: 'Digital Marketing Manager', team: 'Marketing', location: 'Riyadh', type: 'Full-time' },
      ];

  return (
    <>
      <Hero
        eyebrow={isAr ? 'الوظائف' : 'Careers'}
        title={
          isAr ? (
            <>
              ابنِ مستقبل التنقل
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                معنا.
              </span>
            </>
          ) : (
            <>
              Build the future of mobility
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                with us.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'فريق صغير، تأثير كبير. نبحث عن أشخاص شغوفين يريدون تغيير شيء ملموس في المنطقة.'
            : 'Small team, big impact. We are looking for passionate people who want to change something tangible in the region.'
        }
        primaryCta={{ href: '#openings', label: isAr ? 'الوظائف المفتوحة' : 'Open roles' }}
      />

      {/* ── Openings ── */}
      <section id="openings" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-8">
            {isAr ? 'الوظائف المفتوحة' : 'Open positions'}
          </h2>
          <div className="space-y-3">
            {openings.map((job) => (
              <a
                key={job.title}
                href="#apply"
                className="group flex items-center justify-between gap-4 bg-ash/60 hover:bg-ash border border-stone/60 hover:border-ember/40 rounded-xl p-5 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-ember/15 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-ember" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-pearl mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{job.team}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span>·</span>
                      <span>{job.type}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted group-hover:text-ember transition shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Apply ── */}
      <section id="apply" className="py-20 px-6 bg-coal/50 border-y border-stone/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-3">
              {isAr ? 'قدِّم طلبك' : 'Apply'}
            </h2>
            <p className="text-muted">
              {isAr
                ? 'اذكر الوظيفة التي تهمك في رسالتك. سنرد خلال أسبوع.'
                : 'Mention the role you are interested in. We respond within a week.'}
            </p>
          </div>
          <LeadForm
            locale={locale}
            type="careers"
            showCity
            heading={isAr ? 'بياناتك' : 'Your details'}
          />
        </div>
      </section>
    </>
  );
}
