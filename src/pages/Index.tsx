import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Wrench, Calendar, Anchor, LogIn, LogOut } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { AddJobDialog } from "@/components/AddJobDialog";
import { useJobs } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import backgroundImage from "@/assets/marina-workshop.jpg";

const Index = () => {
  const { data: jobs = [], isLoading, error } = useJobs();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading jobs</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(job => job.status === "active");
  const completedJobs = jobs.filter(job => job.status === "completed");
  
  const totalRevenue = jobs.reduce((total, job) => {
    const laborCost = job.total_hours * job.hourly_rate;
    return total + laborCost;
  }, 0);
  
  const totalHours = jobs.reduce((total, job) => total + job.total_hours, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={backgroundImage} 
          alt="Marine Workshop" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maritime-deep/80 to-maritime-medium/60" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Anchor className="h-12 w-12 text-gold" />
                <h1 className="text-4xl font-bold">B & A Engine Worx</h1>
              </div>
              <p className="text-xl opacity-90">Professional Boat Engine Service & Repair</p>
            </div>
        </div>
        
        {/* Auth Controls */}
        <div className="absolute top-4 right-4">
          {user ? (
            <Button onClick={handleSignOut} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <LogIn className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Wrench className="h-4 w-4 text-maritime-medium" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeJobs.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Anchor className="h-4 w-4 text-maritime-medium" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{jobs.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-maritime-medium" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}h</div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">${totalRevenue.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {user ? "Job Management" : "Current Jobs"}
          </h2>
          {user && <AddJobDialog />}
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Jobs
              {activeJobs.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeJobs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Completed Jobs
              {completedJobs.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedJobs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Anchor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Jobs</h3>
                <p className="text-muted-foreground mb-4">
                  {user ? "Start by adding a new repair job to track your work." : "No active jobs at the moment."}
                </p>
                {user && <AddJobDialog />}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Jobs</h3>
                <p className="text-muted-foreground">
                  Completed jobs will appear here once you finish them.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;