'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Check,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Car,
  Filter,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  LIST_DRIVERS,
  APPROVE_DRIVER,
  BAN_DRIVER,
  UNBAN_DRIVER,
  SET_DRIVER_APPROVAL,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';
import { statusBadgeClass } from '@/lib/design-tokens';
import { useT } from '@/i18n/LocaleProvider';

export default function DriversPage() {
  const t = useT();
  const STATUS_LABEL: Record<string, string> = {
    offline:   t('drivers.status.offline'),
    online:    t('drivers.status.online'),
    in_ride:   t('drivers.status.busy'),
    suspended: t('common.banned'),
  };

  const [page, setPage] = useState(1);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banTarget, setBanTarget] = useState<{ id: number; name: string } | null>(null);
  const limit = 20;

  const { data, loading, refetch } = useQuery(LIST_DRIVERS, {
    variables: { page, limit, pendingOnly },
  });

  const [approveDriver] = useMutation(APPROVE_DRIVER, {
    onCompleted: () => {
      toast.success(t('drivers.toasts.approved'));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [banDriver] = useMutation(BAN_DRIVER, {
    onCompleted: () => {
      toast.success(t('drivers.toasts.banned'));
      setBanTarget(null);
      setBanReason('');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [unbanDriver] = useMutation(UNBAN_DRIVER, {
    onCompleted: () => {
      toast.success(t('drivers.toasts.unbanned'));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [setApproval] = useMutation(SET_DRIVER_APPROVAL, {
    onCompleted: () => {
      toast.success(t('drivers.toasts.approvalUpdated'));
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const drivers = data?.adminListDrivers?.items ?? [];
  const total = data?.adminListDrivers?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pendingCount = drivers.filter((d: Record<string, unknown>) => !d.active).length;

  return (
    <div>
      <Topbar
        title={t('drivers.title')}
        subtitle={t('drivers.subtitle', { count: total })}
      />

      <div className="p-6 space-y-5">
        {/* ── Filters bar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setPendingOnly(!pendingOnly);
              setPage(1);
            }}
            className={`btn ${pendingOnly ? 'btn-primary' : 'btn-outline'} transition-all`}
          >
            <Filter className="w-4 h-4" />
            {t('drivers.actions.pendingApprovalOnly')}
            {pendingOnly && pendingCount > 0 && (
              <span className="badge badge-violet">{pendingCount}</span>
            )}
          </button>
        </div>

        {/* ── Table ── */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('drivers.columns.driver')}</th>
                <th>{t('drivers.columns.phone')}</th>
                <th>{t('drivers.columns.vehicle')}</th>
                <th>{t('drivers.columns.status')}</th>
                <th>{t('drivers.columns.rating')}</th>
                <th>{t('drivers.columns.ratingCount')}</th>
                <th>{t('drivers.columns.joinedAt')}</th>
                <th>{t('drivers.columns.approvals')}</th>
                <th className="text-end">{t('drivers.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Car className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">{t('drivers.empty')}</p>
                  </td>
                </tr>
              )}
              {drivers.map((d: Record<string, unknown>) => {
                const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ');
                return (
                <tr key={d.id as number}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white font-bold text-xs shrink-0">
                        {(fullName[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/users/drivers/${d.id as number}`}
                          className="font-bold text-gray-900 truncate hover:text-hancr-violet"
                        >
                          {fullName || '—'}
                        </Link>
                        <div className="flex items-center gap-1 mt-0.5">
                          {!(d.active as boolean) && (
                            <span className="badge badge-yellow">{t('common.pending')}</span>
                          )}
                          {(d.banned as boolean) && (
                            <span className="badge badge-red">{t('common.banned')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-500 font-mono text-xs ltr">{d.phoneNumber as string}</td>
                  <td>
                    <div className="text-sm font-semibold text-gray-800">
                      {[d.carBrand, d.carModel, d.carYear].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-xs text-gray-400 font-mono ltr mt-0.5">
                      {(d.plateNumber as string) ?? ''}
                    </div>
                  </td>
                  <td>
                    <span className={statusBadgeClass(d.status as string)}>
                      {STATUS_LABEL[d.status as string] ?? (d.status as string)}
                    </span>
                  </td>
                  <td>
                    <div className="inline-flex items-center gap-1 font-bold text-gray-800">
                      {(d.rating as number)?.toFixed(1) ?? '—'}
                      <span className="text-amber-500">★</span>
                    </div>
                  </td>
                  <td className="font-bold text-gray-700">
                    {(d.ratingCount as number) ?? 0}
                  </td>
                  <td className="text-gray-400 text-xs">
                    {formatDate(d.createdAt as string)}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.kidsApproved as boolean}
                          onChange={(e) =>
                            setApproval({
                              variables: {
                                driverId: d.id,
                                kidsApproved: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>{t('drivers.approvals.kids')}</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.nightApproved as boolean}
                          onChange={(e) =>
                            setApproval({
                              variables: {
                                driverId: d.id,
                                nightApproved: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>{t('drivers.approvals.night')}</span>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      {!d.active && !d.banned && (
                        <button
                          className="btn-success btn-sm"
                          onClick={() => approveDriver({ variables: { id: d.id } })}
                        >
                          <Check className="w-3 h-3" />
                          {t('drivers.actions.approve')}
                        </button>
                      )}
                      {d.banned ? (
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => unbanDriver({ variables: { id: d.id } })}
                        >
                          <UserCheck className="w-3 h-3" />
                          {t('drivers.actions.unban')}
                        </button>
                      ) : (
                        <button
                          className="btn-danger btn-sm"
                          onClick={() =>
                            setBanTarget({ id: d.id as number, name: fullName })
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
            {t('common.showing')} {drivers.length} {t('common.of')} {total}
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
                  <h3 className="font-extrabold text-gray-900 text-lg">{t('drivers.banModal.title')}</h3>
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
            <label className="label">{t('drivers.banModal.reason')}</label>
            <textarea
              className="input h-24 resize-none"
              placeholder={t('drivers.banModal.reasonPlaceholder')}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <p className="help-text">{t('drivers.banModal.hint')}</p>
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
                onClick={() => banDriver({ variables: { id: banTarget.id } })}
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
