ALTER TABLE public.jobs ADD COLUMN engine_make_model text NOT NULL DEFAULT '';
ALTER TABLE public.jobs ADD COLUMN engine_serial text NOT NULL DEFAULT '';