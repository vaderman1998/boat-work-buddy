import { useState } from 'react';
import { ScanBarcode } from 'lucide-react';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInventoryAction } from '@/hooks/useInventory';
import { inventoryCategories, type InventoryItem, type InventoryLocation, type InventorySupplier } from '@/lib/inventory';
export function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>;
}
export function InventoryItemForm({ item, barcode = '', locations, suppliers, close }: { item?: InventoryItem; barcode?: string; locations: InventoryLocation[]; suppliers: InventorySupplier[]; close: () => void }) {
  const action = useInventoryAction();
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({ name: item?.name ?? '', barcode: item?.barcode ?? barcode, category: item?.category ?? inventoryCategories[0], sku: item?.sku ?? '', unit: item?.unit ?? 'each', quantity: item?.quantity ?? 0, minimum_stock: item?.minimum_stock ?? 0, cost: item?.cost ?? 0, location_id: item?.location_id ?? null, supplier_id: item?.supplier_id ?? null, notes: item?.notes ?? '' });
  return <Dialog open onOpenChange={open => { if(!open) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{item ? 'Edit item' : 'Add inventory item'}</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); action.mutate({ type: 'item', input: { ...form, name: form.name.trim(), id: item?.id } }, { onSuccess: close }); }}>
      <div><Label htmlFor="inv-name">Name</Label><Input id="inv-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label htmlFor="inv-barcode">Barcode</Label><div className="flex gap-2"><Input id="inv-barcode" value={form.barcode} autoComplete="off" onChange={e => setForm({ ...form, barcode: e.target.value })} /><Button type="button" variant="outline" size="icon" aria-label="Scan item barcode" title="Scan barcode" onClick={() => setScanning(true)}><ScanBarcode className="h-4 w-4" /></Button></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Choice label="Category" value={form.category} onChange={category => setForm({ ...form, category })} options={inventoryCategories.map(value => ({ value, label: value }))} /></div><div><Label htmlFor="inv-sku">Part / SKU number</Label><Input id="inv-sku" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label htmlFor="inv-unit">Unit</Label><Input id="inv-unit" required value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div><div><Label htmlFor="inv-cost">Unit cost ($)</Label><Input id="inv-cost" type="number" min="0" step="0.01" required value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label htmlFor="inv-qty">Quantity on hand</Label><Input id="inv-qty" type="number" min="0" step="any" required disabled={!!item} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></div><div><Label htmlFor="inv-min">Minimum stock</Label><Input id="inv-min" type="number" min="0" step="any" required value={form.minimum_stock} onChange={e => setForm({ ...form, minimum_stock: Number(e.target.value) })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>Location / bin</Label><Choice label="Item location" value={form.location_id ?? 'none'} onChange={v => setForm({ ...form, location_id: v === 'none' ? null : v })} options={[{ value: 'none', label: 'Unassigned' }, ...locations.map(l => ({ value:l.id, label:l.name }))]} /></div><div><Label>Supplier</Label><Choice label="Item supplier" value={form.supplier_id ?? 'none'} onChange={v => setForm({ ...form, supplier_id: v === 'none' ? null : v })} options={[{ value:'none', label:'Unassigned' }, ...suppliers.map(s => ({ value:s.id, label:s.name }))]} /></div></div>
      <div><Label htmlFor="inv-notes">Notes</Label><Textarea id="inv-notes" value={form.notes} onChange={e => setForm({ ...form, notes:e.target.value })} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button disabled={action.isPending}>{action.isPending ? 'Saving…' : 'Save item'}</Button></div>
    </form>{scanning && <BarcodeScanner onScan={barcode => setForm(current => ({ ...current, barcode }))} close={() => setScanning(false)} />}</DialogContent></Dialog>;
}
export function InventoryDirectoryForm({ kind, entry, close }: { kind: 'supplier' | 'location'; entry?: InventorySupplier | InventoryLocation; close: () => void }) {
  const action = useInventoryAction();
  const supplier = entry && 'email' in entry ? entry : undefined;
  const [form, setForm] = useState({ name:entry?.name ?? '', contact:supplier?.contact ?? '', email:supplier?.email ?? '', phone:supplier?.phone ?? '' });
  return <Dialog open onOpenChange={o => { if(!o) close(); }}><DialogContent><DialogHeader><DialogTitle>{entry ? 'Edit' : 'Add'} {kind}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={e => { e.preventDefault(); action.mutate(kind === 'supplier' ? { type:kind, input: { ...form, name: form.name.trim(), id:entry?.id } } : { type:kind, input: { name:form.name.trim(), id:entry?.id } }, { onSuccess:close }); }}>
    {(kind === 'supplier' ? ['name','contact','email','phone'] as const : ['name'] as const).map(field => <div key={field}><Label htmlFor={`directory-${field}`} className="capitalize">{field}</Label><Input id={`directory-${field}`} required={field === 'name'} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={form[field]} onChange={e => setForm({ ...form, [field]:e.target.value })} /></div>)}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button disabled={action.isPending}>Save {kind}</Button></div></form></DialogContent></Dialog>;
}
export function InventoryAdjustment({ item, close }: { item:InventoryItem; close:()=>void }) {
  const action = useInventoryAction(); const [amount,setAmount] = useState(''); const [note,setNote] = useState('');
  return <Dialog open onOpenChange={o => { if(!o) close(); }}><DialogContent><DialogHeader><DialogTitle>Adjust stock · {item.name}</DialogTitle></DialogHeader><p>{item.quantity} {item.unit} on hand</p><form className="space-y-4" onSubmit={e => {e.preventDefault(); action.mutate({type:'adjust',id:item.id,amount:Number(amount),note}, {onSuccess:close});}}><div><Label htmlFor="stock-change">Quantity change (+ / −)</Label><Input id="stock-change" type="number" step="any" required value={amount} onChange={e=>setAmount(e.target.value)} /></div><div><Label htmlFor="stock-reason">Reason</Label><Input id="stock-reason" required value={note} onChange={e=>setNote(e.target.value)} /></div><Button disabled={action.isPending || !Number(amount)}>Save adjustment</Button></form></DialogContent></Dialog>;
}
