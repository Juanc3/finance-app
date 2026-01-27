"use client";

import React, { useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { TransactionList } from "./TransactionList";
import { AddTransactionModal } from "./AddTransactionModal";
import { Button } from "@/components/ui/Button";
import { Plus, Wallet, TrendingUp, Users, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { SpendingChart } from "./SpendingChart";
import { GlassCard } from "@/components/ui/GlassCard";

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { transactions, loading } = useStore();

  // Empty State View
  if (!loading && transactions.length === 0) {
      return (
        <div className="flex flex-col h-full items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-2xl w-full text-center space-y-8">
                
                {/* Hero Icon */}
                <div className="relative mx-auto h-32 w-32 mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative h-full w-full bg-linear-to-br from-primary/20 to-purple-500/20 border border-primary/20 rounded-4xl flex items-center justify-center shadow-2xl">
                        <Wallet className="h-16 w-16 text-primary" />
                    </div>
                    {/* Floating decorators */}
                    <div className="absolute -top-4 -right-4 h-12 w-12 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg animate-bounce duration-3000">
                        <span className="text-2xl">💸</span>
                    </div>
                    <div className="absolute -bottom-2 -left-6 h-10 w-10 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg animate-bounce duration-4000">
                        <span className="text-xl">📊</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Bienvenido a tu Panel
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Tu espacio para organizar las finanzas compartidas. <br/>
                        Comienza agregando tu primer movimiento.
                    </p>
                </div>

                <div className="flex justify-center pt-4">
                    <Button 
                        onClick={() => setIsModalOpen(true)} 
                        className="h-14 px-8 text-lg font-bold gap-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105"
                    >
                        <Plus className="h-6 w-6" />
                        Agregar mi primer gasto
                        <ArrowRight className="h-5 w-5 opacity-60 ml-1" />
                    </Button>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-12 opacity-80">
                    <GlassCard className="p-4 flex flex-col gap-3 hover:bg-primary/5 transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Control Total</h3>
                            <p className="text-xs text-muted-foreground mt-1">Visualiza tus ingresos y gastos con gráficos detallados.</p>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4 flex flex-col gap-3 hover:bg-purple-500/5 transition-colors group">
                         <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Finanzas Compartidas</h3>
                            <p className="text-xs text-muted-foreground mt-1">Divide gastos fácilmente y lleva las cuentas claras.</p>
                        </div>
                    </GlassCard>
                     <GlassCard className="p-4 flex flex-col gap-3 hover:bg-emerald-500/5 transition-colors group">
                         <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Ahorra Más</h3>
                            <p className="text-xs text-muted-foreground mt-1">Identifica oportunidades de ahorro y logra tus metas.</p>
                        </div>
                    </GlassCard>
                </div>
            </div>

             <AddTransactionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden gap-4 animate-in fade-in duration-500 pr-1 lg:pr-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumen</h1>
          <p className="text-sm text-muted-foreground">Resumen de sus finanzas compartidas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-violet-500/20" size="sm">
          <Plus className="h-4 w-4" />
          Agregar Gasto
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-4">
        
        {/* Top Row: Cards (Full Width) */}
        <div className="lg:col-span-12">
            <SummaryCards />
        </div>

        {/* Bottom Row: Charts & Activity */}
        <div className="lg:col-span-7 min-h-75 lg:min-h-0 lg:h-full">
            <SpendingChart className="h-full" />
        </div>
        <div className="lg:col-span-5 min-h-100 lg:min-h-0 lg:h-full">
            <TransactionList className="h-full" />
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
