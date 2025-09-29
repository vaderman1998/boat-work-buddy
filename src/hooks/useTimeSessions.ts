import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TimeSession {
  id: string;
  job_id: string;
  description: string;
  start_time: string | null;
  end_time: string | null;
  duration: number;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

// Hook to fetch time sessions for a job
export const useTimeSessions = (jobId: string) => {
  return useQuery({
    queryKey: ['time-sessions', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_time_sessions')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TimeSession[];
    },
    enabled: !!jobId,
  });
};

// Hook to create a new time session
export const useCreateTimeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, description, hourlyRate }: { 
      jobId: string; 
      description: string; 
      hourlyRate?: number;
    }) => {
      const { data, error } = await supabase
        .from('job_time_sessions')
        .insert({
          job_id: jobId,
          description,
          hourly_rate: hourlyRate || 75.00,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TimeSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions', data.job_id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Hook to update a time session
export const useUpdateTimeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, description, hourlyRate, duration }: { 
      sessionId: string; 
      description?: string; 
      hourlyRate?: number;
      duration?: number;
    }) => {
      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (hourlyRate !== undefined) updateData.hourly_rate = hourlyRate;
      if (duration !== undefined) updateData.duration = duration;

      const { data, error } = await supabase
        .from('job_time_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as TimeSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions', data.job_id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Hook to start a timer (update start_time)
export const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('job_time_sessions')
        .update({
          start_time: new Date().toISOString(),
          end_time: null,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as TimeSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions', data.job_id] });
    },
  });
};

// Hook to stop a timer (update end_time and accumulate duration)
export const useStopTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // First get the current session to calculate accumulated time
      const { data: session, error: fetchError } = await supabase
        .from('job_time_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate the duration for this session
      let newDuration = session.duration || 0;
      if (session.start_time) {
        const startTime = new Date(session.start_time).getTime();
        const endTime = Date.now();
        const sessionDuration = (endTime - startTime) / 1000; // seconds
        newDuration = (session.duration || 0) + sessionDuration;
      }

      const { data, error } = await supabase
        .from('job_time_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration: newDuration,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as TimeSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions', data.job_id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Hook to delete a time session
export const useDeleteTimeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, jobId }: { sessionId: string; jobId: string }) => {
      const { error } = await supabase
        .from('job_time_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};