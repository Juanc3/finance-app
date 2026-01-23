"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/context/StoreContext";
import { format, subMonths, startOfMonth, startOfYear, isSameMonth, isSameYear, parseISO } from "date-fns";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { UserComparisonChart } from "@/components/features/UserComparisonChart";
import { IncomeVsExpenseChart } from "@/components/features/IncomeVsExpenseChart";
import { ExpensesByCategoryChart } from "@/components/features/ExpensesByCategoryChart";
import { cn } from "@/lib/utils";

export default function AnalysisPage() {
  const { transactions, getFormattedCurrency } = useStore();

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const currentYear = startOfYear(now);

    let thisMonthExpense = 0;
    let lastMonthExpense = 0;
    let thisYearExpense = 0;
    let totalSavings = 0;

    transactions.forEach((t) => {
      const date = parseISO(t.date);
      const isExpense = t.type === 'expense';
      const isSaving = t.type === 'saving';

      if (isSaving) {
          totalSavings += t.amount;
      }
      
      if (isExpense) {
        if (isSameMonth(date, currentMonth)) thisMonthExpense += t.amount;
        if (isSameMonth(date, lastMonth)) lastMonthExpense += t.amount;
        if (isSameYear(date, currentYear)) thisYearExpense += t.amount;
      }
    });

    const monthDiff = thisMonthExpense - lastMonthExpense;
    const monthPercent = lastMonthExpense > 0 ? (monthDiff / lastMonthExpense) * 100 : 0;

    return {
      thisMonthExpense,
      lastMonthExpense,
      thisYearExpense,
      monthDiff,
      monthPercent,
      totalSavings
    };
  }, [transactions]);

  // Chart Data: Monthly Spending vs Savings this Year
  const monthlyData = useMemo(() => {
     const data = [];
     for(let i=0; i<12; i++) {
        const date = new Date(new Date().getFullYear(), i, 1);
        const monthName = format(date, "MMM");
        
        let expense = 0;
        let saving = 0;

        transactions.forEach(t => {
            if (isSameMonth(parseISO(t.date), date)) {
                if (t.type === 'expense') expense += t.amount;
                if (t.type === 'saving') saving += t.amount;
            }
        });
        
        data.push({ name: monthName, Expense: expense, Saving: saving });
     }
     return data;
  }, [transactions]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-4 pb-8 animate-in fade-in duration-500">
      <div className="flex-none">
        <h1 className="text-2xl font-bold text-foreground mb-2">Análisis</h1>
        
        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-4 flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Este Mes (Gastos)</h3>
                    <p className="text-2xl font-bold text-foreground">{getFormattedCurrency(metrics.thisMonthExpense)}</p>
                </div>
                <div className="text-right">
                    <span className={cn("text-xs flex items-center justify-end font-medium", metrics.monthDiff > 0 ? "text-red-500" : "text-emerald-500")}>
                        {metrics.monthDiff > 0 ? <ArrowUpRight className="h-3 w-3"/> : <ArrowDownRight className="h-3 w-3"/>}
                        {Math.abs(metrics.monthPercent).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">vs mes anterior</span>
                </div>
            </GlassCard>

            <GlassCard className="p-4">
                <h3 className="text-xs font-medium text-muted-foreground">Mes Pasado (Gastos)</h3>
                <p className="text-2xl font-bold text-foreground">{getFormattedCurrency(metrics.lastMonthExpense)}</p>
            </GlassCard>

            <GlassCard className="p-4">
                <h3 className="text-xs font-medium text-muted-foreground">Este Año (Gastos)</h3>
                <p className="text-2xl font-bold text-foreground">{getFormattedCurrency(metrics.thisYearExpense)}</p>
            </GlassCard>

            <GlassCard className="p-4 border-blue-500/30">
                <h3 className="text-xs font-medium text-muted-foreground">Ahorros Totales</h3>
                <p className="text-2xl font-bold text-blue-500">{getFormattedCurrency(metrics.totalSavings)}</p>
            </GlassCard>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-4">
         {/* Row 1: Yearly Overview (Stacked) & User Comparison */}
         <div className="lg:col-span-8 lg:row-span-1 min-h-75 lg:min-h-0">
            <GlassCard className="flex flex-col h-full">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2 shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary"/>
                    Resumen Anual (Gastos vs Ahorros)
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} cursor={{ fill: 'var(--muted)', opacity: 0.1 }} />
                            <Legend />
                            <Bar dataKey="Expense" fill="#ef4444" stackId="a" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="Saving" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
         </div>

         <div className="lg:col-span-4 lg:row-span-1 min-h-75 lg:min-h-0">
             <UserComparisonChart className="h-full" />
         </div>

         {/* Row 2: Category Pie & Income/Exp/Save Pie */}
         <div className="lg:col-span-6 lg:row-span-1 min-h-75 lg:min-h-0">
            <ExpensesByCategoryChart className="h-full" />
         </div>

         <div className="lg:col-span-6 lg:row-span-1 min-h-75 lg:min-h-0">
            <IncomeVsExpenseChart className="h-full" />
         </div>
      </div>
    </div>
  );
}
