'use client';

import { useQuery } from '@apollo/client';
import { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { REVENUE_CHART, DASHBOARD_STATS } from '@/lib/gql';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { Topbar } from '@/components/layout/Topbar';
import { GlobalRevenueMatrix } from '@/components/global/GlobalRevenueMatrix';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useT } from '@/i18n/LocaleProvider';

interface RevenuePoint {
  date: string;
  revenue: number;
  orderCount: number;
  platformRevenue: number;
}

export default function AnalyticsPage() {
  const t = useT();
  const [days, setDays] = useState(30);

  const { data: statsData } = useQuery(DASHBOARD_STATS);
  const { data: chartData, loading } = useQuery(REVENUE_CHART, {
    variables: { days },
  });

  const stats = statsData?.dashboardStats;
  const chart: RevenuePoint[] = chartData?.revenueStats ?? [];

  const totalRevenue = chart.reduce((s, d) => s + d.revenue, 0);
  const totalPlatform = chart.reduce((s, d) => s + d.platformRevenue, 0);
  const totalOrders = chart.reduce((s, d) => s + d.orderCount, 0);
  const avgPerOrder = totalOrders ? totalRevenue / totalOrders : 0;

  return (
    <div>
      <Topbar
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
      />

      <div className="p-6 space-y-6">
        {/* ── مصفوفة الأرباح متعددة العملات (الذكاء التجاري العالمي) ── */}
        <section className="rounded-2xl border cmd-border cmd-surface-2 p-5">
          <h2 className="mb-4 text-base font-extrabold cmd-text">
            💱 مصفوفة الأرباح العالمية
          </h2>
          <GlobalRevenueMatrix />
        </section>

        {/* ── Period Selector ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-700">{t('analytics.period')}</span>
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`btn-sm ${
                days === d ? 'btn-primary' : 'btn-outline'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {t('analytics.daysLabel', { days: d })}
            </button>
          ))}
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label={t('analytics.summary.revenue', { days })}
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            iconBg="#F3E8FF"
            iconColor="#8B2EE6"
          />
          <SummaryCard
            label={t('analytics.summary.orders', { days })}
            value={formatNumber(totalOrders)}
            icon={ShoppingBag}
            iconBg="#DBEAFE"
            iconColor="#2563EB"
          />
          <SummaryCard
            label={t('analytics.summary.avgPerOrder')}
            value={formatCurrency(avgPerOrder)}
            icon={TrendingUp}
            iconBg="#D1FAE5"
            iconColor="#059669"
          />
          <SummaryCard
            label={t('analytics.summary.platformCommission')}
            value={formatCurrency(totalPlatform)}
            icon={BarChart3}
            iconBg="#FEF3C7"
            iconColor="#D97706"
          />
        </div>

        {/* ── Big totals: from dashboardStats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-6 bg-gradient-to-br from-hancr-navy to-hancr-purple text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-hancr-violet/20 blur-3xl" />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                {t('analytics.overview.totalRevenue')}
              </p>
              <p className="text-4xl font-extrabold mt-2">
                {formatCurrency(stats?.totalRevenue ?? 0)}
              </p>
              <p className="text-xs text-white/60 mt-2">{t('analytics.overview.sinceStart')}</p>
            </div>
          </div>
          <div className="card p-6">
            <p className="stat-tile-label">{t('analytics.overview.totalOrders')}</p>
            <p className="stat-tile-value">{formatNumber(stats?.totalOrders ?? 0)}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-bold">
                {t('analytics.overview.completedShort', { count: stats?.completedOrders ?? 0 })}
              </span>
              <span className="text-rose-500 font-bold">
                {t('analytics.overview.canceledShort', { count: stats?.canceledOrders ?? 0 })}
              </span>
            </div>
          </div>
          <div className="card p-6">
            <p className="stat-tile-label">{t('analytics.overview.platformUsers')}</p>
            <p className="stat-tile-value">
              {formatNumber((stats?.totalRiders ?? 0) + (stats?.totalDrivers ?? 0))}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-blue-600 font-bold">
                {t('analytics.overview.ridersShort', { count: stats?.totalRiders ?? 0 })}
              </span>
              <span className="text-hancr-violet font-bold">
                {t('analytics.overview.driversShort', { count: stats?.totalDrivers ?? 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg">{t('analytics.chart.title')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('analytics.chart.lastDays', { days })}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-gray-600 font-medium">
                <span className="w-3 h-0.5 bg-hancr-violet inline-block rounded" />
                {t('dashboard.chart.revenue')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-600 font-medium">
                <span className="w-3 h-0.5 bg-hancr-navy inline-block rounded" />
                {t('dashboard.chart.orders')}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin" />
                {t('common.loading')}
              </div>
            </div>
          ) : chart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
              <BarChart3 className="w-12 h-12 text-gray-300" />
              <p className="text-sm font-medium">{t('analytics.chart.empty')}</p>
            </div>
          ) : (
            <RevenueChart data={chart} />
          )}
        </div>

        {/* ── Daily Breakdown ── */}
        {chart.length > 0 && (
          <div className="card p-6">
            <h2 className="font-extrabold text-gray-900 text-lg mb-4">{t('analytics.table.title')}</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('analytics.table.date')}</th>
                    <th>{t('analytics.table.revenue')}</th>
                    <th>{t('analytics.table.orders')}</th>
                    <th>{t('analytics.table.avgPerOrder')}</th>
                    <th>{t('analytics.table.platformCommission')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...chart].reverse().map((d) => (
                    <tr key={d.date}>
                      <td className="font-mono text-sm ltr">{d.date}</td>
                      <td className="font-bold text-gray-900">
                        {formatCurrency(d.revenue)}
                      </td>
                      <td className="font-bold text-gray-700">{d.orderCount}</td>
                      <td className="text-gray-500">
                        {d.orderCount ? formatCurrency(d.revenue / d.orderCount) : '—'}
                      </td>
                      <td className="text-hancr-violet font-bold">
                        {formatCurrency(d.platformRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="stat-tile-label">{label}</p>
          <p className="stat-tile-value truncate">{value}</p>
        </div>
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
