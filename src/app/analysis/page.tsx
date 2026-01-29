'use client';

import { SummaryCards } from '@/components/features/SummaryCards';
import React, { useState } from 'react';
import { UserComparisonChart } from '@/components/features/UserComparisonChart';
import { IncomeVsExpenseChart } from '@/components/features/IncomeVsExpenseChart';
import { ExpensesByCategoryChart } from '@/components/features/ExpensesByCategoryChart';
import { SharedVsIndividualChart } from '@/components/features/SharedVsIndividualChart';
import { MonthlyTrendChart } from '@/components/features/MonthlyChart';
import { useStore } from '@/context/StoreContext';
import { AddTransactionModal } from '@/components/features/AddTransactionModal';
import { BarChart3, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AnalysisPage() {
  const { transactions, loading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-6 pb-24 animate-in fade-in">
        <div className="h-8 w-32 bg-muted/20 rounded-lg animate-pulse" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/10 rounded-3xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-muted/10 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Empty State
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)] pb-24 animate-in fade-in duration-500">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Análisis
          </h1>
          <p className="text-muted-foreground">Estadísticas detalladas de tus finanzas.</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative h-40 w-40 bg-muted/10 rounded-full flex items-center justify-center border border-border/50 shadow-2xl backdrop-blur-sm">
              <BarChart3 className="h-20 w-20 text-muted-foreground/50" />
            </div>

            {/* Decoration Icons */}
            <div className="absolute -top-4 -right-4 p-3 bg-background/80 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 animate-bounce delay-700">
              <Plus className="h-6 w-6 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3 max-w-md">Aún no hay datos suficientes</h2>
          <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
            Comienza agregando tus primeros gastos o ingresos para desbloquear reportes detallados y visualizaciones.
          </p>

          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105"
          >
            Agregar Transacción <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  // Main Content (With Data)
  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-8 pb-24 animate-in fade-in duration-500">
      <div className="flex-none space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Análisis
            </h1>
            <p className="text-muted-foreground">Estadísticas detalladas de tus finanzas.</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            size="sm"
            className="hidden sm:flex rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        <SummaryCards />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 auto-rows-[300px] lg:auto-rows-[400px] gap-6 pb-4">
        {/* Row 1: Full Width Trend */}
        <div className="lg:col-span-12">
          <MonthlyTrendChart className="h-full" />
        </div>

        {/* Row 2: Shared vs Individual (Left) & Categories (Right) */}
        <div className="lg:col-span-4">
          <SharedVsIndividualChart className="h-full" />
        </div>
        <div className="lg:col-span-8">
          <ExpensesByCategoryChart className="h-full" />
        </div>

        {/* Row 3: User Comparison & Income vs Expense */}
        <div className="lg:col-span-6">
          <UserComparisonChart className="h-full" />
        </div>
        <div className="lg:col-span-6">
          <IncomeVsExpenseChart className="h-full" />
        </div>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
