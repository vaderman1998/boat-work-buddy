import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, Play, Pause, CheckCircle, Trash2, ChevronDown, ChevronRight, Plus, Package, FileText, Copy, Anchor, Share2, Receipt } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUpdateJob, useDeleteJob, useJobParts, useJobNotes, useAddJobPart, useAddJobNote, type Job } from "@/hooks/useJobs";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  // Queries and mutations
  const { data: parts = [] } = useJobParts(job.id);
  const { data: notes = [] } = useJobNotes(job.id);
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const addPartMutation = useAddJobPart();
  const addNoteMutation = useAddJobNote();

  // Authentication state
  const [user, setUser] = useState<User | null>(null);

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  
  // Input states for adding notes and parts
  const [newNote, setNewNote] = useState("");
  const [newPart, setNewPart] = useState({
    name: "",
    quantity: 1,
    cost_per_unit: 0
  });
  
  // Collapsible states
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Check authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
  };

  const pauseTimer = () => {
    if (sessionStart) {
      const sessionTime = (new Date().getTime() - sessionStart.getTime()) / (1000 * 60 * 60); // Convert to hours
      const newTotalHours = job.total_hours + currentSession + sessionTime;
      updateJobMutation.mutate({ id: job.id, updates: { total_hours: newTotalHours } });
    }
    setIsTimerRunning(false);
    setCurrentSession(0);
    setSessionStart(null);
  };

  const completeJob = () => {
    if (isTimerRunning) {
      pauseTimer();
    }
    updateJobMutation.mutate({ id: job.id, updates: { status: "completed" } });
  };

  const addNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate({
        job_id: job.id,
        content: newNote.trim()
      });
      setNewNote("");
    }
  };

  const addPart = () => {
    if (newPart.name.trim() && newPart.quantity > 0 && newPart.cost_per_unit >= 0) {
      addPartMutation.mutate({
        job_id: job.id,
        name: newPart.name.trim(),
        quantity: newPart.quantity,
        cost_per_unit: newPart.cost_per_unit
      });
      setNewPart({
        name: "",
        quantity: 1,
        cost_per_unit: 0
      });
    }
  };

  // Calculate costs
  const partsCost = parts.reduce((total, part) => total + (part.quantity * part.cost_per_unit), 0);
  const laborCost = job.total_hours * job.hourly_rate;
  const totalCost = partsCost + laborCost;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyJobLink = () => {
    const jobUrl = `${window.location.origin}/job/${job.id}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Job link has been copied to clipboard.",
      });
    });
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg",
      job.status === "active" && "ring-2 ring-primary shadow-lg",
      job.status === "completed" && "opacity-75"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{job.boat_name}</CardTitle>
            <p className="text-muted-foreground">{job.customer_name} • {job.boat_type}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={job.status === "active" ? "default" : "secondary"}>
              {job.status}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={copyJobLink}
              title="Copy customer link"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              title="Generate invoice"
              asChild
            >
              <Link to={`/invoice/${job.id}`}>
                <Receipt className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm">{job.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Time Logged:</span>
            <p>{formatTime(job.total_hours + currentSession)}</p>
          </div>
          <div>
            <span className="font-medium">Labor Rate:</span>
            <p>${job.hourly_rate}/hour</p>
          </div>
          <div>
            <span className="font-medium">Parts Cost:</span>
            <p>${partsCost.toFixed(2)}</p>
          </div>
          <div>
            <span className="font-medium">Total Cost:</span>
            <p className="font-bold">${totalCost.toFixed(2)}</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          Created: {formatDate(job.created_at)}
        </p>

        {/* Timer Controls - Only show for authenticated users */}
        {user && job.status === "active" && (
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
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
          </div>
        )}

        {/* Admin Actions - Only show for authenticated users */}
        {user && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              asChild
            >
              <Link to={`/invoice/${job.id}`}>
                <Receipt className="h-4 w-4 mr-1" />
                Invoice
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the job and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteJobMutation.mutate(job.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Parts Section */}
        <Collapsible open={isPartsOpen} onOpenChange={setIsPartsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Parts Used ({parts.length})</span>
              </div>
              {isPartsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 p-2">
            {parts.map((part) => (
              <div key={part.id} className="flex justify-between items-center p-2 bg-muted rounded">
                <div>
                  <p className="font-medium">{part.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {part.quantity} × ${part.cost_per_unit.toFixed(2)} = ${(part.quantity * part.cost_per_unit).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Add new part form - Only show for authenticated users */}
            {user && (
              <div className="border-t pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="partName" className="text-xs">Part Name</Label>
                    <Input
                      id="partName"
                      placeholder="Part name"
                      value={newPart.name}
                      onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partQuantity" className="text-xs">Quantity</Label>
                    <Input
                      id="partQuantity"
                      type="number"
                      min="1"
                      value={newPart.quantity}
                      onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="partCost" className="text-xs">Cost per Unit ($)</Label>
                    <Input
                      id="partCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPart.cost_per_unit}
                      onChange={(e) => setNewPart({ ...newPart, cost_per_unit: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={addPart}
                    disabled={addPartMutation.isPending}
                    className="mt-4"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {addPartMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Notes Section */}
        <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Progress Notes ({notes.length})</span>
              </div>
              {isNotesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 p-2">
            {notes.map((note) => (
              <div key={note.id} className="p-2 bg-muted rounded">
                <p className="text-sm">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(note.created_at)}
                </p>
              </div>
            ))}
            
            {/* Add new note form - Only show for authenticated users */}
            {user && (
              <div className="border-t pt-2 space-y-2">
                <Textarea
                  placeholder="Add a progress note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={addNote}
                  disabled={addNoteMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};