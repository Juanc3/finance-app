import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function GlassCard({ className, children, gradient, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-6 transition-all duration-300 hover:bg-slate-900/70",
        gradient && "bg-linear-to-br from-violet-500/10 to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
