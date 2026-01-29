'use client';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useStore, Transaction } from '@/context/StoreContext';
import { cn } from '@/lib/utils';
import { Plus, X, ChevronDown, Calendar, Repeat, RefreshCw, User, Check } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CURRENCIES = ['ARS', 'USD', 'EUR', 'GBP', 'BRL'];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  defaultDate?: Date | null;
}

export function AddTransactionModal({ isOpen, onClose, transactionToEdit, defaultDate }: AddTransactionModalProps) {
  const { addTransaction, editTransaction, currentUser, users, categories } = useStore();

  // State
  const [type, setType] = useState<'income' | 'expense' | 'saving'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isRecurring, setIsRecurring] = useState(false);
  const [isShared, setIsShared] = useState(true);
  const [syncToGoogle, setSyncToGoogle] = useState(false);

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // Referencias
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null); // <--- NUEVA REFERENCIA

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(transactionToEdit.amount.toString());
      setCurrency(transactionToEdit.currency || 'ARS');
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      setPaidBy(transactionToEdit.paidBy);
      setDate(format(new Date(transactionToEdit.date), "yyyy-MM-dd'T'HH:mm"));
      setIsRecurring(transactionToEdit.isRecurring || false);
      setIsShared(transactionToEdit.isShared ?? true);
      setSyncToGoogle(!!transactionToEdit.google_event_id);
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory('');
      setIsRecurring(false);
      setIsShared(true);
      setSyncToGoogle(false);
      if (currentUser) setPaidBy(currentUser.id);
      setCurrency('ARS');
      setDate(defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
    setIsCurrencyOpen(false);
  }, [transactionToEdit, isOpen, currentUser, defaultDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    if (isCurrencyOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCurrencyOpen]);

  const handleUserCycle = () => {
    if (!users.length) return;
    const currentIndex = users.findIndex((u) => u.id === paidBy);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % users.length;
    setPaidBy(users[nextIndex].id);
  };

  const selectedPayer = users.find((u) => u.id === paidBy) || currentUser || users[0];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !paidBy || !category) return;

    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return; // Prevent invalid dates

    const payload = {
      amount: parseFloat(amount),
      description,
      category,
      paidBy,
      date: dateObj.toISOString(),
      isShared,
      isRecurring,
      currency,
      type,
      syncToGoogle,
    };

    if (transactionToEdit) {
      editTransaction(transactionToEdit.id, payload);
    } else {
      addTransaction(payload);
    }
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    onClose();
  };

  const theme = {
    expense: {
      color: 'text-red-500',
      bg: 'bg-red-500',
      bgSoft: 'bg-red-500/10',
      border: 'border-red-500/20',
      gradient: 'from-red-500/20 to-transparent',
    },
    income: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500',
      bgSoft: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      gradient: 'from-emerald-500/20 to-transparent',
    },
    saving: {
      color: 'text-blue-500',
      bg: 'bg-blue-500',
      bgSoft: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      gradient: 'from-blue-500/20 to-transparent',
    },
  };

  const activeTheme = theme[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose} // Close on backdrop click
    >
      <GlassCard
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
        className={cn(
          'w-full max-w-6xl flex flex-col max-h-[90vh] border bg-card shadow-2xl overflow-hidden rounded-3xl ring-1 transition-all duration-500',
          activeTheme.border,
        )}
      >
        {/* --- HEADER --- */}
        <div className="relative p-5 shrink-0 z-10 flex items-center justify-between border-b border-border/40">
          <div
            className={cn(
              'absolute inset-0 bg-linear-to-b opacity-40 transition-all duration-500 pointer-events-none rounded-2xl',
              activeTheme.gradient,
            )}
          />

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold tracking-tight hidden sm:block">
              {transactionToEdit ? 'Editar' : 'Nueva'} Transacción
            </h2>
          </div>

          <div className="relative z-10 flex bg-muted/50 p-1 rounded-full border border-border/50">
            {(['expense', 'income', 'saving'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'relative px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 z-10',
                  type === t ? 'text-white shadow-md' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {type === t && (
                  <span
                    className={cn('absolute inset-0 rounded-full -z-10 transition-all duration-300', theme[t].bg)}
                  />
                )}
                {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Ahorro'}
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN CONTENT (Balanced Grid) --- */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT COLUMN: Expanded to 50% width */}
          <div className="lg:w-1/2 flex flex-col p-6 lg:p-8 gap-8 overflow-y-auto custom-scrollbar border-r border-border/30">
            {/* 1. AMOUNT INPUT SECTION (Horizontal Layout) */}
            <div className="relative flex flex-col items-center justify-center py-8 shrink-0 group">
              <div className="absolute inset-0 rounded-3xl overflow-hidden bg-muted/10 border border-border/50">
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-linear-to-tr',
                    activeTheme.gradient,
                  )}
                />
              </div>

              <div className="relative z-10 flex items-center justify-center w-full gap-4 px-4">
                {/* A. Currency Selector (Left side) */}
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-background/50 hover:bg-background border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-wide"
                  >
                    {currency}{' '}
                    <ChevronDown className={cn('h-3 w-3 transition-transform', isCurrencyOpen && 'rotate-180')} />
                  </button>

                  {isCurrencyOpen && (
                    <div className="absolute left-0 top-full mt-2 w-24 bg-popover border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/10">
                      <div className="py-1">
                        {CURRENCIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCurrency(c);
                              setIsCurrencyOpen(false);
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-xs font-bold text-left hover:bg-muted/50 transition-colors',
                              currency === c && activeTheme.color,
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* B. Symbol & Input */}
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={cn(
                      'text-4xl sm:text-5xl font-light text-muted-foreground transition-colors pb-1',
                      activeTheme.color,
                    )}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent border-none p-0 text-5xl sm:text-6xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-0 w-full min-w-15 max-w-75 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* 2. DESCRIPTION */}
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿En qué gastaste?"
              className="w-full bg-transparent border-b border-border/30 py-3 text-xl text-center text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-all shrink-0"
            />

            {/* 3. SETTINGS GRID (Matches wider column) */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              {/* Date Picker MODIFICADO */}
              <div
                className="relative col-span-2 bg-muted/20 rounded-2xl p-4 flex items-center justify-between hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30 group cursor-pointer"
                onClick={() => {
                  // Forzar la apertura del calendario al hacer click en el contenedor
                  if (dateInputRef.current) {
                    try {
                      dateInputRef.current.showPicker();
                    } catch (e) {
                      dateInputRef.current.focus();
                      console.log(e); // Fallback
                    }
                  }
                }}
              >
                {/* Visual */}
                <div className="flex items-center gap-4 pointer-events-none">
                  <div className="p-2.5 bg-background rounded-xl text-muted-foreground group-hover:text-foreground transition-colors shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Fecha</span>
                    <span className="text-sm font-semibold">
                      {date && !isNaN(new Date(date).getTime())
                        ? format(new Date(date), 'd MMM yyyy, HH:mm', { locale: es })
                        : 'Seleccionar fecha'}
                    </span>
                  </div>
                </div>

                {/* Input Real con Referencia */}
                <input
                  ref={dateInputRef}
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>

              {/* Pagado Por */}
              <button
                type="button"
                onClick={handleUserCycle}
                className="bg-muted/20 rounded-2xl p-4 flex flex-col justify-between hover:bg-muted/30 transition-all border border-transparent hover:border-border/30 text-left min-h-25"
              >
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <User className="h-3 w-3" /> Pagado por
                </span>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full border-2 border-border/50 flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95',
                      selectedPayer?.color,
                    )}
                  ></div>
                  <span className="text-sm font-bold truncate">{selectedPayer?.name || 'Seleccionar'}</span>
                </div>
              </button>

              {/* Shared Toggle */}
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={cn(
                  'bg-muted/20 rounded-2xl p-4 flex flex-col justify-between transition-all border border-transparent hover:border-border/30 text-left min-h-25',
                  isShared ? 'bg-background shadow-md border-border/10' : 'hover:bg-muted/30',
                )}
              >
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Tipo</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none filter drop-shadow-sm">{isShared ? '👥' : '👤'}</span>
                  <span className="text-sm font-bold">{isShared ? 'Compartido' : 'Individual'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Adjusted to 50% width */}
          <div className="lg:w-1/2 bg-muted/5 flex flex-col p-6 lg:p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categoría</label>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">
                {categories.length} opciones
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-4 gap-4 content-start">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center gap-3 p-2 rounded-2xl transition-all duration-300 border relative group overflow-hidden',
                      category === cat.name
                        ? cn('border-transparent shadow-xl scale-105 z-10', activeTheme.bg, 'text-white')
                        : 'bg-background border-border/40 text-muted-foreground hover:bg-background hover:border-border hover:text-foreground hover:shadow-lg hover:-translate-y-0.5',
                    )}
                  >
                    {category === cat.name && (
                      <div className="absolute top-2 right-2 animate-in zoom-in duration-200">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <span
                      className={cn(
                        'text-3xl transition-transform duration-300',
                        category === cat.name
                          ? 'scale-110'
                          : 'group-hover:scale-110 opacity-70 group-hover:opacity-100',
                      )}
                    >
                      <CategoryIcon iconName={cat.icon} className="h-7 w-7" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide truncate w-full text-center opacity-90">
                      {cat.name}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className="aspect-square flex flex-col items-center justify-center gap-3 p-2 rounded-2xl transition-all border border-dashed border-border/50 text-muted-foreground/50 hover:text-primary hover:border-primary/50 hover:bg-primary/5 group"
                >
                  <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase">Crear</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 lg:p-5 border-t border-border/50 bg-card/50 flex items-center gap-4 shrink-0 rounded-xl">
          <div className="flex items-center gap-3 mr-auto">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={cn(
                'h-11 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border',
                isRecurring
                  ? cn(activeTheme.bgSoft, activeTheme.color, activeTheme.border)
                  : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/50',
              )}
            >
              <Repeat className="h-4 w-4" />
              <span className="hidden sm:inline">{isRecurring ? 'Mensual' : 'Repetir'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSyncToGoogle(!syncToGoogle)}
              className={cn(
                'h-11 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border',
                syncToGoogle
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/50',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', syncToGoogle && 'animate-spin-once')} />
              <span>Google</span>
            </button>
          </div>

          {!transactionToEdit && (
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground h-11 px-6">
              Cancelar
            </Button>
          )}
          <Button
            onClick={(e) => handleSubmit(e as any)}
            className={cn(
              'px-8 h-11 text-sm font-bold shadow-lg transition-all rounded-xl hover:scale-[1.02] active:scale-[0.98] text-white',
              activeTheme.bg,
              `shadow-${activeTheme.bg}/20`,
            )}
          >
            {transactionToEdit ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
