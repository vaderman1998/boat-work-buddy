import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Job {
  id: string;
  customer_name: string;
  boat_name: string;
  boat_type: string;
  description: string;
  hourly_rate: number;
  status: 'active' | 'completed';
  total_hours: number;
  created_at: string;
  updated_at: string;
}

export interface JobPart {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  cost_per_unit: number;
  created_at: string;
}

export interface JobNote {
  id: string;
  job_id: string;
  content: string;
  created_at: string;
}

export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Job[];
    },
  });
};

export const useJobParts = (jobId: string) => {
  return useQuery({
    queryKey: ['job-parts', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_parts')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as JobPart[];
    },
  });
};

export const useJobNotes = (jobId: string) => {
  return useQuery({
    queryKey: ['job-notes', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_notes')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as JobNote[];
    },
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newJob: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert([newJob])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: "Job created successfully",
        description: "The new job has been added to your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Job> }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: "Job deleted successfully",
        description: "The job has been removed from your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAddJobPart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPart: Omit<JobPart, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('job_parts')
        .insert([newPart])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-parts', variables.job_id] });
    },
    onError: (error) => {
      toast({
        title: "Error adding part",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAddJobNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newNote: Omit<JobNote, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('job_notes')
        .insert([newNote])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-notes', variables.job_id] });
    },
    onError: (error) => {
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};