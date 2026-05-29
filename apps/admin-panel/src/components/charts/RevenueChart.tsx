'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DataPoint {
  date: string;
  revenue: number;
  orderCount: number;
  platformRevenue?: number;
}

interface RevenueChartProps {
  data: DataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#B048FF" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#B048FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22223B" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#22223B" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v) => v.slice(5)} // show MM-DD
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#22223B',
            border: 'none',
            borderRadius: 8,
            color: '#F2E9E4',
            fontSize: 12,
          }}
          formatter={(value: number, name: string) =>
            name === 'revenue'
              ? [formatCurrency(value), 'الإيرادات']
              : [value, 'الطلبات']
          }
        />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#B048FF"
          strokeWidth={2}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: '#B048FF' }}
        />
        <Area
          type="monotone"
          dataKey="orderCount"
          stroke="#22223B"
          strokeWidth={2}
          fill="url(#colorOrders)"
          dot={false}
          activeDot={{ r: 4, fill: '#22223B' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
