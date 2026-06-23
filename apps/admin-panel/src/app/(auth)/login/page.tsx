'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { ADMIN_LOGIN } from '@/lib/gql';
import { useAuthStore } from '@/store/auth';
import { useT } from '@/i18n/LocaleProvider';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const setAdmin = useAuthStore((s) => s.setAdmin);
  const [showPwd, setShowPwd] = useState(false);

  // Zod schema with locale-aware messages
  const schema = z.object({
    email: z
      .string()
      .min(1, t('auth.login.emailRequired'))
      .email(t('auth.login.emailInvalid')),
    password: z.string().min(6, t('auth.login.passwordTooShort')),
  });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const [adminLogin] = useMutation(ADMIN_LOGIN);

  const onSubmit = async (data: FormData) => {
    try {
      const { data: res } = await adminLogin({ variables: data });
      const { accessToken, email, role } = res.adminLogin;
      setAdmin({ id: 1, email, role }, accessToken);
      toast.success(t('auth.login.welcomeBack', { email }));
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('auth.login.invalidCredentials');
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-hancr-navy">
      {/* Background gradient + decorative blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-hancr-navy via-hancr-purple/40 to-hancr-navy" />
      <div className="absolute top-0 -left-32 w-96 h-96 rounded-full bg-hancr-violet/15 blur-3xl" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-hancr-violet/10 blur-3xl" />

      {/* Language switcher (top-end corner) */}
      <div className="absolute top-4 end-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet-lg mb-5">
            <span className="text-4xl font-extrabold text-white">H</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {t('auth.login.title')}
          </h1>
          <p className="text-hancr-cream/70 mt-2 text-sm">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-hancr-cream/80">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-bold">
              {t('auth.login.secureAccess')}
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-hancr-cream mb-2">
                {t('auth.login.email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder={t('auth.login.emailPlaceholder')}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border-2 text-white placeholder:text-white/30
                  focus:outline-none focus:ring-2 focus:ring-hancr-violet/50 focus:border-hancr-violet/60
                  transition-all
                  ${errors.email ? 'border-red-400/60' : 'border-white/15'}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-300 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-hancr-cream mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className={`w-full px-4 py-3 pe-12 rounded-xl bg-white/10 border-2 text-white placeholder:text-white/30
                    focus:outline-none focus:ring-2 focus:ring-hancr-violet/50 focus:border-hancr-violet/60
                    transition-all
                    ${errors.password ? 'border-red-400/60' : 'border-white/15'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/90 transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-300 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-hancr-violet to-hancr-violet-deep
                text-white font-extrabold text-sm shadow-violet-lg
                hover:shadow-violet hover:brightness-110 transition-all active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-white/30
                inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('auth.login.signingIn')}
                </>
              ) : (
                t('auth.login.signIn')
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-hancr-cream/40 text-xs font-medium">
          {t('auth.login.footer')}
        </p>
      </div>
    </div>
  );
}
