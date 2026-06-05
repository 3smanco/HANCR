'use client';

import { useQuery } from '@apollo/client';
import { UserPlus, Crown, Phone } from 'lucide-react';
import { REFERRAL_STATS } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { MarketingTabs } from '../_MarketingTabs';

type Row = Record<string, unknown>;

export default function ReferralsPage() {
  const { data, loading } = useQuery(REFERRAL_STATS);
  const totalInvited = data?.adminReferralStats?.totalInvited ?? 0;
  const top: Row[] = data?.adminReferralStats?.topReferrers ?? [];

  return (
    <div>
      <Topbar title="إحصاءات الإحالات" />
      <div className="p-6 space-y-5">
        <MarketingTabs />

        <div className="card p-6 text-center bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white">
          <div className="text-sm opacity-80 mb-1">إجمالي المُحَالين</div>
          <div className="text-4xl font-extrabold">{totalInvited}</div>
        </div>

        <h3 className="font-bold text-gray-900 mt-6 inline-flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          أعلى 10 مُحيلين
        </h3>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : top.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد إحالات بعد</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المُحِيل</th>
                  <th>كود الإحالة</th>
                  <th>الهاتف</th>
                  <th className="text-end">عدد المُحَالين</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r, idx) => (
                  <tr key={r.riderId as number}>
                    <td className="font-bold text-gray-500">{idx + 1}</td>
                    <td>
                      <div className="font-bold text-gray-900">
                        {(r.name as string) ?? `راكب #${r.riderId as number}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        #{r.riderId as number}
                      </div>
                    </td>
                    <td className="font-mono text-sm ltr">
                      {(r.referralCode as string) ?? '—'}
                    </td>
                    <td>
                      {r.phone ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 font-mono ltr">
                          <Phone className="w-3 h-3" />
                          {r.phone as string}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="text-end font-extrabold text-hancr-violet text-lg">
                      {r.invitedCount as number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
