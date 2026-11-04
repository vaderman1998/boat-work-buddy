import { useState } from 'react';
import { PackagePlus, ScanBarcode } from 'lucide-react';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { matchesInventorySearch } from '@/lib/inventory';
import { useInventory } from '@/hooks/useInventory';
import { useAddJobPart } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Choice } from '@/components/InventoryForms';
export function InventoryJobPicker({ jobId }: { jobId:string }) {
 const { data, error } = useInventory(); const add = useAddJobPart(); const [key,setKey] = useState('none'); const [quantity,setQuantity] = useState(1); const [search,setSearch] = useState('');
 const [scanning,setScanning] = useState(false);
 const item = data?.items.find(i=>i.id===key);
 return <div className="space-y-2 border-t pt-3"><div className="flex gap-2"><Input aria-label="Search inventory parts" placeholder="Search inventory parts / SKU / barcode" value={search} onChange={e=>setSearch(e.target.value)} /><Button variant="outline" size="icon" aria-label="Scan inventory part" title="Scan inventory part" onClick={()=>setScanning(true)}><ScanBarcode className="h-4 w-4"/></Button></div><Choice label="Pick inventory item" value={key} onChange={setKey} options={[{value:'none',label:'Pick from inventory'},...(data?.items ?? []).filter(i=>matchesInventorySearch(i,search)).map(i=>({value:i.id,label:`${i.name} · ${i.quantity} ${i.unit}`}))]} />{error && <p className="text-sm text-destructive">{error.message}</p>}{item && <><p className="text-xs text-muted-foreground">SKU: {item.sku || '—'} · ${item.cost.toFixed(2)} / {item.unit}</p><div className="flex gap-2"><Input aria-label="Inventory part quantity" type="number" min="1" step="1" max={Math.floor(item.quantity)} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} /><Button disabled={add.isPending || quantity<=0 || !Number.isInteger(quantity) || quantity>item.quantity} onClick={()=>add.mutate({job_id:jobId,name:item.name,quantity,cost_per_unit:item.cost,inventory_item_id:item.id},{onSuccess:()=>{setKey('none');setQuantity(1);}})}><PackagePlus className="h-4 w-4 mr-2"/>Add from stock</Button></div></>}{scanning&&<BarcodeScanner close={()=>setScanning(false)} onScan={barcode=>{setSearch(barcode);setKey(data?.items.find(i=>i.barcode===barcode||i.sku===barcode)?.id??'none');setQuantity(1);}}/>}</div>;
}
