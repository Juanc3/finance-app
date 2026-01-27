"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore, Transaction } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { Plus, X, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

const CURRENCIES = ["ARS", "USD", "EUR", "GBP", "BRL"];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  defaultDate?: Date | null;
}

export function AddTransactionModal({ isOpen, onClose, transactionToEdit, defaultDate }: AddTransactionModalProps) {
  const { addTransaction, editTransaction, currentUser, users, categories } = useStore();
  
  // State
  const [type, setType] = useState<"income" | "expense" | "saving">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isRecurring, setIsRecurring] = useState(false);
  const [isShared, setIsShared] = useState(true); // Default to shared
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load data if editing
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || "expense");
      setAmount(transactionToEdit.amount.toString());
      setCurrency(transactionToEdit.currency || "ARS");
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      setPaidBy(transactionToEdit.paidBy);
      setDate(format(new Date(transactionToEdit.date), "yyyy-MM-dd"));
      setIsRecurring(transactionToEdit.isRecurring || false);
      setIsShared(transactionToEdit.isShared ?? true);
    } else {
      // Reset defaults
      setType("expense");
      setAmount("");
      setDescription("");
      setIsRecurring(false);
      setIsShared(true);
      if (currentUser) setPaidBy(currentUser.id);
      // We generally want to preserve currency or default to USD, but reset if opening blank
      setCurrency("ARS");
      setDate(defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    }
    setIsCurrencyOpen(false);
  }, [transactionToEdit, isOpen, currentUser, defaultDate]);

  // Handle click outside for currency dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };

    if (isCurrencyOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCurrencyOpen]);

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
        isShared,
        isRecurring,
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
        isShared,
        isRecurring,
        currency,
        type,
        syncToGoogle, // Custom flag to be handled by context
      });
    }
    
    // Reset and close
    setAmount("");
    setDescription("");
    setIsRecurring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-5xl flex flex-col h-dvh sm:h-auto sm:max-h-[90vh] border-x-0 border-b-0 sm:border border-border bg-card shadow-2xl overflow-hidden sm:rounded-2xl ring-1 ring-border">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {transactionToEdit ? "Editar Transacción" : "Nueva Transacción"}
            </h2>
            <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
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
                <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={cn(
                            "py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-center",
                            type === "expense" 
                                ? "bg-card text-red-500 shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
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
                                ? "bg-card text-emerald-500 shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
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
                                ? "bg-card text-blue-500 shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Ahorros
                    </button>
                </div>

                {/* Amount Input - Clean & Big */}
                <div>
                     <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Monto
                    </label>
                    <div className="group relative flex items-baseline border-b border-border focus-within:border-primary transition-colors pb-2">
                         <span className="text-muted-foreground font-bold text-4xl mr-2 group-focus-within:text-foreground transition-colors">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent border-none p-0 text-4xl sm:text-5xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                            autoFocus
                        />
                         
                         {/* Custom Currency Dropdown Trigger */}
                         <div className="relative ml-4" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase"
                            >
                                {currency}
                                <ChevronDown className={cn("h-3 w-3 transition-transform", isCurrencyOpen && "rotate-180")} />
                            </button>

                            {/* Dropdown Menu - Anchored to Trigger */}
                            {isCurrencyOpen && (
                                <div className="absolute right-0 top-full mt-2 w-24 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                    {CURRENCIES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                setCurrency(c);
                                                setIsCurrencyOpen(false);
                                            }}
                                            className={cn(
                                                "w-full px-4 py-2.5 text-xs font-bold text-left transition-colors hover:bg-muted",
                                                currency === c ? "text-primary bg-muted" : "text-muted-foreground"
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

                    {/* Visibility Section */}
                    <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                            Visibilidad
                        </label>
                        <div className="flex bg-muted/50 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setIsShared(true)}
                                className={cn(
                                    "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
                                    isShared ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                👥 Compartido
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsShared(false)}
                                className={cn(
                                    "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
                                    !isShared ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                👤 Individual
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                            Descripción
                        </label>
                        <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="¿Para qué es esto?"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                Fecha
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    style={{ colorScheme: "var(--color-scheme, dark)" }} // Dynamic handling or explicit
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                        </div>
                        
                        {/* Recurring Switch */}
                        <div className="flex items-center gap-3 pt-6 sm:pt-0">
                            <button
                                type="button"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={cn(
                                    "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                    isRecurring ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                        isRecurring ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                           <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                                Repetir todos los meses
                            </label>
                        </div>

                         {/* Google Sync Switch */}
                         <div className="flex items-center gap-3 pt-2 sm:pt-0">
                            <button
                                type="button"
                                onClick={() => setSyncToGoogle(!syncToGoogle)}
                                className={cn(
                                    "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                    syncToGoogle ? "bg-blue-600" : "bg-muted"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                        syncToGoogle ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                           <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setSyncToGoogle(!syncToGoogle)}>
                                Sincronizar con Google Calendar
                            </label>
                        </div>
                    </div>

                    {/* Paid By */}
                    <div>
                         <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
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
                                ? "bg-muted text-foreground border-border" // Review this: might need better active state
                                : "bg-transparent border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                            )}
                            style={paidBy === user.id ? { backgroundColor: 'var(--muted)', borderColor: 'var(--border)' } : {}}
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
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Categoría
                </label>
                <div className="flex-1 bg-muted/50 rounded-2xl border border-border p-6">
                    <div className="grid grid-cols-4 gap-4 h-full content-start">
                    {categories.map((cat) => (
                        <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={cn(
                            "aspect-square flex flex-col items-center justify-center gap-3 p-2 rounded-xl transition-all duration-200 border group",
                            category === cat.name
                            ? "bg-card border-primary/50 text-foreground shadow-lg shadow-black/5"
                            : "bg-transparent border-border text-muted-foreground hover:bg-card hover:border-border hover:text-foreground"
                        )}
                        >
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200 opacity-80 group-hover:opacity-100">
                            <CategoryIcon iconName={cat.icon} className="h-6 w-6" />
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{cat.name}</span>
                        </button>
                    ))}
                    <button
                        type="button"
                        className="aspect-square flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all duration-200 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/50"
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
        <div className="p-6 border-t border-border bg-card flex justify-end gap-3 transition-all">
             <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
            >
                Cancelar
            </Button>
            <Button 
                onClick={(e) => handleSubmit(e as any)} 
                className="px-6 h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-lg hover:shadow-primary/40 transition-all"
            >
                {transactionToEdit ? "Guardar Cambios" : "Agregar Transacción"}
            </Button>
        </div>

      </GlassCard>
    </div>
  );
}
