'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { useStore } from '@/context/StoreContext';
import { /* ArrowUpRight , ArrowDownRight ,*/ DollarSign } from 'lucide-react';
import React from 'react';

export function SummaryCards() {
  const { transactions, users, getFormattedCurrency } = useStore();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' || !t.type) // Default to expense
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Calculate per user (Expenses only)
  const userExpenses = users.map((user) => {
    const total = transactions
      .filter((t) => t.paidBy === user.id && (t.type === 'expense' || !t.type))
      .reduce((acc, t) => acc + t.amount, 0);
    return { ...user, total };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <GlassCard gradient className="relative overflow-hidden border-violet-500/30">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-24 w-24 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-300">Balance Neto</h3>
          <p className="text-4xl font-bold text-white mt-2">{getFormattedCurrency(balance)}</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="bg-violet-500/10 px-2 py-1 rounded text-violet-300 font-medium">Total Histórico</span>
          </div>
        </GlassCard>

        {/* Income Card */}
        <GlassCard className="relative overflow-hidden">
             <h3 className="text-sm font-medium text-slate-400">Ingresos Totales</h3>
             <p className="text-3xl font-bold text-emerald-400 mt-2">+{getFormattedCurrency(totalIncome)}</p>
             <p className="text-xs text-slate-500 mt-2">Entradas</p>
        </GlassCard>

        {/* Expense Card */}
        <GlassCard className="relative overflow-hidden">
             <h3 className="text-sm font-medium text-slate-400">Gastos Totales</h3>
             <p className="text-3xl font-bold text-red-400 mt-2">-{getFormattedCurrency(totalExpense)}</p>
             <p className="text-xs text-slate-500 mt-2">Salidas</p>
        </GlassCard>
      </div>
      
      {/* User Contribution Section (Expenses) */}
      <h3 className="text-lg font-bold text-white">Desglose de Gastos por Usuario</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userExpenses.map((u) => (
            <GlassCard key={u.id} className="relative flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className={`h-3 w-3 rounded-full ${u.color}`} />
                   <h3 className="text-sm font-medium text-slate-300">Pagado por {u.name}</h3>
                </div>
                <p className="text-2xl font-bold text-white">{getFormattedCurrency(u.total)}</p>
              </div>
              <div className="text-right">
                 <span className="text-2xl font-bold text-slate-500 opacity-20">{totalExpense > 0 ? Math.round((u.total / totalExpense) * 100) : 0}%</span>
              </div>
            </GlassCard>
          ))}
      </div>
    </div>
  );
}
