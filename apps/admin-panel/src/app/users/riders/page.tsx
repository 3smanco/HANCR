'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LIST_RIDERS, BAN_RIDER, UNBAN_RIDER } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';
import { useT } from '@/i18n/LocaleProvider';

export default function RidersPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [banReason, setBanReason] = useState('');
  const [banTarget, setBanTarget] = useState<{ id: number; name: string } | null>(null);
  const limit = 20;

  const { data, loading, refetch } = useQuery(LIST_RIDERS, {
    variables: { page, limit },
  });

  const [banRider] = useMutation(BAN_RIDER, {
    onCompleted: () => {
      toast.success(t('riders.toasts.banned'));
      setBanTarget(null);
      setBanReason('');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [unbanRider] = useMutation(UNBAN_RIDER, {
    onCompleted: () => {
      toast.success(t('riders.toasts.unbanned'));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const riders = data?.adminListRiders?.items ?? [];
  const total = data?.adminListRiders?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title={t('riders.title')}
        subtitle={t('riders.subtitle', { count: total })}
      />

      <div className="p-6 space-y-5">
        {/* ── Table ── */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('riders.columns.rider')}</th>
                <th>{t('riders.columns.phone')}</th>
                <th>{t('riders.columns.balance')}</th>
                <th>{t('riders.columns.totalRides')}</th>
                <th>{t('riders.columns.status')}</th>
                <th>{t('riders.columns.registeredAt')}</th>
                <th className="text-end">{t('riders.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && riders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">{t('riders.empty')}</p>
                  </td>
                </tr>
              )}
              {riders.map((r: Record<string, unknown>) => {
                const fullName = [r.firstName, r.lastName].filter(Boolean).join(' ');
                return (
                <tr key={r.id as number}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xs shrink-0">
                        {(fullName[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {fullName || '—'}
                        </div>
                        {(r.banned as boolean) && (
                          <span className="badge badge-red mt-0.5 inline-flex">{t('common.banned')}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-500 font-mono text-xs ltr">{r.phoneNumber as string}</td>
                  <td className="font-bold text-gray-800">
                    {(r.balance as number)?.toFixed(2) ?? '0'} {r.currency as string}
                  </td>
                  <td className="font-bold text-gray-700">
                    {(r.totalRides as number) ?? 0}
                  </td>
                  <td>
                    {r.banned ? (
                      <span className="badge badge-red">{t('common.banned')}</span>
                    ) : (
                      <span className="badge badge-green">{t('common.active')}</span>
                    )}
                  </td>
                  <td className="text-gray-400 text-xs">
                    {formatDate(r.createdAt as string)}
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      {r.banned ? (
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => unbanRider({ variables: { id: r.id } })}
                        >
                          <UserCheck className="w-3 h-3" />
                          {t('drivers.actions.unban')}
                        </button>
                      ) : (
                        <button
                          className="btn-danger btn-sm"
                          onClick={() =>
                            setBanTarget({ id: r.id as number, name: fullName })
                          }
                        >
                          <Ban className="w-3 h-3" />
                          {t('drivers.actions.ban')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            {t('common.showing')} {riders.length} {t('common.of')} {total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              className="btn-icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-4 py-1.5 text-sm font-bold text-gray-700 bg-gray-50 rounded-lg">
              {page} / {pages}
            </span>
            <button
              className="btn-icon"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Ban Modal ── */}
      {banTarget !== null && (
        <div className="fixed inset-0 bg-hancr-navy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 shrink-0">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">{t('riders.banModal.title')}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{banTarget.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBanTarget(null);
                  setBanReason('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="label">{t('riders.banModal.reason')}</label>
            <textarea
              className="input h-24 resize-none"
              placeholder={t('drivers.banModal.reasonPlaceholder')}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <p className="help-text">{t('riders.banModal.hint')}</p>
            <div className="flex gap-3 mt-5">
              <button
                className="btn-outline flex-1"
                onClick={() => {
                  setBanTarget(null);
                  setBanReason('');
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn-danger flex-1"
                disabled={!banReason.trim()}
                onClick={() =>
                  banRider({ variables: { id: banTarget.id, reason: banReason } })
                }
              >
                <Ban className="w-4 h-4" />
                {t('drivers.banModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
