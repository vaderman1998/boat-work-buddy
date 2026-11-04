import { stockAfter, type InventoryItem, type InventoryLocation, type InventorySupplier, type InventoryOrder, type InventoryMovement } from '@/lib/inventory';
const now = () => new Date().toISOString();
const id = () => `demo-inv-${crypto.randomUUID()}`;
let items: InventoryItem[] = [];
let suppliers: InventorySupplier[] = [];
let locations: InventoryLocation[] = [];
let orders: InventoryOrder[] = [];
let movements: InventoryMovement[] = [];
const copy = <T,>(value: T): T => structuredClone(value);
export const inventoryStore = {
  list: () => copy({ items, suppliers, locations, orders, movements }),
  saveItem(input: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'barcode'> & { id?: string; barcode?: string }) {
    input = { ...input, barcode: (input.barcode ?? '').trim() };
    if (input.barcode && items.some(item => item.barcode === input.barcode && item.id !== input.id)) throw new Error('This barcode is already assigned to another item');
    const existing = items.find(i => i.id === input.id);
    if (existing) { Object.assign(existing, input, { quantity: existing.quantity, updated_at: now() }); return copy(existing); }
    stockAfter(0, input.quantity);
    const item = { ...input, barcode: input.barcode ?? '', id: id(), created_at: now(), updated_at: now() };
    items.push(item);
    if (item.quantity) this.change(item.id, 0, 'Opening stock', undefined, item.quantity);
    return copy(item);
  },
  saveSupplier(input: Pick<InventorySupplier, 'name' | 'contact' | 'email' | 'phone'> & { id?: string }) {
    const existing = suppliers.find(s => s.id === input.id);
    if (existing) Object.assign(existing, input, { updated_at: now() });
    else suppliers.push({ ...input, id: id(), created_at: now(), updated_at: now() });
  },
  saveLocation(input: { id?: string; name: string }) {
    if (locations.some(l => l.name === input.name && l.id !== input.id)) throw new Error('Location already exists');
    const existing = locations.find(l => l.id === input.id);
    if (existing) Object.assign(existing, input, { updated_at: now() });
    else locations.push({ ...input, id: id(), created_at: now(), updated_at: now() });
  },
  deleteLocation(key: string) { locations = locations.filter(l => l.id !== key); items.forEach(i => { if(i.location_id === key) i.location_id = null; }); },
  deleteSupplier(key: string) { suppliers = suppliers.filter(s => s.id !== key); items.forEach(i => { if(i.supplier_id === key) i.supplier_id = null; }); orders.forEach(o => { if(o.supplier_id === key) o.supplier_id = null; }); },
  change(key: string, amount: number, reason: string, job?: { id: string; customer_name: string; boat_name: string }, opening?: number) {
    const item = items.find(i => i.id === key);
    if (!item) throw new Error('Inventory item not found');
    item.quantity = stockAfter(item.quantity, amount);
    item.updated_at = now();
    if (amount || opening) movements.unshift({ id: id(), item_id: key, change: opening ?? amount, quantity_after: item.quantity, reason, job_id: job?.id ?? null, job_name: job?.customer_name ?? '', boat_name: job?.boat_name ?? '', actor_id: null, actor_name: 'Demo team member', created_at: now(), updated_at: now() });
  },
  order(item_id: string, quantity: number) {
    const item = items.find(i => i.id === item_id);
    if (!item || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Enter a positive quantity');
    orders.unshift({ id: id(), item_id, supplier_id: item.supplier_id, quantity, status: 'ordered', ordered_by: null, received_by: null, received_at: null, created_at: now(), updated_at: now() });
  },
  receive(key: string) {
    const order = orders.find(o => o.id === key);
    if (!order || order.status !== 'ordered') throw new Error('Order already received or unavailable');
    this.change(order.item_id, order.quantity, 'Received order');
    Object.assign(order, { status: 'received', received_at: now(), updated_at: now() });
  },
};
