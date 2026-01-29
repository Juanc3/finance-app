'use client';

import { AddTransactionModal } from '@/components/features/AddTransactionModal';
import { TransactionList } from '@/components/features/TransactionList';
import { Button } from '@/components/ui/Button';
import { Plus, Receipt, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';

import { Transaction } from '@/context/StoreContext';

export default function TransactionsPage() {
  const { transactions, loading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-6 p-4 animate-in fade-in">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-muted/20 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted/20 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)] pb-24 animate-in fade-in duration-500">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Transacciones
            </h1>
            <p className="text-muted-foreground">Administra y revisa todos los gastos compartidos</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative h-40 w-40 bg-muted/10 rounded-full flex items-center justify-center border border-border/50 shadow-2xl backdrop-blur-sm">
              <Receipt className="h-20 w-20 text-muted-foreground/50" />
            </div>

            <div className="absolute -top-4 -right-4 p-3 bg-background/80 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 animate-bounce delay-700">
              <Plus className="h-6 w-6 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3 max-w-md">Tu historial está vacío</h2>
          <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
            Aquí aparecerán todas tus transacciones. Agrega la primera para empezar a llevar el control.
          </p>

          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105"
          >
            Nueva Transacción <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <AddTransactionModal isOpen={isModalOpen} onClose={handleClose} transactionToEdit={transactionToEdit} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transacciones</h1>
          <p className="text-muted-foreground">Administra y revisa todos los gastos compartidos</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Nueva Transacción
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <TransactionList className="h-full" onEdit={handleEdit} />
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={handleClose} transactionToEdit={transactionToEdit} />
    </div>
  );
}
