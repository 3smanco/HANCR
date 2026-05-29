'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Car,
  Package,
  Clock,
  Settings as SettingsIcon,
  Crown,
  Sparkles,
  PowerOff,
  Power,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LIST_SERVICES, LIST_REGIONS, TOGGLE_SERVICE_ENABLED } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { useT } from '@/i18n/LocaleProvider';

const TYPE_ICON: Record<string, React.ElementType> = {
  RideSharing: Car,
  PackageDelivery: Package,
  HourlyChauffeur: Clock,
};

const TYPE_COLOR: Record<string, string> = {
  RideSharing: 'from-hancr-violet to-hancr-violet-deep',
  PackageDelivery: 'from-emerald-400 to-emerald-600',
  HourlyChauffeur: 'from-amber-400 to-amber-600',
};

export default function ServicesPage() {
  const t = useT();
  const TYPE_LABEL: Record<string, string> = {
    RideSharing:     t('services.types.RideSharing'),
    PackageDelivery: t('services.types.PackageDelivery'),
    HourlyChauffeur: t('services.types.HourlyChauffeur'),
  };
  const [regionId, setRegionId] = useState<number | undefined>(undefined);

  const { data: regionsData } = useQuery(LIST_REGIONS);
  const { data, loading, refetch } = useQuery(LIST_SERVICES, {
    variables: { regionId },
  });

  const [toggleEnabled] = useMutation(TOGGLE_SERVICE_ENABLED, {
    onCompleted: () => {
      toast.success(t('services.updated'));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const services = data?.adminServices ?? [];
  const regions = regionsData?.adminRegions ?? [];
  const enabledCount = services.filter((s: Record<string, unknown>) => s.enabled).length;

  return (
    <div>
      <Topbar
        title={t('services.title')}
        subtitle={t('services.subtitle', { count: services.length, enabled: enabledCount })}
      />

      <div className="p-6 space-y-5">
        {/* ── Region filter ── */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">{t('services.region')}</label>
          <select
            className="input max-w-xs"
            value={regionId ?? ''}
            onChange={(e) =>
              setRegionId(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">{t('services.allRegions')}</option>
            {regions.map((r: Record<string, unknown>) => (
              <option key={r.id as number} value={r.id as number}>
                {r.name as string} ({r.nameEn as string})
              </option>
            ))}
          </select>
        </div>

        {/* ── Services Grid ── */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
              {t('common.loading')}
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="card p-12 text-center">
            <SettingsIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-bold text-lg">{t('services.empty')}</p>
            <p className="text-sm text-gray-500 mt-2">
              {regionId ? t('services.emptyHintRegion') : t('services.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map((s: Record<string, unknown>) => {
              const Icon = TYPE_ICON[s.serviceType as string] ?? SettingsIcon;
              const gradient = TYPE_COLOR[s.serviceType as string] ?? 'from-gray-400 to-gray-600';
              const enabled = s.enabled as boolean;
              const isVip = s.isVip as boolean;
              const bidMode = s.bidModeEnabled as boolean;
              const commission = s.providerSharePercent as number;

              return (
                <div
                  key={s.id as number}
                  className={`card p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-lg ${
                    !enabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white shrink-0`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      {isVip && (
                        <span className="badge badge-violet inline-flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          {t('services.badges.vip')}
                        </span>
                      )}
                      <span className={`badge ${enabled ? 'badge-green' : 'badge-gray'}`}>
                        {enabled ? t('common.enabled') : t('common.disabled')}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-lg">
                    {s.name as string}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">
                    {TYPE_LABEL[s.serviceType as string] ?? (s.serviceType as string)}
                  </p>

                  {bidMode && (
                    <div className="mt-2">
                      <span className="badge badge-yellow inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t('services.badges.bidMode')}
                      </span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mt-4 space-y-2 pt-3 border-t border-gray-100">
                    <PricingRow label={t('services.pricing.baseFare')}   value={`${(s.baseFare as number).toFixed(0)}`} />
                    <PricingRow label={t('services.pricing.perKm')}      value={`${((s.perHundredMeters as number) * 10).toFixed(2)}`} />
                    <PricingRow label={t('services.pricing.perMinute')}  value={`${(s.perMinuteDrive as number).toFixed(2)}`} />
                    <PricingRow label={t('services.pricing.minimumFee')} value={`${(s.minimumFee as number).toFixed(0)}`} emphasis />
                  </div>

                  {/* Commission */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-hancr-violet-light">
                      <TrendingUp className="w-3.5 h-3.5 text-hancr-violet-deep" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 font-medium">{t('services.pricing.commission')}</div>
                      <div className="text-sm font-bold text-hancr-navy">
                        {commission.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleEnabled({ variables: { id: s.id } })}
                    className={`btn-sm w-full mt-4 ${
                      enabled ? 'btn-outline' : 'btn-success'
                    }`}
                  >
                    {enabled ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5" />
                        {t('regions.actions.disable')}
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5" />
                        {t('regions.actions.enable')}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PricingRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={emphasis ? 'text-gray-700 font-semibold' : 'text-gray-500'}>
        {label}
      </span>
      <span
        className={`font-bold ${
          emphasis ? 'text-hancr-violet-deep' : 'text-gray-900'
        }`}
      >
        {value} <span className="text-xs text-gray-400">SAR</span>
      </span>
    </div>
  );
}
