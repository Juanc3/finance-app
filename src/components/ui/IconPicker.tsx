import React from 'react';
import { cn } from '@/lib/utils';
import { AVAILABLE_ICONS } from './CategoryIcon';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
      {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={cn(
            'aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-muted transition-all gap-1',
            selectedIcon === name
              ? 'bg-primary/20 ring-2 ring-primary text-primary'
              : 'bg-muted/30 text-muted-foreground hover:text-foreground',
          )}
          title={name}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
