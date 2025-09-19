-- Fix RLS policies to allow direct token-based access for customers
-- This allows customers to view jobs, parts, and notes using their customer token
-- without requiring authentication

-- Drop existing policies that rely on JWT claims
DROP POLICY IF EXISTS "Jobs are viewable with valid token" ON public.jobs;
DROP POLICY IF EXISTS "Job parts are viewable with valid job token" ON public.job_parts;  
DROP POLICY IF EXISTS "Job notes are viewable with valid job token" ON public.job_notes;

-- Create new policies that allow direct token-based access
CREATE POLICY "Jobs are viewable by admins or with valid customer token" 
ON public.jobs 
FOR SELECT 
USING (
  auth.role() = 'authenticated'::text OR 
  customer_token::text = current_setting('request.customer_token', true)
);

CREATE POLICY "Job parts are viewable by admins or with valid customer token" 
ON public.job_parts 
FOR SELECT 
USING (
  auth.role() = 'authenticated'::text OR 
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_parts.job_id 
    AND jobs.customer_token::text = current_setting('request.customer_token', true)
  )
);

CREATE POLICY "Job notes are viewable by admins or with valid customer token" 
ON public.job_notes 
FOR SELECT 
USING (
  auth.role() = 'authenticated'::text OR 
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_notes.job_id 
    AND jobs.customer_token::text = current_setting('request.customer_token', true)
  )
);