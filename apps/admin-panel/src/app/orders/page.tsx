'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import {
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
  Route,
  Wallet,
  RefreshCw,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LIST_ORDERS, FORCE_CANCEL_ORDER } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { DispatcherDrawer } from '@/components/DispatcherDrawer';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useT } from '@/i18n/LocaleProvider';

const STATUS_CLASS: Record<string, string> = {
  Requested:         'badge badge-yellow',
  NotFound:          'badge badge-red',
  NoCloseFound:      'badge badge-red',
  Found:             'badge badge-blue',
  DriverAccepted:    'badge badge-blue',
  WaitingForPrePay:  'badge badge-yellow',
  Arrived:           'badge badge-violet',
  Started:           'badge badge-green',
  WaitingForPostPay: 'badge badge-yellow',
  WaitingForReview:  'badge badge-violet',
  Finished:          'badge badge-green',
  DriverCanceled:    'badge badge-red',
  RiderCanceled:     'badge badge-red',
  Booked:            'badge badge-blue',
  Expired:           'badge badge-gray',
};

const ACTIVE_STATUSES = ['Requested', 'Found', 'DriverAccepted', 'Arrived', 'Started'];

export default function OrdersPage() {
  const t = useT();

  const FILTER_TABS = [
    { key: '',               label: t('common.all'),                  icon: ShoppingBag },
    { key: 'Requested',      label: t('orders.filters.waiting'),       icon: RefreshCw },
    { key: 'Started',        label: t('orders.filters.ongoing'),       icon: Route },
    { key: 'Finished',       label: t('orders.filters.completed'),     icon: ShoppingBag },
    { key: 'RiderCanceled',  label: t('orders.filters.canceledByRider'), icon: XCircle },
    { key: 'DriverCanceled', label: t('orders.filters.canceledByDriver'), icon: XCircle },
  ];

  function fmtDistance(meters: number): string {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  function fmtDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const limit = 20;

  const { data, loading, refetch } = useQuery(LIST_ORDERS, {
    variables: { page, limit, status: status || undefined },
    pollInterval: 15_000,
  });

  const [forceCancel] = useMutation(FORCE_CANCEL_ORDER, {
    onCompleted: () => {
      toast.success(t('orders.canceled'));
      setCancelTarget(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const orders = data?.adminOrders?.items ?? [];
  const total = data?.adminOrders?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title={t('orders.title')}
        subtitle={t('orders.subtitle', { count: total })}
      />

      <div className="p-6 space-y-5">
        {/* ── Filter tabs + Book ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <button className="btn-primary me-2" onClick={() => setBookOpen(true)}>
            <Plus className="w-4 h-4" />
            احجز رحلة
          </button>
          {FILTER_TABS.map((t) => {
            const Icon = t.icon;
            const active = status === t.key;
            return (
              <button
                key={t.key || 'all'}
                onClick={() => {
                  setStatus(t.key);
                  setPage(1);
                }}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Table ── */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('orders.columns.id')}</th>
                <th>{t('orders.columns.status')}</th>
                <th>{t('orders.columns.service')}</th>
                <th>{t('orders.columns.distance')}</th>
                <th>{t('orders.columns.amount')}</th>
                <th>{t('orders.columns.rider')}</th>
                <th>{t('orders.columns.driver')}</th>
                <th>{t('orders.columns.createdAt')}</th>
                <th className="text-end">{t('orders.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">{t('orders.empty')}</p>
                  </td>
                </tr>
              )}
              {orders.map((o: Record<string, unknown>) => {
                const status = o.status as string;
                const isActive = ACTIVE_STATUSES.includes(status);
                return (
                  <tr key={o.id as number}>
                    <td className="font-mono text-gray-400 font-bold">
                      <Link
                        href={`/orders/${o.id as number}`}
                        className="hover:text-hancr-violet"
                      >
                        #{o.id as number}
                      </Link>
                    </td>
                    <td>
                      <span className={STATUS_CLASS[status] ?? 'badge badge-gray'}>
                        {t(`orders.statuses.${status}`)}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm font-semibold text-gray-800">
                        {(o.serviceName as string) ?? '—'}
                      </div>
                      <div className="text-xs text-gray-400">{o.type as string}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-gray-800">
                        {fmtDistance(o.distanceBest as number)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {fmtDuration(o.durationBest as number)}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-gray-900">
                        {formatCurrency(o.costAfterCoupon as number)} {o.currency as string}
                      </div>
                      {(o.paymentMode as string) && (
                        <div className="text-xs text-gray-400 inline-flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {o.paymentMode as string}
                        </div>
                      )}
                    </td>
                    <td className="text-gray-500 font-mono text-xs ltr">
                      {(o.riderPhone as string) ?? `#${o.riderId}`}
                    </td>
                    <td className="text-gray-500 font-mono text-xs ltr">
                      {o.driverPhone ? (o.driverPhone as string)
                        : <span className="badge badge-yellow">{t('orders.unassigned')}</span>}
                    </td>
                    <td className="text-gray-400 text-xs">
                      {formatDate(o.createdOn as string)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        {isActive && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => setCancelTarget(o.id as number)}
                          >
                            <XCircle className="w-3 h-3" />
                            {t('common.cancel')}
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
            {t('common.showing')} {orders.length} {t('common.of')} {total}
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

      {/* ── Cancel Modal ── */}
      {cancelTarget !== null && (
        <div className="fixed inset-0 bg-hancr-navy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 shrink-0">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">{t('orders.cancelModal.title')}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {t('orders.cancelModal.orderId', { id: cancelTarget })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-amber-900 font-semibold">
                {t('orders.cancelModal.warning')}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {t('orders.cancelModal.hint')}
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                className="btn-outline flex-1"
                onClick={() => setCancelTarget(null)}
              >
                {t('common.close')}
              </button>
              <button
                className="btn-danger flex-1"
                onClick={() => forceCancel({ variables: { id: cancelTarget } })}
              >
                <XCircle className="w-4 h-4" />
                {t('orders.cancelModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {bookOpen && (
        <DispatcherDrawer
          onClose={() => setBookOpen(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
