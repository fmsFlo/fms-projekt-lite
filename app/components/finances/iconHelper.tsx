import {
  Wallet,
  Home,
  Car,
  ShoppingBag,
  UtensilsCrossed,
  Plane,
  Smartphone,
  Shield,
  CreditCard,
  PiggyBank,
  Coffee,
  Film,
  Gamepad2,
  Shirt,
  Dumbbell,
  Music,
  BookOpen,
  Heart,
  Gift,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Wallet,
  Home,
  Car,
  ShoppingBag,
  UtensilsCrossed,
  Plane,
  Smartphone,
  Shield,
  CreditCard,
  PiggyBank,
  Coffee,
  Film,
  Gamepad2,
  Shirt,
  Dumbbell,
  Music,
  BookOpen,
  Heart,
  Gift,
  TrendingUp,
  TrendingDown,
}

export function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Wallet
}

