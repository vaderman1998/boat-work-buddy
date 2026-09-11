CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'demo@baengineworx.com'
  );
$$;

DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Non-demo users can manage all jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (NOT public.is_demo_user())
  WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Admins can manage all job parts" ON public.job_parts;
DROP POLICY IF EXISTS "Admins can view all job parts" ON public.job_parts;
CREATE POLICY "Non-demo users can manage all job parts" ON public.job_parts
  FOR ALL TO authenticated
  USING (NOT public.is_demo_user())
  WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Admins can manage all job notes" ON public.job_notes;
DROP POLICY IF EXISTS "Admins can view all job notes" ON public.job_notes;
CREATE POLICY "Non-demo users can manage all job notes" ON public.job_notes
  FOR ALL TO authenticated
  USING (NOT public.is_demo_user())
  WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Admins can manage all job time sessions" ON public.job_time_sessions;
DROP POLICY IF EXISTS "Admins can view all job time sessions" ON public.job_time_sessions;
CREATE POLICY "Non-demo users can manage all job time sessions" ON public.job_time_sessions
  FOR ALL TO authenticated
  USING (NOT public.is_demo_user())
  WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Non-demo users can manage customers" ON public.customers
  FOR ALL TO authenticated
  USING (NOT public.is_demo_user())
  WITH CHECK (NOT public.is_demo_user());