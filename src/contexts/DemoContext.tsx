import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEMO_EMAIL = "demo@baengineworx.com";

interface DemoContextType {
  isDemoMode: boolean;
  isDemoAccount: boolean;
  setDemoMode: (value: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    const check = (email?: string | null) => {
      const demo = (email ?? "").toLowerCase() === DEMO_EMAIL;
      setIsDemoAccount(demo);
      if (demo) setIsDemoMode(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session?.user?.email);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      check(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setDemoMode = (value: boolean) => {
    // The demo account is locked into sample data and can never leave demo mode.
    if (isDemoAccount) {
      setIsDemoMode(true);
      return;
    }
    setIsDemoMode(value);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, isDemoAccount, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoProvider");
  }
  return context;
};
