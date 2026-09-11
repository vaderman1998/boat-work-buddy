import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/contexts/DemoContext';
import { demoStore } from '@/data/demoStore';

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

const scope = (isDemo: boolean) => (isDemo ? 'demo' : 'live');

// Hook to fetch time sessions for a job
export const useTimeSessions = (jobId: string) => {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ['time-sessions', scope(isDemoMode), jobId],
    queryFn: async () => {
      if (isDemoMode) return demoStore.listSessions(jobId);

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
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async ({ jobId, description, hourlyRate }: { 
      jobId: string; 
      description: string; 
      hourlyRate?: number;
    }) => {
      if (isDemoMode) return demoStore.createSession(jobId, description, hourlyRate || 150.0);

      const { data, error } = await supabase
        .from('job_time_sessions')
        .insert({
          job_id: jobId,
          description,
          hourly_rate: hourlyRate || 150.00,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TimeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Hook to update a time session
export const useUpdateTimeSession = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

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

      if (isDemoMode) return demoStore.updateSession(sessionId, updateData);

      const { data, error } = await supabase
        .from('job_time_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as TimeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Hook to start a timer (update start_time)
export const useStartTimer = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (isDemoMode) {
        return demoStore.updateSession(sessionId, {
          start_time: new Date().toISOString(),
          end_time: null,
        });
      }

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
    },
  });
};

// Hook to stop a timer (update end_time and accumulate duration)
export const useStopTimer = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (isDemoMode) {
        const current = demoStore.getSession(sessionId);
        let newDuration = current?.duration || 0;
        if (current?.start_time) {
          newDuration += (Date.now() - new Date(current.start_time).getTime()) / 1000;
        }
        return demoStore.updateSession(sessionId, {
          end_time: new Date().toISOString(),
          duration: newDuration,
        });
      }

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Hook to delete a time session
export const useDeleteTimeSession = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async ({ sessionId, jobId }: { sessionId: string; jobId: string }) => {
      if (isDemoMode) {
        demoStore.deleteSession(sessionId);
        return;
      }

      const { error } = await supabase
        .from('job_time_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
