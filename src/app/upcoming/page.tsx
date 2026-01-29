'use client';

import { useStore } from '@/context/StoreContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Bell, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';

import { AddTransactionModal } from '@/components/features/AddTransactionModal';
import { Button } from '@/components/ui/Button';
import { Plus, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';

export default function UpcomingPage() {
  const { transactions, loading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-muted/20 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const now = startOfDay(new Date());

  // Filter future transactions (or today/tomorrow)
  // Logic: "Upcoming" usually implies things that haven't happened yet OR are due very soon.
  // Let's include everything from Today onwards.
  const upcomingTransactions = transactions
    .filter((t) => {
      const tDate = new Date(t.date);
      // Include today and future
      return tDate >= now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Empty State
  if (upcomingTransactions.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
        <div className="shrink-0 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Próximos Movimientos
          </h1>
          <p className="text-muted-foreground">Gestiona tus pagos y ahorros pendientes.</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center -mt-10">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative h-40 w-40 bg-muted/10 rounded-full flex items-center justify-center border border-border/50 shadow-2xl backdrop-blur-sm">
              <CalendarClock className="h-20 w-20 text-muted-foreground/50" />
            </div>

            <div className="absolute -top-4 -right-4 p-3 bg-background/80 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 animate-bounce delay-700">
              <Bell className="h-6 w-6 text-blue-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3 max-w-md">Todo al día</h2>
          <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
            No tienes pagos ni movimientos pendientes para los próximos días. ¡Relájate!
          </p>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="rounded-xl px-8 h-12 text-base font-bold transition-all hover:bg-muted"
          >
            Programar Pago <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  // Grouping
  const urgent = upcomingTransactions.filter((t) => isToday(new Date(t.date)) || isTomorrow(new Date(t.date)));
  const future = upcomingTransactions.filter((t) => !isToday(new Date(t.date)) && !isTomorrow(new Date(t.date)));

  return (
    <div className="flex flex-col h-full overflow-hidden gap-6 animate-in fade-in duration-500">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Próximos Movimientos
          </h1>
          <p className="text-muted-foreground">Gestiona tus pagos y ahorros pendientes.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          size="sm"
          className="hidden sm:flex rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
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
              {urgent.map((t) => (
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
              {future.map((t) => (
                <TransactionCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function TransactionCard({ t, urgent }: { t: any; urgent?: boolean }) {
  const { markAsPaid } = useStore(); // Access store
  const isIncome = t.type === 'income';
  const isExpense = t.type === 'expense';
  const isSaving = t.type === 'saving';
  const isPaid = t.status === 'paid';

  let borderColor = 'border-l-4 border-l-slate-400';
  let iconColor = 'text-slate-500';

  if (isPaid) {
    borderColor = 'border-l-4 border-l-green-500 opacity-60'; // Dim if paid
    iconColor = 'text-green-500';
  } else if (isIncome) {
    borderColor = 'border-l-4 border-l-emerald-500';
    iconColor = 'text-emerald-500';
  } else if (isExpense) {
    borderColor = 'border-l-4 border-l-red-500';
    iconColor = 'text-red-500';
  } else if (isSaving) {
    borderColor = 'border-l-4 border-l-blue-500';
    iconColor = 'text-blue-500';
  }

  return (
    <GlassCard
      className={cn(
        'p-4 flex flex-col gap-3 transition-all hover:scale-[1.02]',
        borderColor,
        urgent && !isPaid && 'ring-1 ring-orange-500/50 bg-orange-500/5',
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-wider flex items-center gap-1',
              isPaid ? 'text-green-600 font-bold' : 'text-muted-foreground',
            )}
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isIncome ? 'COBRADO' : isSaving ? 'APORTADO' : 'PAGADO'}
              </>
            ) : (
              format(new Date(t.date), "EEEE d 'de' MMMM", { locale: es })
            )}
          </span>
          <h3
            className={cn(
              'font-bold text-lg text-foreground mt-1 truncate',
              isPaid && 'line-through text-muted-foreground',
            )}
          >
            {t.description}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xs px-2 py-0.5 rounded-full bg-muted font-medium', iconColor)}>{t.category}</span>
            {t.isRecurring && (
              <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">Recurrente</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-xl font-bold', iconColor, isPaid && 'opacity-50')}>
            {isExpense ? '-' : '+'}${t.amount}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-2 border-t border-border/50 flex justify-between items-center">
        <span className="text-xs text-muted-foreground italic">
          {isPaid ? 'Realizado' : urgent ? '¡Vence pronto!' : 'Programado'}
        </span>

        {!isPaid && (
          <button
            onClick={() => markAsPaid(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg text-xs font-bold transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isIncome ? 'Marcar Cobrado' : isSaving ? 'Confirmar Ahorro' : 'Marcar Pagado'}
          </button>
        )}
      </div>
    </GlassCard>
  );
}
