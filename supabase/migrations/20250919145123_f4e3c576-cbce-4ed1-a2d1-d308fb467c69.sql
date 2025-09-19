-- Create table for job time sessions to track multiple timers per job
CREATE TABLE public.job_time_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  description TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_time_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage all job time sessions" 
ON public.job_time_sessions 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can view all job time sessions" 
ON public.job_time_sessions 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_job_time_sessions_updated_at
BEFORE UPDATE ON public.job_time_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update jobs table to calculate total_hours from time sessions
-- Create function to calculate total hours from all sessions
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
$$ LANGUAGE plpgsql;

-- Create trigger function to update job total_hours when sessions change
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
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update job total_hours
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