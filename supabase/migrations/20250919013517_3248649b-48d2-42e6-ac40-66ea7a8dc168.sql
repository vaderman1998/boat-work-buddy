-- Restore original RLS policies since we're now using edge function for customer access
DROP POLICY IF EXISTS "Jobs are viewable by admins or with valid customer token" ON public.jobs;
DROP POLICY IF EXISTS "Job parts are viewable by admins or with valid customer token" ON public.job_parts;
DROP POLICY IF EXISTS "Job notes are viewable by admins or with valid customer token" ON public.job_notes;

-- Restore original policies for admin access only
CREATE POLICY "Admins can view all jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can view all job parts" 
ON public.job_parts 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can view all job notes" 
ON public.job_notes 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);