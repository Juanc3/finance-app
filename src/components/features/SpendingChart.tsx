"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import { format, parseISO, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay } from "date-fns";
import React, { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export function SpendingChart({ className }: { className?: string }) {
  const { transactions, users, loading } = useStore();
  const [viewMode, setViewMode] = React.useState<"type" | "user">("type");

  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => isSameDay(parseISO(t.date), day));
      
      const item: any = {
        date: format(day, "MMM d"),
      };

      if (viewMode === "type") {
        // Breakdown by Type
        item["Ingresos"] = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        item["Gastos"] = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
        item["Ahorros"] = dayTransactions
            .filter(t => t.type === 'saving')
            .reduce((acc, t) => acc + t.amount, 0);
      } else {
        // Breakdown by User (Only Expenses usually makes sense for 'Spending', but let's show Expenses)
        users.forEach(user => {
            item[user.name] = dayTransactions
            .filter(t => t.paidBy === user.id && (t.type === 'expense' || !t.type)) // Default to expense
            .reduce((acc, t) => acc + t.amount, 0);
        });
      }

      return item;
    });
  }, [transactions, users, viewMode]);

  if (loading) {
    return (
        <GlassCard className={cn("flex flex-col min-h-75 h-full", className)}>
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <div className="flex-1 w-full min-h-75">
                 <Skeleton className="h-full w-full rounded-xl" />
            </div>
        </GlassCard>
    )
  }

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col min-h-75", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
          <h3 className="text-xl font-bold text-foreground">
            {viewMode === "type" ? "Balance Mensual" : "Gastos por Usuario"}
          </h3>
          
          <div className="flex bg-muted p-1 rounded-lg self-start sm:self-auto">
            <button
                onClick={() => setViewMode("type")}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    viewMode === "type" 
                        ? "bg-primary text-primary-foreground shadow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
            >
                Por Tipo
            </button>
            <button
                onClick={() => setViewMode("user")}
                className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    viewMode === "user" 
                        ? "bg-primary text-primary-foreground shadow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
            >
                Por Usuario
            </button>
          </div>
      </div>

      <div className="flex-1 w-full min-h-75">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {viewMode === "type" ? (
                  <>
                    <linearGradient id="color-income" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="color-expense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="color-saving" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </>
              ) : (
                users.map((user) => (
                    <linearGradient key={user.id} id={`color-${user.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={user.hexColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={user.hexColor} stopOpacity={0} />
                    </linearGradient>
                ))
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
            />
            <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    color: 'var(--foreground)' 
                }}
            />
            
            {viewMode === "type" ? (
                <>
                     <Area
                        type="monotone"
                        dataKey="Ingresos"
                        stroke="#10b981" // Emerald 500
                        fillOpacity={1}
                        fill="url(#color-income)"
                        strokeWidth={3}
                    />
                    <Area
                        type="monotone"
                        dataKey="Ahorros"
                        stroke="#3b82f6" // Blue 500
                        fillOpacity={1}
                        fill="url(#color-saving)"
                        strokeWidth={3}
                    />
                     <Area
                        type="monotone"
                        dataKey="Gastos"
                        stroke="#ef4444" // Red 500
                        fillOpacity={1}
                        fill="url(#color-expense)"
                        strokeWidth={3}
                    />
                </>
            ) : (
                users.map((user) => (
                <Area
                    key={user.id}
                    type="monotone"
                    dataKey={user.name}
                    stroke={user.hexColor}
                    fillOpacity={1}
                    fill={`url(#color-${user.id})`}
                    strokeWidth={3}
                    stackId="1" 
                />
                ))
            )}
            
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

