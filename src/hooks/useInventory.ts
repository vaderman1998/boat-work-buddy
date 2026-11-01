import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/contexts/DemoContext';
import { inventoryStore } from '@/data/inventoryStore';
import { toast } from '@/hooks/use-toast';
import type { InventoryItem, InventorySupplier } from '@/lib/inventory';
export function useTeamSession() {
  const { isDemoMode } = useDemoMode();
  const [state, setState] = useState({ ready: false, signedIn: false });
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ ready: true, signedIn: !!data.session }));
    const { data } = supabase.auth.onAuthStateChange((_, session) => setState({ ready: true, signedIn: !!session }));
    return () => data.subscription.unsubscribe();
  }, []);
  return { ready: state.ready, allowed: isDemoMode || state.signedIn };
}
async function allRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}
export function useInventory() {
  const { isDemoMode } = useDemoMode();
  const { allowed, ready } = useTeamSession();
  return useQuery({ queryKey: ['inventory', isDemoMode ? 'demo' : 'live'], enabled: allowed && ready, queryFn: async () => {
    if (isDemoMode) return inventoryStore.list();
    const [items, suppliers, locations, orders, movements] = await Promise.all([
      allRows((a,b) => supabase.from('inventory_items').select('*').order('id').range(a,b)),
      allRows((a,b) => supabase.from('inventory_suppliers').select('*').order('id').range(a,b)),
      allRows((a,b) => supabase.from('inventory_locations').select('*').order('id').range(a,b)),
      allRows((a,b) => supabase.from('inventory_orders').select('*').order('created_at', { ascending: false }).order('id').range(a,b)),
      allRows((a,b) => supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).order('id').range(a,b)),
    ]);
    return { items, suppliers, locations, orders, movements };
  }});
}
type ItemInput = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> & { id?: string };
type Action = { type: 'item'; input: ItemInput } | { type: 'supplier'; input: Pick<InventorySupplier, 'name' | 'contact' | 'email' | 'phone'> & { id?: string } } | { type: 'location'; input: { id?: string; name: string } } | { type: 'deleteLocation' | 'deleteSupplier' | 'receive'; id: string } | { type: 'adjust'; id: string; amount: number; note: string } | { type: 'order'; id: string; quantity: number };
export function useInventoryAction() {
  const { isDemoMode } = useDemoMode();
  const client = useQueryClient();
  return useMutation({ mutationFn: async (action: Action) => {
    if (isDemoMode) {
      switch(action.type) {
        case 'item': return inventoryStore.saveItem(action.input);
        case 'supplier': return inventoryStore.saveSupplier(action.input);
        case 'location': return inventoryStore.saveLocation(action.input);
        case 'deleteLocation': return inventoryStore.deleteLocation(action.id);
        case 'deleteSupplier': return inventoryStore.deleteSupplier(action.id);
        case 'adjust': return inventoryStore.change(action.id, action.amount, `Manual adjustment: ${action.note}`);
        case 'order': return inventoryStore.order(action.id, action.quantity);
        case 'receive': return inventoryStore.receive(action.id);
      }
    }
    let result;
    switch(action.type) {
      case 'item': { const { id, ...input } = action.input; const { quantity, ...details } = input; result = id ? await supabase.from('inventory_items').update(details).eq('id',id).select().single() : await supabase.from('inventory_items').insert(input).select().single(); break; }
      case 'supplier': { const { id, ...input } = action.input; result = id ? await supabase.from('inventory_suppliers').update(input).eq('id',id).select().single() : await supabase.from('inventory_suppliers').insert(input); break; }
      case 'location': { const { id, ...input } = action.input; result = id ? await supabase.from('inventory_locations').update(input).eq('id',id).select().single() : await supabase.from('inventory_locations').insert(input); break; }
      case 'deleteLocation': result = await supabase.from('inventory_locations').delete().eq('id',action.id); break;
      case 'deleteSupplier': result = await supabase.from('inventory_suppliers').delete().eq('id',action.id); break;
      case 'adjust': result = await supabase.rpc('adjust_inventory_stock', { item_id: action.id, amount: action.amount, note: action.note }); break;
      case 'receive': result = await supabase.rpc('receive_inventory_order', { order_id: action.id }); break;
      case 'order': { const { data: item, error } = await supabase.from('inventory_items').select('supplier_id').eq('id',action.id).single(); if(error) throw error; result = await supabase.from('inventory_orders').insert({ item_id: action.id, supplier_id: item.supplier_id, quantity: action.quantity }); break; }
    }
    if (result?.error) throw new Error(result.error.message);
  }, onSuccess: () => { client.invalidateQueries({ queryKey: ['inventory'] }); toast({ title: 'Inventory updated' }); }, onError: (error) => toast({ title: 'Inventory change failed', description: error.message, variant: 'destructive' }) });
}
