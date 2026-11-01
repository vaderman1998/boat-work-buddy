GRANT UPDATE ON public.inventory_orders TO authenticated;
CREATE POLICY "Team receives orders" ON public.inventory_orders FOR UPDATE TO authenticated USING (NOT public.is_demo_user() AND status='ordered') WITH CHECK (NOT public.is_demo_user() AND status='received' AND received_by=auth.uid());
CREATE OR REPLACE FUNCTION public.inventory_receive_transition() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF OLD.status <> 'ordered' OR NEW.status <> 'received' OR NEW.item_id <> OLD.item_id OR NEW.quantity <> OLD.quantity OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id OR NEW.ordered_by IS DISTINCT FROM OLD.ordered_by OR NEW.created_at <> OLD.created_at THEN RAISE EXCEPTION 'Only receiving an unchanged open order is allowed'; END IF;
 NEW.received_by:=auth.uid(); NEW.received_at:=now();
 PERFORM set_config('inventory.reason','Received order',true);
 UPDATE public.inventory_items SET quantity=quantity+OLD.quantity WHERE id=OLD.item_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Item unavailable'; END IF;
 PERFORM set_config('inventory.reason','',true);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.inventory_receive_transition() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER inventory_receive_stock BEFORE UPDATE ON public.inventory_orders FOR EACH ROW EXECUTE FUNCTION public.inventory_receive_transition();
CREATE OR REPLACE FUNCTION public.receive_inventory_order(order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_demo_user() THEN RAISE EXCEPTION 'Team sign-in required'; END IF;
 UPDATE public.inventory_orders SET status='received',received_by=auth.uid(),received_at=now() WHERE id=order_id AND status='ordered';
 IF NOT FOUND THEN RAISE EXCEPTION 'Order unavailable or already received'; END IF;
END; $$;