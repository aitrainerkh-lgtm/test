import React from 'react';
import {
  BarChart3,
  CalendarCheck,
  CalendarClock,
  MessageSquareText,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/** Icon names you can use for moreTools.tiles in config.ts */
export const TILE_ICONS: Record<string, LucideIcon> = {
  attendance: UserCheck,
  stock: Package,
  purchasing: ShoppingCart,
  agent: MessageSquareText,
  billing: Receipt,
  suppliers: Truck,
  leave: CalendarCheck,
  reports: BarChart3,
  expenses: Wallet,
  booking: CalendarClock,
  crm: Users,
  more: Plus,
};

export const ToolTileIcon: React.FC<{name: string; size: number; color: string}> = ({name, size, color}) => {
  const Icon = TILE_ICONS[name] ?? Package;
  return <Icon size={size} color={color} strokeWidth={2.4} />;
};
