"use client";

import { CalendarView } from "@/components/features/CalendarView";


  
export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden pb-4">
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Calendario Financiero
        </h1>
        <p className="text-muted-foreground">
          Visualiza tus gastos, ingresos y pagos recurrentes.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <CalendarView />
      </div>
    </div>
  );
}
