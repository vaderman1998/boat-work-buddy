-- Add hourly_rate column to job_time_sessions table
ALTER TABLE public.job_time_sessions 
ADD COLUMN hourly_rate NUMERIC DEFAULT 75.00;