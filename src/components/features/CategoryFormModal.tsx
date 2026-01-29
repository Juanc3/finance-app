'use client';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { IconPicker } from '@/components/ui/IconPicker';
import { ColorPicker, AVAILABLE_COLORS } from '@/components/ui/ColorPicker';
import { AVAILABLE_ICONS } from '@/components/ui/CategoryIcon';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string; color: string }) => void;
  initialData?: { name: string; icon: string; color: string } | null;
  title: string;
}

export function CategoryFormModal({ isOpen, onClose, onSubmit, initialData, title }: CategoryFormModalProps) {
  // Default to first icon/color
  const defaultIcon = AVAILABLE_ICONS[0].name;
  const defaultColor = AVAILABLE_COLORS[0];

  const [formData, setFormData] = useState({ name: '', icon: defaultIcon, color: defaultColor });
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({ name: '', icon: defaultIcon, color: defaultColor });
      }
    }
  }, [isOpen, initialData, defaultIcon, defaultColor]);

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
    <div
      className={cn(
        'fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-200',
        isClosing ? 'opacity-0' : 'animate-in fade-in',
      )}
    >
      <div className="absolute inset-0" onClick={handleClose} />
      <GlassCard
        className={cn(
          'w-full max-w-lg overflow-hidden shadow-2xl relative transition-all duration-200',
          isClosing ? 'scale-95 opacity-0' : 'animate-in zoom-in-95 fade-in',
          'border-border',
        )}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Nombre
            </label>
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
            <IconPicker selectedIcon={formData.icon} onSelect={(icon) => setFormData({ ...formData, icon })} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Color</label>
            <ColorPicker selectedColor={formData.color} onSelect={(color) => setFormData({ ...formData, color })} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1 text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              Guardar
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
