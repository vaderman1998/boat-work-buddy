import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDemoMode } from '@/contexts/DemoContext';
import { demoStore } from '@/data/demoStore';

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
  customer_token: string;
  paid: boolean;
  payment_amount: number;
  tax_rate: number;
  customer_address: string;
  customer_phone: string;
  engine_make_model: string;
  engine_serial: string;
  model_number: string;
  discount_percent: number;
  scheduled_date?: string | null;
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

const scope = (isDemo: boolean) => (isDemo ? 'demo' : 'live');

export const useJobs = () => {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ['jobs', scope(isDemoMode)],
    queryFn: async () => {
      if (isDemoMode) return demoStore.listJobs();

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
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ['job-parts', scope(isDemoMode), jobId],
    queryFn: async () => {
      if (isDemoMode) return demoStore.listParts(jobId);

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
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ['job-notes', scope(isDemoMode), jobId],
    queryFn: async () => {
      if (isDemoMode) return demoStore.listNotes(jobId);

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
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async (newJob: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'customer_token' | 'paid' | 'payment_amount'>) => {
      if (isDemoMode) return demoStore.createJob(newJob as Partial<Job>);

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
        description: isDemoMode
          ? "Demo job added. It disappears when you reload."
          : "The new job has been added to your dashboard.",
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
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Job> }) => {
      if (isDemoMode) return demoStore.updateJob(id, updates);

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
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) {
        demoStore.deleteJob(id);
        return;
      }

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
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async (newPart: Omit<JobPart, 'id' | 'created_at'>) => {
      if (isDemoMode) return demoStore.addPart(newPart);

      const { data, error } = await supabase
        .from('job_parts')
        .insert([newPart])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-parts'] });
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
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async (newNote: Omit<JobNote, 'id' | 'created_at'>) => {
      if (isDemoMode) return demoStore.addNote(newNote);

      const { data, error } = await supabase
        .from('job_notes')
        .insert([newNote])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-notes'] });
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

export const useUpdateJobPart = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      quantity, 
      cost_per_unit 
    }: { 
      id: string; 
      name: string; 
      quantity: number; 
      cost_per_unit: number;
    }) => {
      if (isDemoMode) return demoStore.updatePart(id, { name, quantity, cost_per_unit });

      const { data, error } = await supabase
        .from('job_parts')
        .update({ name, quantity, cost_per_unit })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-parts'] });
      toast({
        title: "Part updated",
        description: "Part has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating part",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteJobPart = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async ({ id, job_id }: { id: string; job_id: string }) => {
      if (isDemoMode) {
        demoStore.deletePart(id);
        return { id, job_id };
      }

      const { error } = await supabase
        .from('job_parts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, job_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-parts'] });
      toast({
        title: "Part removed",
        description: "Part has been removed from the job.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing part",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateJobNote = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();
  
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (isDemoMode) return demoStore.updateNote(id, content);

      const { data, error } = await supabase
        .from('job_notes')
        .update({ content })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-notes'] });
      toast({
        title: "Note updated",
        description: "Progress note has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useJobByToken = (token: string) => {
  return useQuery({
    queryKey: ['job-by-token', token],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-job', {
        body: { token }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    enabled: !!token,
  });
};
