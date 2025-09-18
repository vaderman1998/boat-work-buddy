import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Pause, Square, Clock, Anchor, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Job {
  id: string;
  customerName: string;
  boatName: string;
  boatType: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  totalHours: number;
  hourlyRate: number;
  createdAt: Date;
}

interface JobCardProps {
  job: Job;
  onUpdateJob: (id: string, updates: Partial<Job>) => void;
  onDeleteJob: (id: string) => void;
}

export const JobCard = ({ job, onUpdateJob, onDeleteJob }: JobCardProps) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && sessionStart) {
      interval = setInterval(() => {
        setCurrentSession(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sessionStart]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setSessionStart(new Date());
    onUpdateJob(job.id, { status: "in-progress" });
  };

  const pauseTimer = () => {
    if (sessionStart) {
      const sessionHours = currentSession / 3600;
      onUpdateJob(job.id, { totalHours: job.totalHours + sessionHours });
    }
    setIsTimerRunning(false);
    setCurrentSession(0);
    setSessionStart(null);
  };

  const completeJob = () => {
    if (isTimerRunning && sessionStart) {
      const sessionHours = currentSession / 3600;
      onUpdateJob(job.id, { 
        totalHours: job.totalHours + sessionHours,
        status: "completed"
      });
    } else {
      onUpdateJob(job.id, { status: "completed" });
    }
    setIsTimerRunning(false);
    setCurrentSession(0);
    setSessionStart(null);
  };

  const totalCost = (job.totalHours + (currentSession / 3600)) * job.hourlyRate;

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg",
      job.status === "in-progress" && "ring-2 ring-primary shadow-lg",
      job.status === "completed" && "opacity-75"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-maritime-medium" />
            <CardTitle className="text-lg">{job.boatName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              job.status === "completed" ? "secondary" :
              job.status === "in-progress" ? "default" : "outline"
            }>
              {job.status.replace("-", " ")}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Job</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the job for "{job.boatName}"? 
                    This action cannot be undone and will remove all tracked time and data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDeleteJob(job.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Job
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {job.customerName} • {job.boatType}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm">{job.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Total: {job.totalHours.toFixed(2)}h</span>
            {currentSession > 0 && (
              <span className="text-primary">+ {formatTime(currentSession)}</span>
            )}
          </div>
          <div className="font-medium">
            ${totalCost.toFixed(2)}
          </div>
        </div>

        {job.status !== "completed" && (
          <div className="flex gap-2">
            {!isTimerRunning ? (
              <Button onClick={startTimer} size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Start Timer
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="secondary" size="sm" className="flex-1">
                <Pause className="h-4 w-4 mr-1" />
                Pause Timer
              </Button>
            )}
            
            <Button 
              onClick={completeJob} 
              variant="outline" 
              size="sm"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Square className="h-4 w-4 mr-1" />
              Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};