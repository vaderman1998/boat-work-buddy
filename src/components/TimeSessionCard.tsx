import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2 } from 'lucide-react';
import { TimeSession, useStartTimer, useStopTimer, useDeleteTimeSession } from '@/hooks/useTimeSessions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TimeSessionCardProps {
  session: TimeSession;
  isAuthenticated: boolean;
}

export const TimeSessionCard = ({ session, isAuthenticated }: TimeSessionCardProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const deleteSessionMutation = useDeleteTimeSession();

  // Check if timer is currently running
  useEffect(() => {
    const running = session.start_time && !session.end_time;
    setIsRunning(!!running);
  }, [session.start_time, session.end_time]);

  // Update current time display
  useEffect(() => {
    let interval: number;

    if (isRunning && session.start_time) {
      interval = setInterval(() => {
        const start = new Date(session.start_time!).getTime();
        const now = Date.now();
        const elapsed = (now - start) / 1000; // seconds
        // Add any previously accumulated duration
        setCurrentTime(session.duration + elapsed);
      }, 1000) as unknown as number;
    } else {
      // Show accumulated duration (either paused or completed)
      setCurrentTime(session.duration);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, session.start_time, session.end_time, session.duration]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startTimerMutation.mutate(session.id, {
      onSuccess: () => {
        toast({
          title: 'Timer Started',
          description: `Started tracking time for "${session.description}"`,
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to start timer',
          variant: 'destructive',
        });
      },
    });
  };

  const handleStop = () => {
    stopTimerMutation.mutate(session.id, {
      onSuccess: () => {
        toast({
          title: 'Timer Stopped',
          description: `Stopped tracking time for "${session.description}"`,
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to stop timer',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this time session?')) {
      deleteSessionMutation.mutate(
        { sessionId: session.id, jobId: session.job_id },
        {
          onSuccess: () => {
            toast({
              title: 'Session Deleted',
              description: 'Time session has been deleted',
            });
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to delete session',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return <Badge className="bg-green-500 text-white">Running</Badge>;
    } else if (session.start_time && session.end_time) {
      return <Badge variant="secondary">Completed</Badge>;
    } else {
      return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{session.description}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(currentTime)}
          </div>
          
          {isAuthenticated && (
            <div className="flex gap-2">
              {!isRunning && (!session.start_time || session.end_time) ? (
                <Button onClick={handleStart} size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : isRunning ? (
                <Button onClick={handleStop} size="sm" variant="secondary" className="gap-2">
                  <Pause className="h-4 w-4" />
                  Stop
                </Button>
              ) : null}
              
              <Button
                onClick={handleDelete}
                size="sm"
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};