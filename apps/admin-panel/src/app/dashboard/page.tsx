'use client';

import { useQuery } from '@apollo/client';
import {
  Users,
  Car,
  ShoppingBag,
  Clock,
  Star,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Activity,
  Map as MapIcon,
} from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_STATS, REVENUE_CHART } from '@/lib/gql';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { Topbar } from '@/components/layout/Topbar';
import { GlobalMacroView } from '@/components/global/GlobalMacroView';
import { useT } from '@/i18n/LocaleProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Stat Tile
// ─────────────────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  subLabel?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
}

function StatTile({
  label,
  value,
  subLabel,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
}: StatTileProps) {
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="stat-tile-label">{label}</p>
          <p className="stat-tile-value truncate">{value}</p>
          {subLabel && (
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{subLabel}</p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span
            className={
              trend >= 0 ? 'stat-tile-delta-up' : 'stat-tile-delta-down'
            }
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-[11px] text-gray-400 font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Link Card
// ─────────────────────────────────────────────────────────────────────────────

interface QuickLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  subtitle: string;
  variant?: 'violet' | 'navy' | 'amber' | 'emerald';
}

function QuickLink({
  href,
  icon: Icon,
  label,
  subtitle,
  variant = 'violet',
}: QuickLinkProps) {
  const variants = {
    violet:
      'from-hancr-violet to-hancr-violet-deep shadow-violet hover:shadow-violet-lg',
    navy: 'from-hancr-navy to-hancr-purple hover:shadow-card-lg',
    amber: 'from-amber-400 to-amber-600 hover:shadow-card-lg',
    emerald: 'from-emerald-400 to-emerald-600 hover:shadow-card-lg',
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${variants[variant]} transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-white/95 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xs text-white/75 mt-1 font-medium">{subtitle}</p>
        </div>
        <Icon className="w-6 h-6 text-white/90 group-hover:scale-110 transition-transform" />
      </div>
      {/* Decorative circles */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-2 -right-12 w-16 h-16 rounded-full bg-white/10" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useT();
  const { data: statsData, loading: statsLoading } = useQuery(DASHBOARD_STATS, {
    pollInterval: 30_000,
  });
  const { data: chartData } = useQuery(REVENUE_CHART, {
    variables: { days: 14 },
  });

  const stats = statsData?.dashboardStats;
  const chart = chartData?.revenueStats ?? [];
  const skel = statsLoading ? 'animate-pulse bg-gray-200 rounded text-transparent' : '';

  return (
    <div>
      <Topbar
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <div className="p-6 space-y-6">
        {/* ── Geo-Radar: العرض الكلّي العالمي (غرفة العمليات) ── */}
        <section className="rounded-2xl border cmd-border cmd-surface-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold cmd-text">
              🌍 العمليات العالمية الحيّة
            </h2>
            <span className="cmd-muted text-xs">تحديث كل 15 ثانية</span>
          </div>
          <GlobalMacroView />
        </section>

        {/* ── Pending approvals banner ── */}
        {stats?.pendingDriverApprovals > 0 && (
          <Link
            href="/users/drivers?pendingOnly=true"
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                {t('dashboard.banner.pendingDrivers', { count: stats.pendingDriverApprovals })}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t('dashboard.banner.pendingHint')}
              </p>
            </div>
            <span className="btn-primary text-xs group-hover:scale-105 transition-transform">
              {t('dashboard.banner.review')} <ArrowUpRight className="w-3 h-3" />
            </span>
          </Link>
        )}

        {/* ── Main stat tiles ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label={t('dashboard.stats.totalRiders')}
            value={<span className={skel}>{formatNumber(stats?.totalRiders ?? 0)}</span>}
            icon={Users}
            iconBg="#DBEAFE"
            iconColor="#2563EB"
            trend={5}
            trendLabel={t('dashboard.stats.vsYesterday')}
          />
          <StatTile
            label={t('dashboard.stats.totalDrivers')}
            value={<span className={skel}>{formatNumber(stats?.totalDrivers ?? 0)}</span>}
            subLabel={t('dashboard.stats.pendingReview', { count: stats?.pendingDriverApprovals ?? 0 })}
            icon={Car}
            iconBg="#F3E8FF"
            iconColor="#8B2EE6"
          />
          <StatTile
            label={t('dashboard.stats.totalOrders')}
            value={<span className={skel}>{formatNumber(stats?.totalOrders ?? 0)}</span>}
            subLabel={t('dashboard.stats.completedShort', { count: stats?.completedOrders ?? 0 })}
            icon={ShoppingBag}
            iconBg="#D1FAE5"
            iconColor="#059669"
            trend={12}
            trendLabel={t('dashboard.stats.vsYesterday')}
          />
          <StatTile
            label={t('dashboard.stats.activeDrivers')}
            value={<span className={skel}>{formatNumber(stats?.activeDrivers ?? 0)}</span>}
            subLabel={t('dashboard.stats.activeNow')}
            icon={Star}
            iconBg="#FEF3C7"
            iconColor="#D97706"
          />
        </div>

        {/* ── Today row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Featured: Today's Revenue */}
          <div className="lg:col-span-2 card p-6 bg-gradient-to-br from-hancr-navy to-hancr-purple text-white relative overflow-hidden">
            <div className="absolute -top-12 end-[-3rem] w-48 h-48 rounded-full bg-hancr-violet/20 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-hancr-violet" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {t('dashboard.stats.totalRevenue')}
                </span>
              </div>
              <p className="text-4xl font-extrabold mt-1">
                <span className={skel}>
                  {formatCurrency(stats?.totalRevenue ?? 0)}
                </span>
              </p>
              <div className="mt-3 flex items-center gap-4">
                <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-300">
                  <ArrowUpRight className="w-4 h-4" />
                  +8%
                </span>
                <span className="text-xs text-white/60">{t('dashboard.stats.sinceStart')}</span>
              </div>
            </div>
            <Activity className="absolute bottom-4 end-4 w-14 h-14 text-white/10" />
          </div>

          {/* Cancellations */}
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-tile-label">{t('dashboard.stats.canceledOrders')}</p>
                <p className="stat-tile-value">
                  <span className={skel}>{stats?.canceledOrders ?? 0}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1.5 font-medium">
                  {t('dashboard.stats.ofTotal', { total: stats?.totalOrders ?? 0 })}
                </p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-rose-100">
                <Clock className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="stat-tile-delta-down">
                <ArrowDownRight className="w-3.5 h-3.5" />
                3%
              </span>
            </div>
          </div>
        </div>

        {/* ── Revenue Chart ── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg">
                {t('dashboard.chart.title')}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('dashboard.chart.lastDays', { days: 14 })}
              </p>
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

          {chart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Activity className="w-12 h-12 text-gray-300" />
              <p className="text-sm font-medium">{t('dashboard.chart.empty')}</p>
            </div>
          ) : (
            <RevenueChart data={chart} />
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">
            {t('dashboard.quickActions.title')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickLink
              href="/users/drivers?pendingOnly=true"
              icon={Car}
              label={t('dashboard.quickActions.approveDrivers')}
              subtitle={t('dashboard.quickActions.approveDriversHint')}
              variant="amber"
            />
            <QuickLink
              href="/orders?status=active"
              icon={ShoppingBag}
              label={t('dashboard.quickActions.liveOrders')}
              subtitle={t('dashboard.quickActions.liveOrdersHint')}
              variant="emerald"
            />
            <QuickLink
              href="/features"
              icon={Sparkles}
              label={t('dashboard.quickActions.featureFlags')}
              subtitle={t('dashboard.quickActions.featureFlagsHint')}
              variant="violet"
            />
            <QuickLink
              href="/analytics"
              icon={MapIcon}
              label={t('dashboard.quickActions.analytics')}
              subtitle={t('dashboard.quickActions.analyticsHint')}
              variant="navy"
            />
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
