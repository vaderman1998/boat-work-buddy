-- Add paid column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN paid boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.jobs.paid IS 'Indicates whether the job invoice has been paid';