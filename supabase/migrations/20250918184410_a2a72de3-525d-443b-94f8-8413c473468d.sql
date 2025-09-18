-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for profiles timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for jobs - allow authenticated admins full access, keep public read for customer links
DROP POLICY IF EXISTS "Jobs are publicly accessible" ON public.jobs;

CREATE POLICY "Admins can manage all jobs" 
ON public.jobs 
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Jobs are publicly viewable" 
ON public.jobs 
FOR SELECT 
USING (true);

-- Update RLS policies for job_parts - allow authenticated admins full access, keep public read for invoices
DROP POLICY IF EXISTS "Job parts are publicly accessible" ON public.job_parts;

CREATE POLICY "Admins can manage all job parts" 
ON public.job_parts 
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Job parts are publicly viewable" 
ON public.job_parts 
FOR SELECT 
USING (true);

-- Update RLS policies for job_notes - allow authenticated admins full access, keep public read for customer links
DROP POLICY IF EXISTS "Job notes are publicly accessible" ON public.job_notes;

CREATE POLICY "Admins can manage all job notes" 
ON public.job_notes 
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Job notes are publicly viewable" 
ON public.job_notes 
FOR SELECT 
USING (true);