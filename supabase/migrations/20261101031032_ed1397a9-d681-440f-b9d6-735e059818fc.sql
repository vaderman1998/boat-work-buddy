CREATE OR REPLACE FUNCTION public.inventory_log_quantity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta numeric; jid uuid; jname text := ''; bname text := '';
BEGIN
 delta := NEW.quantity - CASE WHEN TG_OP='INSERT' THEN 0 ELSE OLD.quantity END;
 IF delta = 0 THEN RETURN NEW; END IF;
 jid := NULLIF(current_setting('inventory.job_id',true),'')::uuid;
 IF jid IS NOT NULL THEN
  SELECT customer_name,boat_name INTO jname,bname FROM public.jobs WHERE id=jid;
  IF NOT FOUND THEN
   jid:=NULL;
   jname:=COALESCE(current_setting('inventory.deleted_customer',true),'');
   bname:=COALESCE(current_setting('inventory.deleted_boat',true),'');
  END IF;
 END IF;
 INSERT INTO public.inventory_movements(item_id,change,quantity_after,reason,job_id,job_name,boat_name,actor_id,actor_name)
 VALUES(NEW.id,delta,NEW.quantity,COALESCE(NULLIF(current_setting('inventory.reason',true),''),CASE WHEN TG_OP='INSERT' THEN 'Opening stock' ELSE 'Manual adjustment' END),jid,COALESCE(jname,''),COALESCE(bname,''),auth.uid(),COALESCE(NULLIF(auth.jwt()->>'email',''),'Team member'));
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.inventory_deleted_job_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 PERFORM set_config('inventory.deleted_customer',OLD.customer_name,true);
 PERFORM set_config('inventory.deleted_boat',OLD.boat_name,true);
 RETURN OLD;
END; $$;
REVOKE ALL ON FUNCTION public.inventory_deleted_job_snapshot() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER inventory_job_delete_snapshot BEFORE DELETE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.inventory_deleted_job_snapshot();