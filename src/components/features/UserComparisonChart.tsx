"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

export function UserComparisonChart({ className }: { className?: string }) {
  const { transactions, users, getFormattedCurrency, loading } = useStore();

  const data = useMemo(() => {
    // ... logic
    if (transactions.length === 0) return [];
    
    // Calculate expense and saving per user
    const comparisonData = users.map(user => {
      const expenses = transactions
        .filter(t => t.paidBy === user.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const savings = transactions
        .filter(t => t.paidBy === user.id && t.type === 'saving')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: user.name,
        Expenses: expenses,
        Savings: savings,
      };
    });

    return comparisonData;
  }, [transactions, users]);

  if (loading) {
      return (
        <GlassCard className={cn("flex flex-col", className)}>
            <Skeleton className="h-7 w-48 mb-4" />
            <div className="flex-1 flex items-end gap-4 px-2">
                 {[1, 2].map(i => (
                    <div key={i} className="flex-1 space-y-2">
                        <Skeleton className="h-[60%] w-full rounded-t-lg" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                 ))}
            </div>
        </GlassCard>
      );
  }

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col", className)}>
      <h3 className="text-xl font-bold text-foreground mb-4 shrink-0">Comparación de Usuarios</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
                dataKey="name" 
                stroke="var(--muted-foreground)" 
                fontSize={14} 
                tickLine={false} 
                axisLine={false}
            />
            <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => getFormattedCurrency(value)}
            />
            <Tooltip 
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    color: 'var(--foreground)' 
                }}
            />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
