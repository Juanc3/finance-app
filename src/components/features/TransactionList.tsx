"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useStore, Transaction } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Trash2, Pencil } from "lucide-react";
import { useState } from "react";

interface TransactionListProps {
  className?: string;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionList({ className, onEdit }: TransactionListProps) {
  const { transactions, users, categories, deleteTransaction, getFormattedCurrency } = useStore();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteId) {
        deleteTransaction(deleteId);
        setDeleteId(null);
        toast({ type: "error", title: "Transacción eliminada", message: "La transacción ha sido eliminada correctamente." });
    }
  };

  if (transactions.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted p-4 rounded-full mb-4">
            <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-foreground">Aún no hay transacciones</h3>
        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
          Agrega tu primer gasto para comenzar a registrar tu economía compartida.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h3 className="text-xl font-bold text-foreground shrink-0">Actividad Reciente</h3>
      <div className={cn("space-y-3 overflow-y-auto pr-2 flex-1 min-h-0", !className && "max-h-125 lg:max-h-none")}>
        {transactions.map((t) => {
          const payer = users.find((u) => u.id === t.paidBy);
          const category = categories.find(c => c.name === t.category);
          
          // Fallback if category not found (e.g. deleted or old)
          const catIcon = category?.icon || '💸';
          const catColor = category?.color || 'bg-muted';

          return (
            <GlassCard key={t.id} className="flex items-center justify-between p-4 group">
              <div className="flex items-center gap-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0 shadow-lg text-white", catColor)}>
                    {catIcon}
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(t.date), 'MMM d, h:mm a')} • {t.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={cn(
                    "font-bold", 
                    t.type === 'income' 
                        ? 'text-emerald-500' 
                        : t.type === 'saving' 
                            ? 'text-blue-500' 
                            : 'text-red-500'
                  )}>
                    {t.type === 'income' ? '+' : ''}
                    {getFormattedCurrency(t.amount, t.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.type === 'income' ? 'ganado por' : 'pagado por'}{' '}
                    <span className={payer?.color.replace('bg-', 'text-')}>{payer?.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                        onClick={() => onEdit(t)}
                        className="p-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                      <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

       <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar transacción?"
        description="Esta acción eliminará la transacción permanentemente y afectará los balances."
        confirmText="Eliminar"
        variant="danger"
      />

    </div>
  );
}
