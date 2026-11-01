DO $$
DECLARE item uuid; job uuid; part uuid; ord uuid; q numeric; caught boolean := false;
BEGIN
 BEGIN
  PERFORM set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","email":"inventory-test@example.invalid","role":"authenticated"}',true);
  INSERT INTO public.inventory_items(name,quantity,minimum_stock) VALUES ('Inventory transaction test',10,2) RETURNING id INTO item;
  INSERT INTO public.jobs(customer_name,boat_name,boat_type,description) VALUES ('Inventory transaction test','Test Boat','Test','Test') RETURNING id INTO job;
  INSERT INTO public.job_parts(job_id,name,quantity,cost_per_unit,inventory_item_id) VALUES(job,'Test part',3,1,item) RETURNING id INTO part;
  SELECT quantity INTO q FROM public.inventory_items WHERE id=item; IF q<>7 THEN RAISE EXCEPTION 'Job deduction failed'; END IF;
  UPDATE public.job_parts SET quantity=2 WHERE id=part;
  SELECT quantity INTO q FROM public.inventory_items WHERE id=item; IF q<>8 THEN RAISE EXCEPTION 'Part edit stock failed'; END IF;
  DELETE FROM public.job_parts WHERE id=part;
  SELECT quantity INTO q FROM public.inventory_items WHERE id=item; IF q<>10 THEN RAISE EXCEPTION 'Part deletion stock failed'; END IF;
  INSERT INTO public.inventory_orders(item_id,quantity) VALUES(item,4) RETURNING id INTO ord;
  PERFORM public.receive_inventory_order(ord);
  SELECT quantity INTO q FROM public.inventory_items WHERE id=item; IF q<>14 THEN RAISE EXCEPTION 'Receiving failed'; END IF;
  BEGIN PERFORM public.receive_inventory_order(ord); EXCEPTION WHEN OTHERS THEN caught:=true; END;
  IF NOT caught THEN RAISE EXCEPTION 'Duplicate receipt allowed'; END IF;
  INSERT INTO public.job_parts(job_id,name,quantity,cost_per_unit,inventory_item_id) VALUES(job,'Test part',2,1,item);
  DELETE FROM public.jobs WHERE id=job;
  SELECT quantity INTO q FROM public.inventory_items WHERE id=item; IF q<>14 THEN RAISE EXCEPTION 'Job deletion stock failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.inventory_movements WHERE item_id=item AND reason='Returned from job' AND boat_name='Test Boat') THEN RAISE EXCEPTION 'Boat history missing'; END IF;
  BEGIN
   PERFORM public.adjust_inventory_stock(item,-100,'Test');
   RAISE EXCEPTION 'Negative stock accepted';
  EXCEPTION WHEN OTHERS THEN
   IF SQLERRM='Negative stock accepted' THEN RAISE; END IF;
  END;
  RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='Inventory transaction tests passed; rollback test records';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN RAISE NOTICE 'Inventory transaction tests passed; no test records retained';
 END;
END $$;