"use client";

import { AddTransactionModal } from "@/components/features/AddTransactionModal";
import { TransactionList } from "@/components/features/TransactionList";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import React, { useState } from "react";

import { Transaction } from "@/context/StoreContext";

export default function TransactionsPage() {
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400">Manage and view all shared expenses</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <TransactionList className="h-full" onEdit={handleEdit} />
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleClose}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}
