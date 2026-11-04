import { describe, expect, test } from 'bun:test';
import { isLowStock, suggestedOrder, stockAfter, matchesInventorySearch } from '../src/lib/inventory';
import { inventoryStore } from '../src/data/inventoryStore';
import { demoStore } from '../src/data/demoStore';
describe('inventory rules', () => {
 test('barcodes preserve leading zeroes and find the correct item',()=>{
  const item=inventoryStore.saveItem({name:'Barcode filter',barcode:' 0012345678905 ',category:'Consumables',sku:'B1',unit:'each',quantity:4,minimum_stock:1,cost:10,location_id:null,supplier_id:null,notes:''});
  expect(item.barcode).toBe('0012345678905');
  expect(matchesInventorySearch(item,'0012345678905')).toBe(true);
  expect(matchesInventorySearch(item,'9999999999999')).toBe(false);
 });
 test('duplicate barcodes are rejected without changing stock',()=>{
  const input={name:'Barcode spare',barcode:'0098765432105',category:'Parts & spares',sku:'',unit:'each',quantity:3,minimum_stock:1,cost:5,location_id:null,supplier_id:null,notes:''};
  const item=inventoryStore.saveItem(input);
  expect(()=>inventoryStore.saveItem({...input,name:'Duplicate'})).toThrow('already assigned');
  const edited=inventoryStore.saveItem({...input,id:item.id,name:'Renamed',quantity:99});
  expect(edited.barcode).toBe('0098765432105');expect(edited.quantity).toBe(3);
 });
 test('stock at minimum is low stock',()=>expect(isLowStock({quantity:3,minimum_stock:3})).toBe(true));
 test('stock below minimum is low stock',()=>expect(isLowStock({quantity:2,minimum_stock:3})).toBe(true));
 test('stock above minimum is not low stock',()=>expect(isLowStock({quantity:4,minimum_stock:3})).toBe(false));
 test('reorder suggestion replenishes to twice minimum with at least one unit',()=>{expect(suggestedOrder({quantity:2,minimum_stock:3})).toBe(4);expect(suggestedOrder({quantity:0,minimum_stock:0})).toBe(1);});
 test('stock cannot become negative',()=>expect(()=>stockAfter(2,-3)).toThrow());
 test('job use deducts stock; edits and deleting parts restore stock',()=>{
  const item=inventoryStore.saveItem({name:'Test filter',category:'Consumables',sku:'F1',unit:'each',quantity:8,minimum_stock:2,cost:12,location_id:null,supplier_id:null,notes:''});
  const job=demoStore.listJobs()[0];
  if(!job) throw new Error('Missing sample job');
  const part=demoStore.addPart({job_id:job.id,name:item.name,quantity:3,cost_per_unit:12,inventory_item_id:item.id});
  const qty=()=>inventoryStore.list().items.find(i=>i.id===item.id)?.quantity;
  expect(qty()).toBe(5);
  demoStore.updatePart(part.id,{quantity:2});expect(qty()).toBe(6);
  demoStore.deletePart(part.id);expect(qty()).toBe(8);
  const used=inventoryStore.list().movements.find(m=>m.item_id===item.id&&m.reason==='Used on job');
  expect(used?.boat_name).toBe(job.boat_name); expect(used?.actor_name).toBe('Demo team member');expect(used?.created_at).toBeTruthy();
 });
 test('receiving increases stock exactly once',()=>{
  const item=inventoryStore.saveItem({name:'Oil',category:'Consumables',sku:'',unit:'litre',quantity:0,minimum_stock:4,cost:8,location_id:null,supplier_id:null,notes:''});
  inventoryStore.order(item.id,6);const order=inventoryStore.list().orders.find(o=>o.item_id===item.id);
  if(!order) throw new Error('Missing order');
  inventoryStore.receive(order.id);expect(inventoryStore.list().items.find(i=>i.id===item.id)?.quantity).toBe(6);
  expect(()=>inventoryStore.receive(order.id)).toThrow();
 });
 test('deleting a job returns its inventory allocation',()=>{
  const item=inventoryStore.saveItem({name:'Spare',category:'Parts & spares',sku:'',unit:'each',quantity:5,minimum_stock:1,cost:5,location_id:null,supplier_id:null,notes:''});
  const job=demoStore.createJob({customer_name:'Test',boat_name:'Test Boat'});
  demoStore.addPart({job_id:job.id,name:item.name,quantity:2,cost_per_unit:5,inventory_item_id:item.id});demoStore.deleteJob(job.id);
  expect(inventoryStore.list().items.find(i=>i.id===item.id)?.quantity).toBe(5);
 });
});
