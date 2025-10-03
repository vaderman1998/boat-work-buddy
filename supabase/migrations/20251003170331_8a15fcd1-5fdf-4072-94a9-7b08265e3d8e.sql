-- Add payment_amount column to jobs table to track partial payments
ALTER TABLE public.jobs 
ADD COLUMN payment_amount numeric NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.jobs.payment_amount IS 'Amount paid towards the job invoice';