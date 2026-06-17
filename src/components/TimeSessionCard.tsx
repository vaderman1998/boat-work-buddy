import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Pause, Trash2, Edit2, Check, X } from 'lucide-react';
import { TimeSession, useStartTimer, useStopTimer, useDeleteTimeSession, useUpdateTimeSession } from '@/hooks/useTimeSessions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TimeSessionCardProps {
  session: TimeSession;
  isAuthenticated: boolean;
}

export const TimeSessionCard = ({ session, isAuthenticated }: TimeSessionCardProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [editRate, setEditRate] = useState(session.hourly_rate?.toString() || "150.00");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(session.description);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState(Math.floor(session.duration / 3600).toString());
  const [editMinutes, setEditMinutes] = useState(Math.floor((session.duration % 3600) / 60).toString());
  const { toast } = useToast();
  
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();
  const deleteSessionMutation = useDeleteTimeSession();
  const updateSessionMutation = useUpdateTimeSession();

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

  const handleSaveRate = () => {
    const newRate = parseFloat(editRate);
    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid hourly rate.",
        variant: "destructive",
      });
      return;
    }

    updateSessionMutation.mutate(
      { sessionId: session.id, hourlyRate: newRate },
      {
        onSuccess: () => {
          setIsEditingRate(false);
          toast({
            title: "Rate updated",
            description: "Hourly rate has been updated successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update hourly rate.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditRate(session.hourly_rate?.toString() || "150.00");
    setIsEditingRate(false);
  };

  const handleSaveDescription = () => {
    if (!editDescription.trim()) {
      toast({
        title: "Invalid description",
        description: "Description cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    updateSessionMutation.mutate(
      { sessionId: session.id, description: editDescription },
      {
        onSuccess: () => {
          setIsEditingDescription(false);
          toast({
            title: "Description updated",
            description: "Timer description has been updated successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update description.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancelDescriptionEdit = () => {
    setEditDescription(session.description);
    setIsEditingDescription(false);
  };

  const handleSaveTime = () => {
    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    
    if (hours < 0 || minutes < 0 || minutes >= 60) {
      toast({
        title: "Invalid time",
        description: "Please enter valid hours and minutes.",
        variant: "destructive",
      });
      return;
    }

    const newDuration = (hours * 3600) + (minutes * 60);

    updateSessionMutation.mutate(
      { sessionId: session.id, duration: newDuration },
      {
        onSuccess: () => {
          setIsEditingTime(false);
          toast({
            title: "Time updated",
            description: "Timer duration has been updated successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update time.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancelTimeEdit = () => {
    setEditHours(Math.floor(session.duration / 3600).toString());
    setEditMinutes(Math.floor((session.duration % 3600) / 60).toString());
    setIsEditingTime(false);
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
        <div className="flex items-center justify-between gap-2">
          {isEditingDescription && isAuthenticated ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="flex-1"
                placeholder="Timer description"
              />
              <Button 
                onClick={handleSaveDescription} 
                size="sm" 
                variant="outline"
                disabled={updateSessionMutation.isPending}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button 
                onClick={handleCancelDescriptionEdit} 
                size="sm" 
                variant="outline"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{session.description}</CardTitle>
                {isAuthenticated && (
                  <Button 
                    onClick={() => setIsEditingDescription(true)} 
                    size="sm" 
                    variant="ghost"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {getStatusBadge()}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          {isEditingTime && isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-16 h-10 text-center"
                  min="0"
                  placeholder="0"
                />
                <span className="text-lg font-medium">h</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-16 h-10 text-center"
                  min="0"
                  max="59"
                  placeholder="0"
                />
                <span className="text-lg font-medium">m</span>
              </div>
              <Button 
                onClick={handleSaveTime} 
                size="sm" 
                variant="outline"
                disabled={updateSessionMutation.isPending}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button 
                onClick={handleCancelTimeEdit} 
                size="sm" 
                variant="outline"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(currentTime)}
                </div>
                {isAuthenticated && !isRunning && (
                  <Button 
                    onClick={() => setIsEditingTime(true)} 
                    size="sm" 
                    variant="ghost"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
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
            </>
          )}
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Hourly Rate:</span>
            {isEditingRate ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="w-20 h-8 text-sm"
                  step="0.01"
                  min="0"
                />
                <Button 
                  onClick={handleSaveRate} 
                  size="sm" 
                  variant="outline"
                  disabled={updateSessionMutation.isPending}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  onClick={handleCancelEdit} 
                  size="sm" 
                  variant="outline"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">${(session.hourly_rate || 150).toFixed(2)}/hr</span>
                <Button 
                  onClick={() => setIsEditingRate(true)} 
                  size="sm" 
                  variant="ghost"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};