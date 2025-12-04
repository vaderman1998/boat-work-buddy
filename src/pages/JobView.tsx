import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Anchor, Clock, DollarSign, FileText, Play, Pause } from "lucide-react";
import { useJobByToken, useJobParts, useJobNotes } from "@/hooks/useJobs";
import backgroundImage from "@/assets/marina-workshop.jpg";

export default function JobView() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: customerData, isLoading: jobLoading, error: jobError } = useJobByToken(jobId || '');
  
  const job = customerData?.job;
  const parts = customerData?.parts || [];
  const notes = customerData?.notes || [];
  const timeSessions = customerData?.timeSessions || [];
  
  const isLoading = jobLoading;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job && !isLoading) {
    if (jobError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Anchor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This job link is invalid or has expired. Please contact B & A Engine Worx for a valid job link.
            </p>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Anchor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The job you're looking for doesn't exist or may have been removed.
          </p>
        </Card>
      </div>
    );
  }

  // Calculate costs
  const partsCost = parts.reduce((total, part) => total + (part.quantity * part.cost_per_unit), 0);
  const laborCost = job.total_hours * job.hourly_rate;
  const totalCost = partsCost + laborCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={backgroundImage} 
          alt="Marine Workshop" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maritime-deep/80 to-maritime-medium/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Anchor className="h-8 w-8 text-gold" />
              <h1 className="text-2xl font-bold">B & A Engine Worx</h1>
            </div>
            <p className="text-lg opacity-90">Job Status Update</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-16 relative z-10 max-w-4xl">
        {/* Customer Info Notice */}
        <div className="mb-6">
          <Card className="bg-card/95 backdrop-blur-sm border-maritime-medium/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-maritime-medium">
                <Anchor className="h-4 w-4" />
                <span className="text-sm font-medium">Job Status Portal - Updates automatically as work progresses</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Details Card */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Anchor className="h-6 w-6 text-maritime-medium" />
                  {job.boat_name}
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  Owner: {job.customer_name} • {job.boat_type}
                </p>
              </div>
              <Badge 
                variant={
                  job.status === "completed" ? "secondary" :
                  job.status === "active" ? "default" : "outline"
                }
                className="text-sm px-3 py-1"
              >
                {job.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Work Description</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            {/* Job Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Time Logged</p>
                <p className="font-semibold">{job.total_hours.toFixed(2)} hrs</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Labor Rate</p>
                <p className="font-semibold">${job.hourly_rate}/hr</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Parts Cost</p>
                <p className="font-semibold">${partsCost.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Current Total</p>
                <p className="font-semibold text-maritime-medium">${totalCost.toFixed(2)}</p>
              </div>
            </div>

            {/* Creation Date */}
            <div className="text-sm text-muted-foreground">
              Job started: {formatDate(job.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* Time Sessions Section */}
        {timeSessions && timeSessions.filter(s => s.start_time || s.duration === 0).length > 0 && (
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-maritime-medium" />
                <span>Time Sessions</span>
                <Badge variant="outline">{timeSessions.filter(s => s.start_time || s.duration === 0).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSessions.filter(s => s.start_time || s.duration === 0).map((session) => {
                  const isRunning = session.start_time && !session.end_time;
                  const duration = session.start_time && session.end_time 
                    ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000
                    : 0;
                  
                  return (
                    <div key={session.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{session.description}</h4>
                        {isRunning ? (
                          <Badge className="bg-green-500 text-white flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            Running
                          </Badge>
                        ) : session.start_time && session.end_time ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : (
                          <Badge variant="outline">Not Started</Badge>
                        )}
                      </div>
                      
                      {session.start_time && session.end_time && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <p>Started: {formatDate(session.start_time)}</p>
                          <p>Completed: {formatDate(session.end_time)}</p>
                          <p className="font-medium text-foreground">Duration: {formatTime(duration)}</p>
                        </div>
                      )}
                      
                      {isRunning && session.start_time && (
                        <div className="text-sm text-muted-foreground">
                          <p>Started: {formatDate(session.start_time)}</p>
                          <p className="font-medium text-green-600">⏱️ Timer currently running...</p>
                        </div>
                      )}
                      
                      {!session.start_time && (
                        <p className="text-sm text-muted-foreground">Timer not yet started</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Labor Entries Section */}
        {timeSessions && timeSessions.filter(s => !s.start_time && s.duration > 0).length > 0 && (
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-maritime-medium" />
                <span>Manual Labor Entries</span>
                <Badge variant="outline">{timeSessions.filter(s => !s.start_time && s.duration > 0).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSessions.filter(s => !s.start_time && s.duration > 0).map((entry) => {
                  const hours = Math.floor(entry.duration / 3600);
                  const minutes = Math.floor((entry.duration % 3600) / 60);
                  const cost = (entry.duration / 3600) * (entry.hourly_rate || job?.hourly_rate || 75);
                  
                  return (
                    <div key={entry.id} className="p-4 bg-muted rounded-lg border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{entry.description}</h4>
                        <Badge variant="secondary">Estimate</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{hours}h {minutes}m</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Rate: ${entry.hourly_rate || job?.hourly_rate || 75}/hr</p>
                          <p className="font-medium">${cost.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parts Used Section */}
        {parts && parts.length > 0 && (
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Parts Used</span>
                <Badge variant="outline">{parts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parts.map((part) => (
                  <div key={part.id} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{part.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {part.quantity} × ${part.cost_per_unit.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">${(part.quantity * part.cost_per_unit).toFixed(2)}</p>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-semibold">
                  <span>Total Parts Cost</span>
                  <span>${partsCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Notes Section */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Progress Notes</span>
              <Badge variant="outline">{notes ? notes.length : 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notes && notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-muted rounded-lg">
                    <p className="mb-2">{note.content}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No progress notes available for this job.</p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 p-4 text-sm text-muted-foreground">
          <p>This page updates automatically as work progresses on your boat.</p>
          <p className="mt-1">For questions, please contact B & A Engine Worx directly.</p>
        </div>
      </div>
    </div>
  );
};