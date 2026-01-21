"use client";

import React, { useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { TransactionList } from "./TransactionList";
import { AddTransactionModal } from "./AddTransactionModal";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
// import { useStore } from "@/context/StoreContext";
import { SpendingChart } from "./SpendingChart";

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const { currentUser } = useStore();

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] gap-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen</h1>
          <p className="text-sm text-slate-400">Resumen de sus finanzas compartidas</p>
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
