import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useAddJobPart } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Choice } from '@/components/InventoryForms';
export function InventoryJobPicker({ jobId }: { jobId:string }) {
 const { data, error } = useInventory(); const add = useAddJobPart(); const [key,setKey] = useState('none'); const [quantity,setQuantity] = useState(1); const [search,setSearch] = useState('');
 const item = data?.items.find(i=>i.id===key);
 return <div className="space-y-2 border-t pt-3"><Input aria-label="Search inventory parts" placeholder="Search inventory parts / SKU" value={search} onChange={e=>setSearch(e.target.value)} /><Choice label="Pick inventory item" value={key} onChange={setKey} options={[{value:'none',label:'Pick from inventory'},...(data?.items ?? []).filter(i=>`${i.name} ${i.sku}`.toLowerCase().includes(search.toLowerCase())).map(i=>({value:i.id,label:`${i.name} · ${i.quantity} ${i.unit}`}))]} />{error && <p className="text-sm text-destructive">{error.message}</p>}{item && <><p className="text-xs text-muted-foreground">SKU: {item.sku || '—'} · ${item.cost.toFixed(2)} / {item.unit}</p><div className="flex gap-2"><Input aria-label="Inventory part quantity" type="number" min="1" step="1" max={Math.floor(item.quantity)} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} /><Button disabled={add.isPending || quantity<=0 || !Number.isInteger(quantity) || quantity>item.quantity} onClick={()=>add.mutate({job_id:jobId,name:item.name,quantity,cost_per_unit:item.cost,inventory_item_id:item.id},{onSuccess:()=>{setKey('none');setQuantity(1);}})}><PackagePlus className="h-4 w-4 mr-2"/>Add from stock</Button></div></>}</div>;
}
