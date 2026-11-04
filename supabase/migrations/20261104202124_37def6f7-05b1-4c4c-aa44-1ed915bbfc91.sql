ALTER TABLE public.inventory_items ADD COLUMN barcode text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX inventory_items_barcode_unique ON public.inventory_items (barcode) WHERE barcode <> '';
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_barcode_trimmed CHECK (barcode = btrim(barcode));