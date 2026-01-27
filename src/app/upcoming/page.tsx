"use client";

import { useStore } from "@/context/StoreContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2, AlertCircle, CalendarClock } from "lucide-react";

export default function UpcomingPage() {
  const { transactions, loading } = useStore();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando movimientos...</div>;
  }

  const now = startOfDay(new Date());

  // Filter future transactions (or today/tomorrow)
  // Logic: "Upcoming" usually implies things that haven't happened yet OR are due very soon.
  // Let's include everything from Today onwards.
  const upcomingTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      // Include today and future
      return tDate >= now;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Grouping
  const urgent = upcomingTransactions.filter(t => isToday(new Date(t.date)) || isTomorrow(new Date(t.date)));
  const future = upcomingTransactions.filter(t => !isToday(new Date(t.date)) && !isTomorrow(new Date(t.date)));

  return (
    <div className="flex flex-col h-full overflow-hidden gap-6 animate-in fade-in duration-500">
      <div className="shrink-0">
         <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Próximos Movimientos
         </h1>
         <p className="text-muted-foreground">Gestiona tus pagos y ahorros pendientes.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
         
         {/* Urgent Section */}
         {urgent.length > 0 && (
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-500">
                    <AlertCircle className="h-5 w-5" />
                    Para Hoy y Mañana
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {urgent.map(t => (
                        <TransactionCard key={t.id} t={t} urgent />
                    ))}
                </div>
            </div>
         )}

         {/* Future Section */}
         <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-500">
                <CalendarClock className="h-5 w-5" />
                Más adelante
            </h2>
            {future.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <p>No tienes movimientos futuros programados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {future.map(t => (
                        <TransactionCard key={t.id} t={t} />
                    ))}
                </div>
            )}
         </div>

      </div>
    </div>
  );
}

function TransactionCard({ t, urgent }: { t: any, urgent?: boolean }) {
    const { markAsPaid } = useStore(); // Access store
    const isIncome = t.type === 'income';
    const isExpense = t.type === 'expense';
    const isSaving = t.type === 'saving';
    const isPaid = t.status === 'paid';

    let borderColor = "border-l-4 border-l-slate-400";
    let iconColor = "text-slate-500";
    
    if (isPaid) {
        borderColor = "border-l-4 border-l-green-500 opacity-60"; // Dim if paid
        iconColor = "text-green-500";
    } else if (isIncome) {
        borderColor = "border-l-4 border-l-emerald-500";
        iconColor = "text-emerald-500";
    } else if (isExpense) {
        borderColor = "border-l-4 border-l-red-500";
        iconColor = "text-red-500";
    } else if (isSaving) {
        borderColor = "border-l-4 border-l-blue-500";
        iconColor = "text-blue-500";
    }

    return (
        <GlassCard className={cn(
            "p-4 flex flex-col gap-3 transition-all hover:scale-[1.02]",
            borderColor,
            urgent && !isPaid && "ring-1 ring-orange-500/50 bg-orange-500/5"
        )}>
            <div className="flex justify-between items-start">
                <div>
                    <span className={cn("text-xs font-medium uppercase tracking-wider flex items-center gap-1", isPaid ? "text-green-600 font-bold" : "text-muted-foreground")}>
                        {isPaid ? (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5" /> 
                                {isIncome ? "COBRADO" : (isSaving ? "APORTADO" : "PAGADO")}
                            </>
                        ) : format(new Date(t.date), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    <h3 className={cn("font-bold text-lg text-foreground mt-1 truncate", isPaid && "line-through text-muted-foreground")}>
                        {t.description}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full bg-muted font-medium", iconColor)}>
                            {t.category}
                        </span>
                        {t.isRecurring && (
                            <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
                                Recurrente
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn("text-xl font-bold", iconColor, isPaid && "opacity-50")}>
                        {isExpense ? '-' : '+'}${t.amount}
                    </p>
                </div>
            </div>
            
             {/* Actions */}
             <div className="mt-auto pt-2 border-t border-border/50 flex justify-between items-center">
                <span className="text-xs text-muted-foreground italic">
                    {isPaid ? "Realizado" : (urgent ? "¡Vence pronto!" : "Programado")}
                </span>
                
                {!isPaid && (
                    <button 
                        onClick={() => markAsPaid(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg text-xs font-bold transition-colors"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isIncome ? "Marcar Cobrado" : (isSaving ? "Confirmar Ahorro" : "Marcar Pagado")}
                    </button>
                )}
             </div>
        </GlassCard>
    )
}
