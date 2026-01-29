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
  isToday,
  parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { AddTransactionModal } from "./AddTransactionModal";
import { Button } from "@/components/ui/Button";

export function CalendarView() {
  const { transactions, loading, markAsPaid, addTransaction, editTransaction } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  
  // Google Calendar Integration
  const { events: googleEvents, loading: googleLoading } = useGoogleCalendar(currentMonth);

  // Auto-Link Logic for Migrating Legacy Events
  useEffect(() => {
    if (loading || googleLoading || googleEvents.length === 0 || transactions.length === 0) return;

    const linkEvents = () => {
        googleEvents.forEach(gEvent => {
             const gDate = gEvent.start.dateTime ? new Date(gEvent.start.dateTime) : (gEvent.start.date ? parseISO(gEvent.start.date) : null);
             if (!gDate) return;

             // Find local match on same day
             const match = transactions.find(t => {
                 if (t.google_event_id === gEvent.id) return false; // Already linked
                 if (t.google_event_id) return false; // Already linked to something else (unlikely but safe)

                 const tDate = new Date(t.date);
                 if (!isSameDay(tDate, gDate)) return false;

                 // Title Match
                 const tDesc = t.description.toLowerCase().trim();
                 const gSummary = gEvent.summary.toLowerCase().trim();
                 return tDesc === gSummary || tDesc.includes(gSummary) || gSummary.includes(tDesc);
             });

             if (match) {
                 // Found a match! silently update the DB to link them.
                 // passing google_event_id will trigger the DB update via StoreContext
                 editTransaction(match.id, { google_event_id: gEvent.id } as any); 
             }
        });
    };
    
    // We wrap in a small timeout to avoid blocking mount
    const timer = setTimeout(linkEvents, 1000);
    return () => clearTimeout(timer);

  }, [googleEvents, transactions, loading, googleLoading, editTransaction]);

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
    // 1. Regular Transactions on this day (The "Real" ones)
    const regularTransactions = transactions.filter(t => 
        !t.isRecurring && isSameDay(new Date(t.date), date)
    );

    // 2. Recurring Transactions (The "Virtual" projections)
    const recurringTransactions = transactions.filter(t => {
        if (!t.isRecurring) return false;
        const txDate = new Date(t.date);
        
        // Basic Check: Same day of month?
        // handle months with fewer days? (Simple version: exact match)
        const isDayMatch = txDate.getDate() === date.getDate();
        const isAfterStart = date >= startOfMonth(txDate);
        
        if (isDayMatch && isAfterStart) {
             // DEDUPLICATION:
             // Check if we already have a "Real" transaction on this day that matches this recurring one.
             // Matching criteria: Description + Amount + Category + Type
             const hasRealization = regularTransactions.some(realTx => 
                 realTx.description === t.description &&
                 realTx.amount === t.amount &&
                 realTx.category === t.category &&
                 realTx.type === t.type
             );
             
             // If a real one exists, DON'T show the virtual recurring one.
             return !hasRealization;
        }
        return false;
    }).map(t => {
        // Transform into a Virtual Instance
        // If it's the EXACT same date as the original, use the original status.
        // If it's a future/past projection, force it to 'pending'
        const isOriginalDate = isSameDay(new Date(t.date), date);
        return {
            ...t,
            id: `virtual-${t.id}-${date.toISOString()}`, // Virtual ID
            originalId: t.id, // Keep ref to original
            date: date.toISOString(), // Project to this date
            status: isOriginalDate ? t.status : 'pending', // Force pending for projections
            isVirtual: true
        };
    });

    const dayTransactions = [...regularTransactions, ...recurringTransactions];

    const dayGoogleEvents = googleEvents.filter(e => {
        const eventDate = e.start.dateTime ? new Date(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
        return eventDate ? isSameDay(eventDate, date) : false;
    });

    // 3. Deduplicate Google Events
    // Logic: If we have a transaction with similar name on the same day, hide the Google Event and mark transaction as "synced"
    const uniqueGoogleEvents: any[] = [];
    const mergedTransactions = dayTransactions.map(t => ({ 
        ...t, 
        isSyncedWithGoogle: !!t.google_event_id // PENDING_SYNC (string) or Real ID (string) are both truthy
    }));

    dayGoogleEvents.forEach(gEvent => {
        // 1. Check for Explicit ID Match
        // NOTE: For recurring events, Google returns instance IDs like "eventId_20250201T..."
        // Our DB stores the "Series Master ID". So we must check if gEvent.id STARTS with our stored ID.
        const idMatchIndex = mergedTransactions.findIndex(t => {
            if (!t.google_event_id || t.google_event_id === 'PENDING_SYNC') return false;
            
            // Exact match (Standard)
            if (t.google_event_id === gEvent.id) return true;

            // Recurring Instance Match
            // Only if local transaction is recurring, allow prefix match
            if (t.isRecurring && gEvent.id && gEvent.id.startsWith(t.google_event_id + '_')) return true;

            return false;
        });
        
        if (idMatchIndex !== -1) {
            // Found explicit match! 
             mergedTransactions[idMatchIndex].isSyncedWithGoogle = true;
             // If we found a match by ID, we certainly want to hide the Google duplicate.
            return; 
        }

        // 2. Find a matching transaction by Description (Heuristic)
        // Only if transaction is NOT already synced to something else
        const matchIndex = mergedTransactions.findIndex(t => {
            if (t.google_event_id && t.google_event_id !== 'PENDING_SYNC') return false; // Already linked to a real ID (and it wasn't the one above)

            // Normalize strings for comparison
            const tDesc = t.description.toLowerCase().trim();
            const gSummary = gEvent.summary.toLowerCase().trim();
            // Check for containment or exact match
            return (tDesc === gSummary || tDesc.includes(gSummary) || gSummary.includes(tDesc));
        });

        if (matchIndex !== -1) {
            // Match found! Mark transaction as synced
            mergedTransactions[matchIndex].isSyncedWithGoogle = true;
            // Don't add this google event to unique list (it's merged)
        } else {
            // No match, keep it as a standalone google event
            uniqueGoogleEvents.push(gEvent);
        }
    });

    return { transactions: mergedTransactions, googleEvents: uniqueGoogleEvents };
  };

  if (loading || googleLoading) {
      // Skeleton match for new layout
     return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
          <GlassCard className="col-span-1 lg:col-span-2 p-4 flex flex-col h-full"> 
            <div className="grid grid-cols-7 gap-1 h-full min-h-0">
                {Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="border border-border/20 rounded bg-background/5" />
                ))}
            </div>
         </GlassCard>
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
            // Also check for synced events to show indicator maybe? Not explicitly requested for grid dots, but good to know

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

                   // Use the status from the transaction object (which might be the virtual status)
                   const isPaid = t.status === 'paid';
                   // Only show as completed if explicitly paid. Don't auto-complete past items anymore for recurring accuracy.
                   const showAsCompleted = isPaid; // Changed logic: Strict check on status.

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
                            {/* GOOGLE SYNC INDICATOR */}
                            {t.isSyncedWithGoogle && ( // Note: CalendarView logic sets 'isSyncedWithGoogle' if t.google_event_id is present or matched.
                                (t.google_event_id === 'PENDING_SYNC') ? (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-0.5" title="Sincronización Pendiente">
                                        <Clock className="h-2.5 w-2.5" />
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-background/50 text-foreground px-1.5 py-0.5 rounded-full border border-border/50 shadow-sm flex items-center gap-1" title="Sincronizado con Google Calendar">
                                        <svg className="h-3 w-3" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </span>
                                )
                            )}
                            {showAsCompleted && <span className="text-[10px] text-green-600 font-bold ml-1">
                                {isIncome ? "COBRADO" : (isSaving ? "APORTADO" : "PAGADO")}
                            </span>}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                            <div className={cn("font-bold text-base whitespace-nowrap", amountColor, showAsCompleted && "opacity-70")}>
                                {sign}${t.amount}
                            </div>
                            
                             {/* Floating Action for Pending */}
                            {!isPaid && (
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
                     <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-background shadow-sm border border-border/50">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
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
                // Check if it's a virtual ID
                if (confirmPayId.startsWith('virtual-')) {
                    // It's a Recurring Projection!
                    // We need to CREATE a new transaction for this specific date
                    // Format: virtual-originalId-dateISO
                    // Warning: IDs might have dashes. 
                    // Better approach: Look it up in the daily events for selectedDate?
                    // Or just use logic: 
                    // We can find the virtual object in the current view?
                    // The easiest: Parse the date from the ID?
                    // Let's rely on finding it in the current `transactions` + recurrence projection
                    // But `transactions` only has real ones.
                    // We need to look it up using `getDayEvents(selectedDate)`? 
                    // But confirmPayId might be from a different day if we allowed selecting across days (we don't, only selectedDate shown).
                    
                    if (selectedDate) {
                        const { transactions: dailyTxs } = getDayEvents(selectedDate);
                        const virtualTx = dailyTxs.find(t => t.id === confirmPayId);
                        
                        if (virtualTx) {
                            // Create REAL transaction
                            addTransaction({
                                amount: virtualTx.amount,
                                description: virtualTx.description,
                                category: virtualTx.category,
                                date: virtualTx.date, // This is the projected date
                                paidBy: virtualTx.paidBy,
                                isShared: virtualTx.isShared,
                                isRecurring: false, // Concrete instance is NOT recurring
                                currency: virtualTx.currency,
                                type: virtualTx.type,
                                // status: 'paid' // addTransaction doesn't take status, default pending.
                                // Wait, addTransaction usage in code:
                                // addTransaction(inputs) -> optimistic adds it. 
                                // We might need to mark it as paid immediately or modify addTransaction to accept status.
                                // Or call add, then markAsPaid?
                                // Better: Update addTransaction to accept status or just edit it after.
                                // Let's try add then markAsPaid if we have the ID to retreive... 
                                // Actually, addTransaction is async but doesn't return the ID easily in the context signature above (it's void).
                                // But `addTransaction` puts it in the state.
                                // Let's assume we can pass `status` to addTransaction? 
                                // Checking StoreContext... it takes `Omit<Transaction, "id">`. Transaction type HAS `status`.
                                // So yes, we can pass status: 'paid'.
                                status: 'paid'
                            });
                        }
                    }
                } else {
                    // Regular transaction
                    markAsPaid(confirmPayId);
                }
                setConfirmPayId(null);
            }
        }}
        title="¿Confirmar transacción?"
        description="Esta acción marcará la transacción como completada para este día."
        confirmText="Confirmar"
        variant="info" 
      />
    </div>
  );
}
