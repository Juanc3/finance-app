"use client";

import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { 
  addMonths, 
  format, 
  isSameDay, 
  isSameMonth, 
  startOfMonth, 
  startOfWeek, 
  subMonths,
  isToday 
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { parseISO } from "date-fns";
import { AddTransactionModal } from "./AddTransactionModal";
import { Button } from "@/components/ui/Button";

export function CalendarView() {
  const { transactions, loading, markAsPaid } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  
  // Google Calendar Integration
  const { events: googleEvents, loading: googleLoading } = useGoogleCalendar(currentMonth);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  
  // Calendar Grid Logic - Full 6 Weeks for consistent height
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  
  const calendarDays = [];
  let day = startDate;
  for (let i = 0; i < 42; i++) {
      calendarDays.push(day);
      day = addMonths(day, 0); // Hack to copy date
      day = new Date(day.setDate(day.getDate() + 1));
  }

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Merge transactions and google events with RECURRENCE
  const getDayEvents = (date: Date) => {
    // 1. Regular Transactions on this day
    const regularTransactions = transactions.filter(t => 
        !t.isRecurring && isSameDay(new Date(t.date), date)
    );

    // 2. Recurring Transactions
    const recurringTransactions = transactions.filter(t => {
        if (!t.isRecurring) return false;
        const txDate = new Date(t.date);
        // Show if day of month matches AND it's not before the start date
        return txDate.getDate() === date.getDate() && date >= startOfMonth(txDate);
    });

    const dayTransactions = [...regularTransactions, ...recurringTransactions];

    const dayGoogleEvents = googleEvents.filter(e => {
        const eventDate = e.start.dateTime ? new Date(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
        return eventDate ? isSameDay(eventDate, date) : false;
    });

    return { transactions: dayTransactions, googleEvents: dayGoogleEvents };
  };

  if (loading || googleLoading) {
      // Skeleton match for new layout
     return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
          {/* ... keeping existing skeleton structure for now as it aligns roughly ... */}
          <GlassCard className="col-span-1 lg:col-span-2 p-4 flex flex-col h-full"> 
            {/* ... */}
            <div className="grid grid-cols-7 gap-1 h-full min-h-0">
                {Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="border border-border/20 rounded bg-background/5" />
                ))}
            </div>
         </GlassCard>
         {/* ... */}
       </div>
     );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultDate={selectedDate}
      />

      {/* Calendar Grid */}
      <GlassCard className="col-span-1 lg:col-span-2 p-4 flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-bold capitalize text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          {weekDays.map((day) => <div key={day} className="py-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1 min-h-0">
          {calendarDays.map((day, i) => {
            const { transactions: dayTransactions, googleEvents: dayGoogleEvents } = getDayEvents(day);
            const hasIncome = dayTransactions.some(t => t.type === 'income');
            const hasExpense = dayTransactions.some(t => t.type === 'expense');
            const hasSaving = dayTransactions.some(t => t.type === 'saving');
            const hasGoogleEvent = dayGoogleEvents.length > 0;

            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative p-1 rounded-lg cursor-pointer transition-all border flex flex-col items-center justify-start overflow-hidden hover:z-10",
                  !isCurrentMonth ? "opacity-30 bg-muted/10 border-transparent text-muted-foreground" : "bg-card/50 border-border/50 text-foreground",
                  isSelected 
                    ? "ring-2 ring-primary border-transparent bg-primary/10 z-10" 
                    : "hover:bg-muted/50",
                  isTodayDate && !isSelected && "ring-2 ring-blue-500/50 bg-blue-500/5"
                )}
              >
                <div className="flex justify-between w-full px-1">
                    <span className={cn(
                        "text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center", 
                        isSelected && "text-primary",
                        isTodayDate && "bg-blue-600 text-white"
                    )}>
                       {format(day, "d")}
                    </span>
                    <div className="flex gap-0.5">
                        {hasGoogleEvent && <div className="h-1.5 w-1.5 rounded-full bg-violet-500" title="Evento de Google" />}
                    </div>
                </div>

                {/* Micro indicators */}
                <div className="flex gap-1 mt-auto mb-1">
                   {hasIncome && <div className="h-1 lg:h-1.5 w-3 lg:w-4 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                   {hasExpense && <div className="h-1 lg:h-1.5 w-3 lg:w-4 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                   {hasSaving && <div className="h-1 lg:h-1.5 w-3 lg:w-4 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Detail View */}
      <GlassCard className="col-span-1 h-full min-h-0 flex flex-col overflow-hidden">
        {selectedDate ? (
          <>
            <div className="p-4 border-b border-border shrink-0 flex items-center justify-between">
              <h3 className="text-lg font-bold capitalize text-foreground">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-8 w-8 p-0 rounded-full">
                 <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {/* Transactions */}
              {getDayEvents(selectedDate).transactions.map((t) => {
                   const isIncome = t.type === 'income';
                   const isExpense = t.type === 'expense';
                   const isSaving = t.type === 'saving';
                   
                   let bgColor = "bg-slate-100 dark:bg-slate-800/50";
                   let borderColor = "border-slate-200 dark:border-slate-700/50";
                   let iconBg = "bg-slate-200 dark:bg-slate-700";
                   let iconColor = "text-slate-600 dark:text-slate-400";
                   let amountColor = "text-foreground";
                   let sign = "";

                   if (isIncome) {
                       bgColor = "bg-emerald-50 dark:bg-emerald-500/10";
                       borderColor = "border-emerald-100 dark:border-emerald-500/20";
                       iconBg = "bg-emerald-100 dark:bg-emerald-500/20";
                       iconColor = "text-emerald-600 dark:text-emerald-400";
                       amountColor = "text-emerald-700 dark:text-emerald-400";
                       sign = "+";
                   } else if (isExpense) {
                       bgColor = "bg-red-50 dark:bg-red-500/10";
                       borderColor = "border-red-100 dark:border-red-500/20";
                       iconBg = "bg-red-100 dark:bg-red-500/20";
                       iconColor = "text-red-600 dark:text-red-400";
                       amountColor = "text-red-700 dark:text-red-400";
                       sign = "-";
                   } else if (isSaving) {
                       bgColor = "bg-blue-50 dark:bg-blue-500/10";
                       borderColor = "border-blue-100 dark:border-blue-500/20";
                       iconBg = "bg-blue-100 dark:bg-blue-500/20";
                       iconColor = "text-blue-600 dark:text-blue-400";
                       amountColor = "text-blue-700 dark:text-blue-400";
                       sign = "";
                   }

                   const isPaid = t.status === 'paid';
                   const isPast = new Date(t.date) < new Date(new Date().setHours(0,0,0,0));
                   const showAsCompleted = isPaid || isPast;

                   return (
                    <div key={t.id} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] group relative", 
                        bgColor, borderColor,
                        showAsCompleted && "opacity-75"
                    )}>
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                        iconBg, iconColor
                      )}>
                         {t.category.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <p className={cn("font-bold text-sm truncate text-foreground", showAsCompleted && "line-through opacity-70")}>{t.description}</p>
                             {showAsCompleted ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                             ) : (
                                <Clock className="h-3 w-3 text-amber-500" />
                             )}
                        </div>
                        <p className="text-xs font-medium opacity-70 flex items-center gap-1">
                            {t.isRecurring && <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">Repetir</span>}
                            <span>{t.category}</span>
                            {showAsCompleted && <span className="text-[10px] text-green-600 font-bold ml-1">
                                {isIncome ? "COBRADO" : (isSaving ? "APORTADO" : "PAGADO")}
                            </span>}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                            <div className={cn("font-bold text-base whitespace-nowrap", amountColor, showAsCompleted && "opacity-70")}>
                                {sign}${t.amount}
                            </div>
                            
                             {/* Floating Action for Pending - Only for Today or Future */}
                            {!isPaid && (new Date(t.date) >= new Date(new Date().setHours(0,0,0,0))) && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmPayId(t.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-background/80 hover:bg-background rounded-full shadow-sm border border-border text-green-600"
                                    title={isIncome ? "Marcar Cobrado" : (isSaving ? "Confirmar Ahorro" : "Marcar Pagado")}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </button>
                            )}
                      </div>
                    </div>
                   );
              })}

              {/* Google Events */}
              {getDayEvents(selectedDate).googleEvents.map((e) => (
                   <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 hover:scale-[1.01] transition-all">
                     <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
                        G
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-sm truncate text-foreground">{e.summary}</p>
                       <p className="text-xs font-medium opacity-70">
                           {e.start.dateTime ? format(new Date(e.start.dateTime), 'h:mm a') : 'Todo el día'}
                       </p>
                     </div>
                   </div>
              ))}

              {getDayEvents(selectedDate).transactions.length === 0 && getDayEvents(selectedDate).googleEvents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center py-10 opacity-50">
                   <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                        <span className="text-2xl">📅</span>
                   </div>
                  <p className="font-medium">Sin movimientos</p>
                  <p className="text-xs">Toca el + para agregar uno</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
            Selecciona un día para ver los detalles
          </div>
        )}
      </GlassCard>

      <ConfirmModal 
        isOpen={!!confirmPayId}
        onClose={() => setConfirmPayId(null)}
        onConfirm={() => {
            if (confirmPayId) {
                markAsPaid(confirmPayId);
                setConfirmPayId(null);
            }
        }}
        title={(() => {
            const t = transactions.find(tx => tx.id === confirmPayId);
            if (!t) return "¿Confirmar?";
            return t.type === 'income' ? "¿Confirmar cobro?" : (t.type === 'saving' ? "¿Confirmar ahorro?" : "¿Confirmar pago?");
        })()}
        description={(() => {
            const t = transactions.find(tx => tx.id === confirmPayId);
            if (!t) return "";
            return t.type === 'income' 
                ? "Esta acción marcará el ingreso como recibido."
                : (t.type === 'saving' 
                    ? "Esta acción marcará el ahorro como depositado."
                    : "Esta acción marcará la transacción como pagada.");
        })()}
        confirmText="Confirmar"
        variant="info" 
      />
    </div>
  );
}
