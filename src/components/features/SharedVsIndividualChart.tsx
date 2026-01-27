"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { User, Users } from "lucide-react";
import React, { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function SharedVsIndividualChart({ className }: { className?: string }) {
  const { transactions, getFormattedCurrency, loading } = useStore();

  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Logic: 
    // Individual: isShared === false
    // Shared: isShared === true
    
    const individualTotal = expenses
        .filter(t => t.isShared === false)
        .reduce((sum, t) => sum + t.amount, 0);

    const sharedTotal = expenses
        .filter(t => t.isShared === true)
        .reduce((sum, t) => sum + t.amount, 0);

    if (individualTotal === 0 && sharedTotal === 0) return [];

    return [
        { name: "Individual", value: individualTotal, color: "#3b82f6", icon: User }, // Blue
        { name: "Grupal", value: sharedTotal, color: "#a855f7", icon: Users }, // Purple
    ];
  }, [transactions]);
  if (loading) {
     return (
        <GlassCard className={cn("flex flex-col", className)}>
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex-1 flex items-center justify-center">
                 <Skeleton className="h-40 w-40 rounded-full" />
            </div>
        </GlassCard>
     );
  }

  if (transactions.length === 0 || data.length === 0) return null;

  return (
    <GlassCard className={cn("flex flex-col", className)}>
      <h3 className="text-lg font-bold text-foreground mb-4 shrink-0 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Individual vs Grupal
      </h3>
      <div className="flex-1 w-full min-h-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip getFormattedCurrency={getFormattedCurrency} />} cursor={{ fill: 'transparent' }} />
            <Legend 
                verticalAlign="bottom" 
                height={36} 
                content={(props) => <CustomLegend {...props} />}
            />
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

const CustomLegend = ({ payload }: any) => {
    return (
        <div className="flex justify-center gap-4 text-xs">
            {payload.map((entry: any, index: number) => {
                 const Icon = entry.payload.icon;
                 return (
                    <div key={`item-${index}`} className="flex items-center gap-1.5 text-muted-foreground">
                        {Icon && <Icon className="h-3.5 w-3.5" style={{ color: entry.color }} />}
                        <span style={{ color: entry.color }} className="font-semibold">{entry.value}</span>
                    </div>
                 )
            })}
        </div>
    )
}
