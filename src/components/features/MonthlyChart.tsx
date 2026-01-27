"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import { format, parseISO, startOfYear, eachMonthOfInterval, endOfYear } from "date-fns";
import { es } from "date-fns/locale";
import React, { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export function MonthlyTrendChart({ className }: { className?: string }) {
  const { transactions, loading } = useStore();

  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    // Show trailing 12 months or just current year? Let's do Current Year for simplicity as per request context
    const start = startOfYear(now);
    const end = endOfYear(now);
    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
      const monthTransactions = transactions.filter(t => {
          const tDate = parseISO(t.date);
          return tDate.getMonth() === month.getMonth() && tDate.getFullYear() === month.getFullYear();
      });
      
      const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);
          
      const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);

      const saving = monthTransactions
          .filter(t => t.type === 'saving')
          .reduce((acc, t) => acc + t.amount, 0);

      return {
        name: format(month, "MMM", { locale: es }),
        Ingresos: income,
        Gastos: expense,
        Ahorros: saving,
      };
    });
  }, [transactions]);

  if (loading) {
     return <Skeleton className="h-full w-full rounded-xl" />
  }

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col min-h-80", className)}>
        <div className="flex items-center justify-between mb-6 shrink-0">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Tendencias Anuales</h3>
                    <p className="text-xs text-muted-foreground">Flujo de caja mensual</p>
                </div>
             </div>
        </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSaving" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
                dataKey="name" 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
            />
            <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    color: 'var(--foreground)' 
                }}
            />
            <Area
                type="monotone"
                dataKey="Ingresos"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIncome)"
                strokeWidth={3}
            />
            <Area
                type="monotone"
                dataKey="Ahorros"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSaving)"
                strokeWidth={3}
            />
            <Area
                type="monotone"
                dataKey="Gastos"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorExpense)"
                strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
