import { SummaryCards } from "@/components/features/SummaryCards"; // Using existing component
import React from "react";
import { UserComparisonChart } from "@/components/features/UserComparisonChart";
import { IncomeVsExpenseChart } from "@/components/features/IncomeVsExpenseChart";
import { ExpensesByCategoryChart } from "@/components/features/ExpensesByCategoryChart";
import { SharedVsIndividualChart } from "@/components/features/SharedVsIndividualChart";
import { MonthlyTrendChart } from "@/components/features/MonthlyChart";

export default function AnalysisPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-6 pb-24 animate-in fade-in duration-500">
      <div className="flex-none">
        <h1 className="text-2xl font-bold text-foreground mb-4">Análisis</h1>
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
    </div>
  );
}
