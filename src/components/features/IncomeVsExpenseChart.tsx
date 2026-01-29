'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStore } from '@/context/StoreContext';
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { cn } from '@/lib/utils';

export function IncomeVsExpenseChart({ className }: { className?: string }) {
  const { transactions, getFormattedCurrency, loading } = useStore();

  const data = useMemo(() => {
    // ... logic
    if (transactions.length === 0) return [];

    const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const savings = transactions.filter((t) => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);

    return [
      { name: 'Ingresos', value: income, color: '#10b981' }, // Emerald-500
      { name: 'Gastos', value: expense, color: '#ef4444' }, // Red-500
      { name: 'Ahorros', value: savings, color: '#3b82f6' }, // Blue-500
    ];
  }, [transactions]);

  if (loading) {
    return (
      <GlassCard className={cn('flex flex-col', className)}>
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </GlassCard>
    );
  }

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn('flex flex-col', className)}>
      <h3 className="text-xl font-bold text-foreground mb-4 shrink-0">Entra / Sale / Ahorra</h3>
      <div className="flex-1 w-full min-h-75">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip getFormattedCurrency={getFormattedCurrency} />}
              isAnimationActive={false}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

const CustomTooltip = ({ active, payload, getFormattedCurrency }: any) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;
    return (
      <div className="bg-popover/90 border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
          <span className="text-popover-foreground font-semibold text-sm">{name}</span>
        </div>
        <div className="text-muted-foreground ml-5 font-mono text-sm">{getFormattedCurrency(value)}</div>
      </div>
    );
  }
  return null;
};
