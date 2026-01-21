"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useStore, Transaction } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Trash2, Pencil } from "lucide-react";
import React from "react";

interface TransactionListProps {
  className?: string;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionList({ className, onEdit }: TransactionListProps) {
  const { transactions, users, deleteTransaction, getFormattedCurrency } = useStore();

  if (transactions.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
            <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-white">Aún no hay transacciones</h3>
        <p className="text-slate-400 max-w-xs mx-auto mt-2">
          Agrega tu primer gasto para comenzar a registrar tu economía compartida.
        </p>
      </GlassCard>
    );
  }

  const emojis: Record<string, string> = {
    Comida: '🍔',
    Casa: '🏠',
    Utilidades: '💡',
    Entretenimiento: '🎬',
    Transporte: '🚗',
    Shopping: '🛍️',
    Viaje: '✈️',
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h3 className="text-xl font-bold text-white shrink-0">Actividad Reciente</h3>
      <div className={cn("space-y-3 overflow-y-auto pr-2 flex-1 min-h-0", !className && "max-h-125 lg:max-h-none")}>
        {transactions.map((t) => {
          const payer = users.find((u) => u.id === t.paidBy);
          return (
            <GlassCard key={t.id} className="flex items-center justify-between p-4 group">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-lg shrink-0">
                    {/* Emoji based on category could go here, simplicity for now */}
                    {emojis[t.category] || '💸'}
                </div>
                <div>
                  <p className="font-medium text-white">{t.description}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(t.date), 'MMM d, h:mm a')} • {t.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={cn(
                    "font-bold", 
                    t.type === 'income' 
                        ? 'text-emerald-400' 
                        : t.type === 'saving' 
                            ? 'text-blue-500' 
                            : 'text-red-400'
                  )}>
                    {t.type === 'income' ? '+' : ''}
                    {getFormattedCurrency(t.amount, t.currency)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.type === 'income' ? 'ganado por' : 'pagado por'}{' '}
                    <span className={payer?.color.replace('bg-', 'text-')}>{payer?.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                        onClick={() => onEdit(t)}
                        className="p-2 text-slate-600 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                      onClick={() => deleteTransaction(t.id)}
                      className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                      <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
