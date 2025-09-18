import { useState } from "react";
import { JobCard, type Job } from "@/components/JobCard";
import { AddJobDialog } from "@/components/AddJobDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Clock, DollarSign, Anchor } from "lucide-react";
import marinaBg from "@/assets/marina-workshop.jpg";

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: "1",
      customerName: "John Smith",
      boatName: "Sea Breeze",
      boatType: "Outboard Motor",
      description: "Engine overheating issue, need to replace thermostat and check cooling system",
      status: "in-progress",
      totalHours: 2.5,
      hourlyRate: 85,
      createdAt: new Date(2024, 0, 15),
    },
    {
      id: "2",
      customerName: "Marina Del Rey",
      boatName: "Ocean Explorer",
      boatType: "Diesel Inboard",
      description: "Fuel injector cleaning and engine tune-up required",
      status: "pending",
      totalHours: 0,
      hourlyRate: 95,
      createdAt: new Date(2024, 0, 16),
    },
  ]);

  const addJob = (newJob: Omit<Job, "id" | "createdAt">) => {
    const job: Job = {
      ...newJob,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setJobs(prev => [job, ...prev]);
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ));
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const activeJobs = jobs.filter(job => job.status !== "completed");
  const completedJobs = jobs.filter(job => job.status === "completed");
  const totalRevenue = jobs.reduce((sum, job) => sum + (job.totalHours * job.hourlyRate), 0);
  const totalHours = jobs.reduce((sum, job) => sum + job.totalHours, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={marinaBg} 
          alt="Marine Workshop" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maritime-deep/80 to-maritime-medium/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Anchor className="h-12 w-12 text-gold" />
              <h1 className="text-4xl font-bold">Marina Engine Repair</h1>
            </div>
            <p className="text-xl opacity-90">Professional Boat Engine Service & Repair</p>
          </div>
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
          <h2 className="text-2xl font-bold text-primary">Job Management</h2>
          <AddJobDialog onAddJob={addJob} />
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
                  Start by adding a new repair job to track your work.
                </p>
                <AddJobDialog onAddJob={addJob} />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeJobs.map(job => (
                  <JobCard key={job.id} job={job} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
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
                  <JobCard key={job.id} job={job} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
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