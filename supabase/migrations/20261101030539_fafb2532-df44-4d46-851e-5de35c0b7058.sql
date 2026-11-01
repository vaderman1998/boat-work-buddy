CREATE TABLE public.inventory_locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inventory_locations TO authenticated; GRANT ALL ON public.inventory_locations TO service_role;
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team inventory locations" ON public.inventory_locations FOR ALL TO authenticated USING (NOT public.is_demo_user()) WITH CHECK (NOT public.is_demo_user());
CREATE TABLE public.inventory_suppliers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, contact text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inventory_suppliers TO authenticated; GRANT ALL ON public.inventory_suppliers TO service_role;
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team inventory suppliers" ON public.inventory_suppliers FOR ALL TO authenticated USING (NOT public.is_demo_user()) WITH CHECK (NOT public.is_demo_user());
CREATE TABLE public.inventory_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text NOT NULL DEFAULT 'Parts & spares', sku text NOT NULL DEFAULT '', unit text NOT NULL DEFAULT 'each', quantity numeric NOT NULL DEFAULT 0 CHECK(quantity >= 0), minimum_stock numeric NOT NULL DEFAULT 0 CHECK(minimum_stock >= 0), cost numeric NOT NULL DEFAULT 0 CHECK(cost >= 0), location_id uuid REFERENCES public.inventory_locations(id) ON DELETE SET NULL, supplier_id uuid REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inventory_items TO authenticated; GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team inventory items" ON public.inventory_items FOR ALL TO authenticated USING (NOT public.is_demo_user()) WITH CHECK (NOT public.is_demo_user());
CREATE TABLE public.inventory_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES public.inventory_items(id), supplier_id uuid REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL, quantity numeric NOT NULL CHECK(quantity > 0), status text NOT NULL DEFAULT 'ordered' CHECK(status IN ('ordered','received')), ordered_by uuid DEFAULT auth.uid(), received_by uuid, received_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.inventory_orders TO authenticated; GRANT ALL ON public.inventory_orders TO service_role;
ALTER TABLE public.inventory_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read orders" ON public.inventory_orders FOR SELECT TO authenticated USING (NOT public.is_demo_user());
CREATE POLICY "Team can order" ON public.inventory_orders FOR INSERT TO authenticated WITH CHECK (NOT public.is_demo_user() AND status = 'ordered' AND received_at IS NULL AND received_by IS NULL AND ordered_by = auth.uid());
CREATE TABLE public.inventory_movements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES public.inventory_items(id), change numeric NOT NULL, quantity_after numeric NOT NULL, reason text NOT NULL, job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL, job_name text NOT NULL DEFAULT '', boat_name text NOT NULL DEFAULT '', actor_id uuid, actor_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.inventory_movements TO authenticated; GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads stock history" ON public.inventory_movements FOR SELECT TO authenticated USING (NOT public.is_demo_user());
ALTER TABLE public.job_parts ADD COLUMN inventory_item_id uuid REFERENCES public.inventory_items(id);
CREATE INDEX inventory_movements_item ON public.inventory_movements(item_id,created_at DESC);
CREATE INDEX job_parts_inventory ON public.job_parts(inventory_item_id);
CREATE TRIGGER inventory_locations_updated BEFORE UPDATE ON public.inventory_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inventory_suppliers_updated BEFORE UPDATE ON public.inventory_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inventory_items_updated BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER inventory_orders_updated BEFORE UPDATE ON public.inventory_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.inventory_log_quantity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta numeric; jid uuid; jname text := ''; bname text := '';
BEGIN
 delta := NEW.quantity - CASE WHEN TG_OP='INSERT' THEN 0 ELSE OLD.quantity END;
 IF delta = 0 THEN RETURN NEW; END IF;
 jid := NULLIF(current_setting('inventory.job_id',true),'')::uuid;
 IF jid IS NOT NULL THEN SELECT customer_name,boat_name INTO jname,bname FROM public.jobs WHERE id=jid; END IF;
 INSERT INTO public.inventory_movements(item_id,change,quantity_after,reason,job_id,job_name,boat_name,actor_id,actor_name)
 VALUES(NEW.id,delta,NEW.quantity,COALESCE(NULLIF(current_setting('inventory.reason',true),''),CASE WHEN TG_OP='INSERT' THEN 'Opening stock' ELSE 'Manual adjustment' END),jid,COALESCE(jname,''),COALESCE(bname,''),auth.uid(),COALESCE(NULLIF(auth.jwt()->>'email',''),'Team member'));
 RETURN NEW;
END; $$;
CREATE TRIGGER inventory_quantity_history AFTER INSERT OR UPDATE OF quantity ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.inventory_log_quantity();
CREATE OR REPLACE FUNCTION public.inventory_job_part_stock() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE iid uuid; delta numeric; jid uuid;
BEGIN
 IF TG_OP='UPDATE' AND NEW.inventory_item_id IS DISTINCT FROM OLD.inventory_item_id THEN RAISE EXCEPTION 'Remove the part and add it again to change its inventory item'; END IF;
 iid := CASE WHEN TG_OP='DELETE' THEN OLD.inventory_item_id ELSE NEW.inventory_item_id END;
 IF iid IS NULL THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
 IF TG_OP <> 'DELETE' AND NEW.quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
 delta := CASE WHEN TG_OP='INSERT' THEN -NEW.quantity WHEN TG_OP='DELETE' THEN OLD.quantity ELSE OLD.quantity-NEW.quantity END;
 jid := CASE WHEN TG_OP='DELETE' THEN OLD.job_id ELSE NEW.job_id END;
 IF TG_OP='UPDATE' AND NEW.job_id <> OLD.job_id THEN RAISE EXCEPTION 'Cannot move an inventory part to another job'; END IF;
 PERFORM set_config('inventory.reason',CASE WHEN delta < 0 THEN 'Used on job' ELSE 'Returned from job' END,true);
 PERFORM set_config('inventory.job_id',jid::text,true);
 UPDATE public.inventory_items SET quantity=quantity+delta WHERE id=iid AND quantity+delta >= 0;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not enough inventory stock, or item unavailable'; END IF;
 PERFORM set_config('inventory.reason','',true); PERFORM set_config('inventory.job_id','',true);
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$;
CREATE TRIGGER job_parts_stock BEFORE INSERT OR UPDATE OR DELETE ON public.job_parts FOR EACH ROW EXECUTE FUNCTION public.inventory_job_part_stock();
CREATE OR REPLACE FUNCTION public.receive_inventory_order(order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ord public.inventory_orders;
BEGIN
 IF auth.uid() IS NULL OR public.is_demo_user() THEN RAISE EXCEPTION 'Team sign-in required'; END IF;
 SELECT * INTO ord FROM public.inventory_orders WHERE id=order_id FOR UPDATE;
 IF NOT FOUND OR ord.status <> 'ordered' THEN RAISE EXCEPTION 'Order unavailable or already received'; END IF;
 PERFORM set_config('inventory.reason','Received order',true);
 UPDATE public.inventory_items SET quantity=quantity+ord.quantity WHERE id=ord.item_id;
 UPDATE public.inventory_orders SET status='received',received_at=now(),received_by=auth.uid() WHERE id=order_id;
 PERFORM set_config('inventory.reason','',true);
END; $$;
REVOKE ALL ON FUNCTION public.receive_inventory_order(uuid) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.receive_inventory_order(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(item_id uuid, amount numeric, note text) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_demo_user() THEN RAISE EXCEPTION 'Team sign-in required'; END IF;
 IF amount=0 OR amount IS NULL THEN RAISE EXCEPTION 'Enter a nonzero adjustment'; END IF;
 PERFORM set_config('inventory.reason','Manual adjustment: ' || COALESCE(NULLIF(trim(note),''),'Stock count'),true);
 UPDATE public.inventory_items SET quantity=quantity+amount WHERE id=item_id AND quantity+amount >= 0;
 IF NOT FOUND THEN RAISE EXCEPTION 'Adjustment would make stock negative, or item unavailable'; END IF;
 PERFORM set_config('inventory.reason','',true);
END; $$;
REVOKE ALL ON FUNCTION public.adjust_inventory_stock(uuid,numeric,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid,numeric,text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.inventory_log_quantity() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.inventory_job_part_stock() FROM PUBLIC,anon,authenticated;