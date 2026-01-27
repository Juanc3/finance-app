"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import React, { useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type FilterType = "all" | "individual" | "shared";

export function ExpensesByCategoryChart({ className }: { className?: string }) {
  const { transactions, categories, getFormattedCurrency, loading } = useStore();
  const [filter, setFilter] = useState<FilterType>("all");

  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    // 1. Filter expenses based on Type AND Shared status
    const expenses = transactions.filter((t) => {
        if (t.type !== "expense") return false;
        
        if (filter === "individual") return t.isShared === false;
        if (filter === "shared") return t.isShared === true;
        
        return true;
    });

    // 2. Group by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      const catName = t.category || "Sin Categoría";
      categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
    });

    // 3. Map to array
    return Object.entries(categoryTotals)
      .map(([name, value], index) => {
        const category = categories.find((c) => c.name === name);
        let color = category ? getHexColor(category.color) : null;
        
        if (!color) {
            color = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
        }

        return { name, value, color };
      })
      .sort((a, b) => b.value - a.value); 
  }, [transactions, categories, filter]);

  if (loading) {
     return (
        <GlassCard className={cn("flex flex-col", className)}>
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
            <div className="flex-1 flex items-center justify-center">
                 <Skeleton className="h-40 w-40 rounded-full" />
            </div>
        </GlassCard>
     );
  }

  if (transactions.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 shrink-0">
          <h3 className="text-lg font-bold text-foreground">
            Gastos por Categoría
          </h3>
          <div className="flex bg-muted p-1 rounded-lg self-stretch sm:self-auto">
             <button onClick={() => setFilter("all")} className={cn("flex-1 sm:flex-none px-3 py-1 text-[10px] font-medium rounded transition-all", filter === "all" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}>Todo</button>
             <button onClick={() => setFilter("individual")} className={cn("flex-1 sm:flex-none px-3 py-1 text-[10px] font-medium rounded transition-all", filter === "individual" ? "bg-blue-500 text-white shadow" : "text-muted-foreground hover:text-foreground")}>Individual</button>
             <button onClick={() => setFilter("shared")} className={cn("flex-1 sm:flex-none px-3 py-1 text-[10px] font-medium rounded transition-all", filter === "shared" ? "bg-purple-500 text-white shadow" : "text-muted-foreground hover:text-foreground")}>Grupal</button>
          </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip getFormattedCurrency={getFormattedCurrency} />} isAnimationActive={false} />
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
           <div className="text-muted-foreground ml-5 font-mono text-sm">
             {getFormattedCurrency(value)}
           </div>
         </div>
      );
    }
    return null;
  };

const FALLBACK_COLORS = [
    "#f97316", // Orange
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#ef4444", // Red
    "#ec4899", // Pink
    "#0ea5e9", // Sky
    "#10b981", // Emerald
    "#eab308", // Yellow
    "#64748b", // Slate
    "#8b5cf6", // Violet
    "#f43f5e", // Rose
    "#06b6d4", // Cyan
];

function getHexColor(tailwindClass: string): string | null {
  const map: Record<string, string> = {
    "bg-orange-500": "#f97316",
    "bg-blue-500": "#3b82f6",
    "bg-yellow-500": "#eab308",
    "bg-purple-500": "#a855f7",
    "bg-red-500": "#ef4444",
    "bg-pink-500": "#ec4899",
    "bg-sky-500": "#0ea5e9",
    "bg-gray-500": "#6b7280",
    "bg-emerald-500": "#10b981",
    "bg-violet-500": "#8b5cf6",
    "bg-indigo-500": "#6366f1",
    "bg-rose-500": "#f43f5e",
    "bg-cyan-500": "#06b6d4",
    "bg-lime-500": "#84cc16",
    "bg-teal-500": "#14b8a6",
  };
  return map[tailwindClass] || null;
}
