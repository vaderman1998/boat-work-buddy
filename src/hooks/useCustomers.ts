import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDemoMode } from '@/contexts/DemoContext';
import { demoStore } from '@/data/demoStore';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  boat_name: string;
  boat_type: string;
  engine_make_model: string;
  engine_serial: string;
  model_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

const scope = (isDemo: boolean) => (isDemo ? 'demo' : 'live');

export const useCustomers = () => {
  const { isDemoMode } = useDemoMode();

  return useQuery({
    queryKey: ['customers', scope(isDemoMode)],
    queryFn: async () => {
      if (isDemoMode) return demoStore.listCustomers();

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Customer[];
    },
  });
};

export const useSaveCustomer = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async (customer: CustomerInput & { id?: string }) => {
      if (isDemoMode) return demoStore.saveCustomer(customer);

      if (customer.id) {
        const { id, ...updates } = customer;
        const { data, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Customer;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving customer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) {
        demoStore.deleteCustomer(id);
        return;
      }

      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer removed' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing customer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
