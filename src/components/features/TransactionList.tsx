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
            <GlassCard key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 sm:gap-0 group">
              <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0 shadow-lg text-white", catColor)}>
                    <CategoryIcon iconName={catIcon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("font-medium text-foreground truncate max-w-50 sm:max-w-none", t.status === 'paid' && "line-through opacity-70")}>{t.description}</p>
                      
                      {/* Status Badges - Only show for Future/Today to keep history clean */}
                      {(new Date(t.date) >= new Date(new Date().setHours(0,0,0,0))) && (
                          <>
                            {t.status === 'paid' ? (
                                <span className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0",
                                    t.type === 'income' ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
                                    : t.type === 'saving' ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
                                    : "text-green-600 bg-green-500/10 border-green-500/20"
                                )}>
                                    <CheckCircle className="h-3 w-3" />
                                    {t.type === 'income' ? "COBRADO" : (t.type === 'saving' ? "APORTADO" : "PAGADO")}
                                </span>
                            ) : (
                                <span className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0",
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
                    <span className="shrink-0">{format(new Date(t.date), 'MMM d, h:mm a')}</span>
                    <span>•</span>
                    <span className="truncate max-w-25 sm:max-w-37.5">{t.category}</span>
                    
                    {t.isShared === false ? (
                         <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md border border-blue-500/20 shrink-0" title="Visible solo para ti">
                            <User className="h-3 w-3" />
                            Only Me
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-md border border-purple-500/20 shrink-0" title="Compartido con el grupo">
                             <Users className="h-3 w-3" />
                             Grupal
                        </span>
                    )}

                    {/* Google Sync Indicator */}
                    {t.google_event_id && (
                        t.google_event_id === 'PENDING_SYNC' ? (
                             <span className="flex items-center gap-1.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-1 rounded-full border border-amber-500/20 shadow-sm shrink-0" title="Pendiente de sincronización (Esperando conexión)">
                                <Clock className="h-3 w-3" />
                                <span className="font-semibold opacity-90">Sync</span>
                            </span>
                        ) : (
                             <span className="flex items-center gap-1.5 text-[10px] bg-background/50 text-foreground px-2 py-1 rounded-full border border-border/50 shadow-sm shrink-0" title="Sincronizado con Google Calendar">
                                <svg className="h-3 w-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="font-semibold opacity-90">Google</span>
                            </span>
                        )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4 mt-2 sm:mt-0 ml-0 sm:ml-4 border-t sm:border-t-0 border-border/10 pt-2 sm:pt-0">
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
