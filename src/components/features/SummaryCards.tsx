'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStore } from '@/context/StoreContext';
import { /* ArrowUpRight , ArrowDownRight ,*/ DollarSign } from 'lucide-react';
import React from 'react';

export function SummaryCards() {
  const { transactions, users, getFormattedCurrency, loading } = useStore();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-32 flex flex-col justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </GlassCard>
          ))}
        </div>
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <GlassCard key={i} className="h-24 flex items-center justify-between p-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-8 w-12" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  // Filter out future transactions, UNLESS they are marked as paid
  const validTransactions = transactions.filter((t) => {
    // Logic: Include if date is <= today OR status === 'paid'

    if (t.status === 'paid') return true; // Always include if paid

    const tDate = new Date(t.date);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return tDate <= endOfToday;
  });

  const totalIncome = validTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = validTransactions
    .filter((t) => t.type === 'expense' || !t.type) // Default to expense
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Calculate per user (Expenses only)
  const userExpenses = users.map((user) => {
    const total = validTransactions
      .filter((t) => t.paidBy === user.id && (t.type === 'expense' || !t.type))
      .reduce((acc, t) => acc + t.amount, 0);
    return { ...user, total };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <GlassCard gradient className="relative overflow-hidden border-primary/30">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-24 w-24 text-foreground" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Balance Neto</h3>
          <p className="text-4xl font-bold text-foreground mt-2">{getFormattedCurrency(balance)}</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="bg-primary/10 px-2 py-1 rounded text-primary font-medium">Total Histórico</span>
          </div>
        </GlassCard>

        {/* Income Card */}
        <GlassCard className="relative overflow-hidden">
          <h3 className="text-sm font-medium text-muted-foreground">Ingresos Totales</h3>
          <p className="text-3xl font-bold text-emerald-500 mt-2">+{getFormattedCurrency(totalIncome)}</p>
          <p className="text-xs text-muted-foreground mt-2">Entradas</p>
        </GlassCard>

        {/* Expense Card */}
        <GlassCard className="relative overflow-hidden">
          <h3 className="text-sm font-medium text-muted-foreground">Gastos Totales</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">-{getFormattedCurrency(totalExpense)}</p>
          <p className="text-xs text-muted-foreground mt-2">Salidas</p>
        </GlassCard>
      </div>

      {/* User Contribution Section (Expenses) */}
      <h3 className="text-lg font-bold text-foreground">Desglose de Gastos por Usuario</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userExpenses.map((u) => (
          <GlassCard key={u.id} className="relative flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* Maintain user specific colors if they are dynamic, otherwise use variables if possible. Assuming u.color is a class like 'bg-red-500' */}
                <div className={`h-3 w-3 rounded-full ${u.color}`} />
                <h3 className="text-sm font-medium text-muted-foreground">Pagado por {u.name}</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{getFormattedCurrency(u.total)}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-muted-foreground opacity-20">
                {totalExpense > 0 ? Math.round((u.total / totalExpense) * 100) : 0}%
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
