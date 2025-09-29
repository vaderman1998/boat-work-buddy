-- Update the calculate_job_total_hours function to use the duration field
-- instead of calculating from timestamps
CREATE OR REPLACE FUNCTION public.calculate_job_total_hours(job_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(duration / 3600.0)
    FROM public.job_time_sessions 
    WHERE job_id = job_uuid), 
    0
  );
END;
$function$;