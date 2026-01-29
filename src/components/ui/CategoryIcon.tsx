import {
  Utensils,
  Home,
  Lightbulb,
  Clapperboard,
  Car,
  ShoppingBag,
  Plane,
  FileText,
  Dumbbell,
  Stethoscope,
  GraduationCap,
  Gamepad2,
  Wine,
  Gift,
  Baby,
  Dog,
  HelpCircle,
  Smartphone,
  Wifi,
  CreditCard,
  Banknote,
  Briefcase,
  Wrench,
  Hammer,
  Zap,
  Coffee,
  Music,
  Book,
  Camera,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Food & Drink
  Alimentación: Utensils,
  Comida: Utensils,
  Restaurante: Utensils,
  Bar: Wine,
  Café: Coffee,

  // Home & Utilities
  Casa: Home,
  Vivienda: Home,
  Servicios: Lightbulb,
  Internet: Wifi,
  Teléfono: Smartphone,
  Mantenimiento: Hammer,

  // Transport
  Transporte: Car,
  Coche: Car,
  Gasolina: Zap,
  Mecánico: Wrench,

  // Entertainment
  Entretenimiento: Clapperboard,
  Cine: Clapperboard,
  Juegos: Gamepad2,
  Música: Music,
  Libros: Book,

  // Shopping
  Compras: ShoppingBag,
  Ropa: ShoppingBag,
  Electrónica: Camera,

  // Health & Wellness
  Salud: Stethoscope,
  Farmacia: Stethoscope,
  Deporte: Dumbbell,
  Gimnasio: Dumbbell,

  // Life & Others
  Educación: GraduationCap,
  Viajes: Plane,
  Regalos: Gift,
  Mascotas: Dog,
  Bebé: Baby,
  Otros: FileText,
  Varios: HelpCircle,

  // Income/Finance
  Salario: Banknote,
  Inversión: Briefcase,
  Tarjeta: CreditCard,
};

// Also export a list for the picker, using keys that are descriptive
export const AVAILABLE_ICONS = [
  { name: 'Alimentación', icon: Utensils },
  { name: 'Café', icon: Coffee },
  { name: 'Bar', icon: Wine },
  { name: 'Casa', icon: Home },
  { name: 'Servicios', icon: Lightbulb },
  { name: 'Internet', icon: Wifi },
  { name: 'Transporte', icon: Car },
  { name: 'Mecánico', icon: Wrench },
  { name: 'Compras', icon: ShoppingBag },
  { name: 'Entretenimiento', icon: Clapperboard },
  { name: 'Juegos', icon: Gamepad2 },
  { name: 'Deporte', icon: Dumbbell },
  { name: 'Salud', icon: Stethoscope },
  { name: 'Educación', icon: GraduationCap },
  { name: 'Viajes', icon: Plane },
  { name: 'Mascotas', icon: Dog },
  { name: 'Bebé', icon: Baby },
  { name: 'Regalos', icon: Gift },
  { name: 'Trabajo', icon: Briefcase },
  { name: 'Dinero', icon: Banknote },
  { name: 'Otros', icon: FileText },
];

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

export function CategoryIcon({ iconName, className }: CategoryIconProps) {
  // Check if it's a known Lucide key
  const Icon =
    CATEGORY_ICONS[iconName] ||
    // Or maybe the user saved the component name? Let's check AVAILABLE_ICONS
    AVAILABLE_ICONS.find((i) => i.name === iconName)?.icon;

  if (Icon) {
    return <Icon className={cn('shrink-0', className)} />;
  }

  // Fallback: Render as text (Emoji)
  return (
    <span className={cn('shrink-0 text-current leading-none', className)} style={{ fontSize: '1.2em' }}>
      {iconName}
    </span>
  );
}
