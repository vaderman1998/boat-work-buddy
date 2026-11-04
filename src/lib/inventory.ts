import type { Tables } from '@/integrations/supabase/types';
export type InventoryItem = Tables<'inventory_items'>;
export type InventorySupplier = Tables<'inventory_suppliers'>;
export type InventoryLocation = Tables<'inventory_locations'>;
export type InventoryOrder = Tables<'inventory_orders'>;
export type InventoryMovement = Tables<'inventory_movements'>;
export const inventoryCategories = ['Parts & spares', 'Tools & equipment', 'Consumables'];
export const matchesInventorySearch = (item: Pick<InventoryItem, 'name' | 'sku' | 'notes' | 'barcode'>, search: string) =>
  [item.name, item.sku, item.notes, item.barcode].some(value => value.toLowerCase().includes(search.trim().toLowerCase()));
export const isLowStock = (item: Pick<InventoryItem, 'quantity' | 'minimum_stock'>) => item.quantity <= item.minimum_stock;
export const suggestedOrder = (item: Pick<InventoryItem, 'quantity' | 'minimum_stock'>) => Math.max(1, item.minimum_stock * 2 - item.quantity);
export const stockAfter = (quantity: number, change: number) => {
  const next = quantity + change;
  if (!Number.isFinite(next) || next < 0) throw new Error('Not enough stock for this change');
  return next;
};
