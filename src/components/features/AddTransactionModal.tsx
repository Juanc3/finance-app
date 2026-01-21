"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore, Transaction } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { Plus, X, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

const CURRENCIES = ["USD", "EUR", "ARS", "GBP", "BRL"];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export function AddTransactionModal({ isOpen, onClose, transactionToEdit }: AddTransactionModalProps) {
  const { addTransaction, editTransaction, currentUser, users, categories } = useStore();
  
  // State
  const [type, setType] = useState<"income" | "expense" | "saving">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load data if editing
  React.useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || "expense");
      setAmount(transactionToEdit.amount.toString());
      setCurrency(transactionToEdit.currency || "USD");
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      setPaidBy(transactionToEdit.paidBy);
      setDate(format(new Date(transactionToEdit.date), "yyyy-MM-dd"));
    } else {
      // Reset defaults
      setType("expense");
      setAmount("");
      setDescription("");
      if (currentUser) setPaidBy(currentUser.id);
      // We generally want to preserve currency or default to USD, but reset if opening blank
      setCurrency("USD");
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
    setIsCurrencyOpen(false);
  }, [transactionToEdit, isOpen, currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update paidBy when users/currentUser loads (only if not editing)
  React.useEffect(() => {
    if (!transactionToEdit && currentUser) {
      setPaidBy(currentUser.id);
    } else if (!transactionToEdit && users.length > 0 && !paidBy) {
      setPaidBy(users[0].id);
    }
  }, [currentUser, users, transactionToEdit, paidBy]);

  // Set default category (only if not editing/set)
  React.useEffect(() => {
    if (categories.length > 0 && !category && !transactionToEdit) {
      setCategory(categories[0].name);
    }
  }, [categories, category, transactionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !paidBy || !category) return;

    if (transactionToEdit) {
      editTransaction(transactionToEdit.id, {
        amount: parseFloat(amount),
        description,
        category,
        paidBy,
        date: new Date(date + 'T12:00:00').toISOString(),
        isShared: true,
        currency,
        type,
      });
    } else {
      addTransaction({
        amount: parseFloat(amount),
        description,
        category,
        paidBy,
        date: new Date(date + 'T12:00:00').toISOString(), // Middle of day to avoid TZ shifting
        isShared: true,
        currency,
        type,
      });
    }
    
    // Reset and close
    setAmount("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-5xl flex flex-col h-dvh sm:h-auto sm:max-h-[90vh] border-x-0 border-b-0 sm:border border-white/5 bg-slate-950 shadow-2xl overflow-hidden sm:rounded-2xl ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {transactionToEdit ? "Editar Transacción" : "Nueva Transacción"}
            </h2>
            <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            >
            <X className="h-6 w-6" />
            </button>
        </div>
        
        {/* Main Content - Grid Layout */}
        <div className="flex-1 overflow-y-auto p-8">
            <form id="transaction-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
              {/* Left Column: Inputs (5/12) */}
              <div className="lg:col-span-5 space-y-8">
                
                {/* Type Switcher - Minimalist */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={cn(
                            "py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-center",
                            type === "expense" 
                                ? "bg-slate-800 text-red-400 shadow-sm" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        )}
                    >
                        Gasto
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("income")}
                        className={cn(
                            "py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-center",
                            type === "income" 
                                ? "bg-slate-800 text-emerald-400 shadow-sm" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        )}
                    >
                        Ingresos
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("saving")}
                        className={cn(
                            "py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-center",
                            type === "saving" 
                                ? "bg-slate-800 text-blue-500 shadow-sm" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        )}
                    >
                        Ahorros
                    </button>
                </div>

                {/* Amount Input - Clean & Big */}
                <div>
                     <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                        Monto
                    </label>
                    <div className="group relative flex items-baseline border-b border-white/10 focus-within:border-violet-500 transition-colors pb-2">
                         <span className="text-slate-500 font-bold text-4xl mr-2 group-focus-within:text-white transition-colors">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent border-none p-0 text-4xl sm:text-5xl font-bold tracking-tight text-white placeholder:text-slate-800 focus:outline-none focus:ring-0 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                            autoFocus
                        />
                         
                         {/* Custom Currency Dropdown Trigger */}
                         <div className="relative ml-4" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase"
                            >
                                {currency}
                                <ChevronDown className={cn("h-3 w-3 transition-transform", isCurrencyOpen && "rotate-180")} />
                            </button>

                            {/* Dropdown Menu - Anchored to Trigger */}
                            {isCurrencyOpen && (
                                <div className="absolute right-0 top-full mt-2 w-24 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                    {CURRENCIES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                setCurrency(c);
                                                setIsCurrencyOpen(false);
                                            }}
                                            className={cn(
                                                "w-full px-4 py-2.5 text-xs font-bold text-left transition-colors hover:bg-white/5",
                                                currency === c ? "text-violet-400 bg-white/5" : "text-slate-400"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                            Descripción
                        </label>
                        <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="¿Para qué es esto?"
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                                Fecha
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    style={{ colorScheme: "dark" }}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                />
                                {/* Optional: Custom Icon overlay if native picker indicator isn't enough, but CSS invert usually works */}
                            </div>
                        </div>

                        {/* Paid By (Moved to grid) -> Wait, Paid By was full width before. Let's check layout.
                           The layout was:
                           1. Description (Full)
                           2. Paid By (Full - horizontal buttons)
                           Adding date: Maybe put Date above Paid By? Or split Paid By?
                           Paid By usually needs width for names.
                           Let's put Date next to something or on its own.
                           The previous code had "space-y-8" containing Description and Paid By.
                           I can put Date between them.
                        */}
                    </div>

                    {/* Paid By */}
                    <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                            Pagado Por
                        </label>
                        <div className="flex gap-3">
                        {users.map((user) => (
                            <button
                            key={user.id}
                            type="button"
                            onClick={() => setPaidBy(user.id)}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border",
                                paidBy === user.id
                                ? "bg-slate-800 text-white border-white/10"
                                : "bg-transparent border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400"
                            )}
                            >
                                <span className={cn("h-2 w-2 rounded-full", user.color)}></span>
                                {user.name}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
              </div>

              {/* Right Column: Categories (7/12) */}
              <div className="lg:col-span-7 flex flex-col h-full min-h-100">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Categoría
                </label>
                <div className="flex-1 bg-slate-900/30 rounded-2xl border border-white/5 p-6">
                    <div className="grid grid-cols-4 gap-4 h-full content-start">
                    {categories.map((cat) => (
                        <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={cn(
                            "aspect-square flex flex-col items-center justify-center gap-3 p-2 rounded-xl transition-all duration-200 border group",
                            category === cat.name
                            ? "bg-slate-800 border-violet-500/50 text-white shadow-lg shadow-black/20"
                            : "bg-transparent border-white/5 text-slate-500 hover:bg-slate-800 hover:border-white/10 hover:text-slate-300"
                        )}
                        >
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200 opacity-80 group-hover:opacity-100">{cat.icon}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{cat.name}</span>
                        </button>
                    ))}
                    <button
                        type="button"
                        className="aspect-square flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all duration-200 border border-dashed border-white/5 text-slate-700 hover:text-slate-400 hover:border-white/10 hover:bg-slate-900/50"
                    >
                        <Plus className="h-6 w-6 opacity-50" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-50">Agregar</span>
                    </button>
                    </div>
                </div>
              </div>
            </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-slate-950 flex justify-end gap-3 transition-all">
             <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-slate-500 hover:text-white"
            >
                Cancelar
            </Button>
            <Button 
                onClick={(e) => handleSubmit(e as any)} 
                className="px-6 h-11 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20 rounded-lg hover:shadow-violet-900/40 transition-all"
            >
                {transactionToEdit ? "Guardar Cambios" : "Agregar Transacción"}
            </Button>
        </div>

      </GlassCard>
    </div>
  );
}
