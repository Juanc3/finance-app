/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

// Simple emoji picker list
const ICONS = ["🍔", "🏠", "💡", "🎬", "🚗", "🛍️", "✈️", "📝", "🏋️", "🏥", "📚", "🎮", "🍷", "🎁", "👶", "🐶"];
const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", 
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500", 
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", 
  "bg-pink-500", "bg-rose-500", "bg-slate-500"
];

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string; color: string }) => void;
  initialData?: { name: string; icon: string; color: string } | null;
  title: string;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState({ name: "", icon: ICONS[0], color: COLORS[0] });
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setIsClosing(false);
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({ name: "", icon: ICONS[0], color: COLORS[0] });
        }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSubmit(formData);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-200",
      isClosing ? "opacity-0" : "animate-in fade-in"
    )}>
      <div 
        className="absolute inset-0" 
        onClick={handleClose}
      />
      <GlassCard className={cn(
        "w-full max-w-lg overflow-hidden shadow-2xl relative transition-all duration-200",
        isClosing ? "scale-95 opacity-0" : "animate-in zoom-in-95 fade-in",
        "border-border"
      )}>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
                {title}
            </h2>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass-input w-full rounded-lg px-4 py-3 bg-muted/50 border border-border focus:border-primary transition-colors"
                placeholder="Ej: Gimnasio"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Icono</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-lg text-xl hover:bg-muted transition-colors",
                      formData.icon === icon ? "bg-muted ring-2 ring-primary" : "bg-muted/50"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      "h-8 w-8 rounded-full hover:scale-110 transition-transform",
                      color,
                      formData.color === color ? "ring-2 ring-background ring-offset-2 ring-offset-muted-foreground" : ""
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 text-muted-foreground hover:text-foreground">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                Guardar
              </Button>
            </div>
          </form>
      </GlassCard>
    </div>
  );
}
