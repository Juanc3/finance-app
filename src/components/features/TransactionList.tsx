"use client";


import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useStore, Transaction } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Trash2, Pencil, User, Users, CheckCircle, Clock } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useState } from "react";

interface TransactionListProps {
  className?: string;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionList({ className, onEdit }: TransactionListProps) {
  const { transactions, users, categories, deleteTransaction, markAsPaid, getFormattedCurrency, loading } = useStore();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteId) {
        deleteTransaction(deleteId);
        setDeleteId(null);
        toast({ type: "error", title: "Transacción eliminada", message: "La transacción ha sido eliminada correctamente." });
    }
  };

  const handlePayConfirm = () => {
      if (confirmPayId) {
          markAsPaid(confirmPayId);
          setConfirmPayId(null);
          toast({ type: "success", title: "Pago registrado", message: "La transacción se ha marcado como pagada." });
      }
  };

  if (loading) {
    return (
        <div className={cn("flex flex-col gap-4 h-full", className)}>
            <h3 className="text-xl font-bold text-foreground shrink-0">Actividad Reciente</h3>
            <div className="space-y-3 overflow-hidden flex-1 min-h-0">
                {[1, 2, 3, 4, 5].map((i) => (
                    <GlassCard key={i} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    )
  }

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
                    <CategoryIcon iconName={catIcon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-foreground", t.status === 'paid' && "line-through opacity-70")}>{t.description}</p>
                      
                      {/* Status Badges - Only show for Future/Today to keep history clean */}
                      {(new Date(t.date) >= new Date(new Date().setHours(0,0,0,0))) && (
                          <>
                            {t.status === 'paid' ? (
                                <span className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                                    t.type === 'income' ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
                                    : t.type === 'saving' ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
                                    : "text-green-600 bg-green-500/10 border-green-500/20"
                                )}>
                                    <CheckCircle className="h-3 w-3" />
                                    {t.type === 'income' ? "COBRADO" : (t.type === 'saving' ? "APORTADO" : "PAGADO")}
                                </span>
                            ) : (
                                <span className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                                    t.type === 'income' ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                                    : t.type === 'saving' ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
                                    : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                                )}>
                                    <Clock className="h-3 w-3" />
                                    {t.type === 'income' ? "POR COBRAR" : (t.type === 'saving' ? "POR APORTAR" : "PENDIENTE")}
                                </span>
                            )}
                          </>
                      )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{format(new Date(t.date), 'MMM d, h:mm a')}</span>
                    <span>•</span>
                    <span>{t.category}</span>
                    
                    {t.isShared === false ? (
                         <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md border border-blue-500/20" title="Visible solo para ti">
                            <User className="h-3 w-3" />
                            Individual
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-md border border-purple-500/20" title="Compartido con el grupo">
                             <Users className="h-3 w-3" />
                             Grupal
                        </span>
                    )}
                  </div>
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
                            : 'text-red-500',
                     t.status === 'paid' && "opacity-60"
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
                  <div className="flex flex-col gap-1">
                     <button
                          onClick={() => setDeleteId(t.id)}
                          className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <Trash2 className="h-4 w-4" />
                      </button>
                      
                      {/* Quick Pay Action for Pending Transactions */}
                      {t.status !== 'paid' && new Date(t.date) > new Date(new Date().setHours(0,0,0,0)) && (
                          <button
                              onClick={() => setConfirmPayId(t.id)}
                              className="p-2 text-muted-foreground hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t.type === 'income' ? "Marcar como cobrado" : (t.type === 'saving' ? "Marcar como depositado" : "Marcar como pagado")}
                          >
                              <CheckCircle className="h-4 w-4" />
                          </button>
                      )}
                  </div>
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

      <ConfirmModal 
        isOpen={!!confirmPayId}
        onClose={() => setConfirmPayId(null)}
        onConfirm={handlePayConfirm}
        title={(() => {
            const t = transactions.find(tx => tx.id === confirmPayId);
            if (!t) return "¿Confirmar?";
            return t.type === 'income' ? "¿Confirmar cobro?" : (t.type === 'saving' ? "¿Confirmar ahorro?" : "¿Confirmar pago?");
        })()}
        description={(() => {
            const t = transactions.find(tx => tx.id === confirmPayId);
            if (!t) return "";
            return t.type === 'income' 
                ? "Esta acción marcará el ingreso como recibido y actualizará tu balance."
                : (t.type === 'saving' 
                    ? "Esta acción marcará el ahorro como depositado/guardado."
                    : "Esta acción marcará la transacción como pagada y afectará tu balance actual.");
        })()}
        confirmText={(() => {
            const t = transactions.find(tx => tx.id === confirmPayId);
            if (!t) return "Confirmar";
            return t.type === 'income' ? "Confirmar Ingreso" : (t.type === 'saving' ? "Confirmar Ahorro" : "Confirmar Pago");
        })()}
        variant="info" // This expects "default" | "info" | "warning" | "danger" | undefined. "default" might need to be cast or omitted if strictly typed
      />

    </div>
  );
}
