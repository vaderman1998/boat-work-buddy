-- Drop triggers first, then functions, then recreate with proper search_path
DROP TRIGGER IF EXISTS trigger_update_job_total_hours_insert ON public.job_time_sessions;
DROP TRIGGER IF EXISTS trigger_update_job_total_hours_update ON public.job_time_sessions;
DROP TRIGGER IF EXISTS trigger_update_job_total_hours_delete ON public.job_time_sessions;

DROP FUNCTION IF EXISTS calculate_job_total_hours(UUID);
DROP FUNCTION IF EXISTS update_job_total_hours();

-- Create function to calculate total hours from all sessions with proper search_path
CREATE OR REPLACE FUNCTION calculate_job_total_hours(job_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(
      CASE 
        WHEN end_time IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0
        ELSE 0
      END
    )
    FROM public.job_time_sessions 
    WHERE job_id = job_uuid), 
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function to update job total_hours when sessions change with proper search_path
CREATE OR REPLACE FUNCTION update_job_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the job's total_hours based on all its time sessions
  UPDATE public.jobs 
  SET total_hours = calculate_job_total_hours(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.job_id
      ELSE NEW.job_id
    END
  )
  WHERE id = (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.job_id
      ELSE NEW.job_id
    END
  );
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate triggers
CREATE TRIGGER trigger_update_job_total_hours_insert
AFTER INSERT ON public.job_time_sessions
FOR EACH ROW
EXECUTE FUNCTION update_job_total_hours();

CREATE TRIGGER trigger_update_job_total_hours_update
AFTER UPDATE ON public.job_time_sessions
FOR EACH ROW
EXECUTE FUNCTION update_job_total_hours();

CREATE TRIGGER trigger_update_job_total_hours_delete
AFTER DELETE ON public.job_time_sessions
FOR EACH ROW
EXECUTE FUNCTION update_job_total_hours();