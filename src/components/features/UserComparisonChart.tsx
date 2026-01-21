"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/context/StoreContext";
import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

export function UserComparisonChart({ className }: { className?: string }) {
  const { transactions, users, getFormattedCurrency } = useStore();

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

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col", className)}>
      <h3 className="text-xl font-bold text-white mb-4 shrink-0">Comparación de Usuarios</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={14} 
                tickLine={false} 
                axisLine={false}
            />
            <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => getFormattedCurrency(value)}
            />
            <Tooltip 
                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '8px', 
                    color: '#fff' 
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
