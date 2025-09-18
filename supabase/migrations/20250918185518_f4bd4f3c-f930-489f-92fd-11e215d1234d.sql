-- Add secure token field to jobs table for customer access
ALTER TABLE public.jobs ADD COLUMN customer_token UUID DEFAULT gen_random_uuid();

-- Update existing jobs to have tokens
UPDATE public.jobs SET customer_token = gen_random_uuid() WHERE customer_token IS NULL;

-- Make token non-nullable
ALTER TABLE public.jobs ALTER COLUMN customer_token SET NOT NULL;

-- Create unique index on customer_token for performance
CREATE UNIQUE INDEX idx_jobs_customer_token ON public.jobs(customer_token);

-- Remove the insecure public read policy
DROP POLICY IF EXISTS "Jobs are publicly viewable" ON public.jobs;

-- Create secure policy for token-based access
CREATE POLICY "Jobs are viewable with valid token" 
ON public.jobs 
FOR SELECT 
USING (
  auth.role() = 'authenticated' OR 
  customer_token = (current_setting('request.jwt.claims', true)::json->>'customer_token')::uuid
);

-- Update RLS policies for job_parts to use token-based access
DROP POLICY IF EXISTS "Job parts are publicly viewable" ON public.job_parts;

CREATE POLICY "Job parts are viewable with valid job token" 
ON public.job_parts 
FOR SELECT 
USING (
  auth.role() = 'authenticated' OR 
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_parts.job_id 
    AND jobs.customer_token = (current_setting('request.jwt.claims', true)::json->>'customer_token')::uuid
  )
);

-- Update RLS policies for job_notes to use token-based access
DROP POLICY IF EXISTS "Job notes are publicly viewable" ON public.job_notes;

CREATE POLICY "Job notes are viewable with valid job token" 
ON public.job_notes 
FOR SELECT 
USING (
  auth.role() = 'authenticated' OR 
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_notes.job_id 
    AND jobs.customer_token = (current_setting('request.jwt.claims', true)::json->>'customer_token')::uuid
  )
);