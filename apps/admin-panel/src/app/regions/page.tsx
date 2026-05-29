'use client';

import { useQuery, useMutation } from '@apollo/client';
import {
  MapPin,
  Globe,
  Crosshair,
  Sparkles,
  PowerOff,
  Power,
  Map as MapIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LIST_REGIONS, TOGGLE_REGION_ENABLED } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { useT } from '@/i18n/LocaleProvider';

// Region → flag emoji (best-effort mapping)
const REGION_FLAG: Record<string, string> = {
  SAR: '🇸🇦',
  QAR: '🇶🇦',
  AED: '🇦🇪',
  KWD: '🇰🇼',
  BHD: '🇧🇭',
  OMR: '🇴🇲',
};

export default function RegionsPage() {
  const t = useT();
  const { data, loading, refetch } = useQuery(LIST_REGIONS);
  const regions = data?.adminRegions ?? [];

  const [toggleEnabled] = useMutation(TOGGLE_REGION_ENABLED, {
    onCompleted: () => {
      toast.success(t('regions.updated'));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const enabledCount = regions.filter((r: Record<string, unknown>) => r.enabled).length;

  return (
    <div>
      <Topbar
        title={t('regions.title')}
        subtitle={t('regions.subtitle', { count: regions.length, enabled: enabledCount })}
      />

      <div className="p-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
              {t('common.loading')}
            </div>
          </div>
        ) : regions.length === 0 ? (
          <div className="card p-12 text-center">
            <MapIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-bold text-lg">{t('regions.empty')}</p>
            <p className="text-sm text-gray-500 mt-2">
              {t('regions.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((r: Record<string, unknown>) => {
              const flag = REGION_FLAG[r.currency as string] ?? '🌍';
              const enabled = r.enabled as boolean;
              const bidMode = r.bidModeEnabled as boolean;

              return (
                <div
                  key={r.id as number}
                  className={`card p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-lg ${
                    !enabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
                        enabled ? 'bg-hancr-violet-light' : 'bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl">{flag}</span>
                    </div>
                    <span className={`badge ${enabled ? 'badge-green' : 'badge-gray'}`}>
                      {enabled ? t('common.enabled') : t('common.disabled')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-lg">
                    {r.name as string}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{r.nameEn as string}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="badge badge-blue inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {r.currency as string}
                    </span>
                    {bidMode && (
                      <span className="badge badge-violet inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t('regions.bidMode')}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {t('regions.searchRadius')}
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5 inline-flex items-center gap-1">
                        <Crosshair className="w-3.5 h-3.5 text-hancr-violet" />
                        {((r.defaultSearchRadius as number) / 1000).toFixed(1)} km
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {t('regions.regionId')}
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5 inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-hancr-violet" />
                        #{r.id as number}
                      </div>
                    </div>
                  </div>

                  {/* Toggle action */}
                  <button
                    onClick={() => toggleEnabled({ variables: { id: r.id } })}
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
