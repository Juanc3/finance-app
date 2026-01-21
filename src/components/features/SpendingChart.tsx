"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/context/StoreContext";
import { format, parseISO, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay } from "date-fns";
import React, { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export function SpendingChart({ className }: { className?: string }) {
  const { transactions, users } = useStore();

  const data = useMemo(() => {
    // ... (same logic)
    if (transactions.length === 0) return [];

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    // Create an array of all days in the current month
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => isSameDay(parseISO(t.date), day));
      
      const item: any = {
        date: format(day, "MMM d"),
      };

      // Sum for each user
      users.forEach(user => {
        item[user.name] = dayTransactions
          .filter(t => t.paidBy === user.id)
          .reduce((acc, t) => acc + t.amount, 0);
      });

      return item;
    });
  }, [transactions, users]);

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col min-h-75", className)}>
      <h3 className="text-xl font-bold text-white mb-4 shrink-0">Tendencia de Gastos (Este Mes)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {users.map((user) => (
                <linearGradient key={user.id} id={`color-${user.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={user.hexColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={user.hexColor} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
            />
            <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '8px', 
                    color: '#fff' 
                }}
            />
            {users.map((user) => (
              <Area
                key={user.id}
                type="monotone"
                dataKey={user.name}
                stroke={user.hexColor}
                fillOpacity={1}
                fill={`url(#color-${user.id})`}
                strokeWidth={3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

