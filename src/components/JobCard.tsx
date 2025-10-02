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
import { useUpdateJob, useDeleteJob, useJobParts, useJobNotes, useAddJobPart, useAddJobNote, useUpdateJobPart, useUpdateJobNote, type Job } from "@/hooks/useJobs";
import { useTimeSessions, useCreateTimeSession } from "@/hooks/useTimeSessions";
import { TimeSessionCard } from "@/components/TimeSessionCard";
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
  const { data: timeSessions = [] } = useTimeSessions(job.id);
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const addPartMutation = useAddJobPart();
  const addNoteMutation = useAddJobNote();
  const updatePartMutation = useUpdateJobPart();
  const updateNoteMutation = useUpdateJobNote();
  const createTimeSessionMutation = useCreateTimeSession();

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  
  // Input states for adding notes, parts, and time sessions
  const [newNote, setNewNote] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [newSessionHours, setNewSessionHours] = useState("");
  const [newSessionMinutes, setNewSessionMinutes] = useState("");
  const [newManualLaborDesc, setNewManualLaborDesc] = useState("");
  const [newManualLaborHours, setNewManualLaborHours] = useState("");
  const [newManualLaborMinutes, setNewManualLaborMinutes] = useState("");
  const [newManualLaborCost, setNewManualLaborCost] = useState("");
  const [newPart, setNewPart] = useState({
    name: "",
    quantity: 1,
    cost_per_unit: 0
  });
  
  // Collapsible states
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTimeSessionsOpen, setIsTimeSessionsOpen] = useState(true); // Default open for time sessions
  const [isManualLaborOpen, setIsManualLaborOpen] = useState(true);
  
  // Edit states
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editPartData, setEditPartData] = useState({ name: "", quantity: 1, cost_per_unit: 0 });
  const [editNoteContent, setEditNoteContent] = useState("");
  const [isEditingHourlyRate, setIsEditingHourlyRate] = useState(false);
  const [editHourlyRate, setEditHourlyRate] = useState(job.hourly_rate);

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

  const addTimeSession = () => {
    if (!newSessionDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description for the time session',
        variant: 'destructive'
      });
      return;
    }

    const hours = parseInt(newSessionHours) || 0;
    const minutes = parseInt(newSessionMinutes) || 0;
    
    if (minutes >= 60) {
      toast({
        title: 'Error',
        description: 'Minutes must be less than 60',
        variant: 'destructive'
      });
      return;
    }

    const duration = (hours * 3600) + (minutes * 60);

    createTimeSessionMutation.mutate({
      jobId: job.id,
      description: newSessionDescription.trim(),
      hourlyRate: job.hourly_rate,
    }, {
      onSuccess: async (newSession) => {
        // If duration was specified, update the session with the duration
        if (duration > 0) {
          await supabase
            .from('job_time_sessions')
            .update({ duration })
            .eq('id', newSession.id);
        }
        
        setNewSessionDescription("");
        setNewSessionHours("");
        setNewSessionMinutes("");
        toast({
          title: 'Success',
          description: duration > 0 
            ? `Time session added with ${hours}h ${minutes}m` 
            : 'Time session added successfully',
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create time session",
          variant: "destructive",
        });
      },
    });
  };

  const addManualLabor = () => {
    if (!newManualLaborDesc.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description for the labor entry',
        variant: 'destructive'
      });
      return;
    }

    const flatCost = parseFloat(newManualLaborCost) || 0;
    
    if (flatCost <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a cost amount',
        variant: 'destructive'
      });
      return;
    }

    // Store as 1 hour with custom rate equal to the flat cost
    const duration = 3600; // 1 hour in seconds
    const customRate = flatCost; // Rate equals the total cost since duration is 1 hour

    createTimeSessionMutation.mutate({
      jobId: job.id,
      description: newManualLaborDesc.trim(),
      hourlyRate: customRate,
    }, {
      onSuccess: async (newSession) => {
        // Set the duration to 1 hour
        await supabase
          .from('job_time_sessions')
          .update({ duration })
          .eq('id', newSession.id);
        
        setNewManualLaborDesc("");
        setNewManualLaborCost("");
        toast({
          title: 'Success',
          description: `Manual labor entry added: $${flatCost.toFixed(2)}`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add manual labor entry",
          variant: "destructive",
        });
      },
    });
  };

  const completeJob = () => {
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
    const jobUrl = `${window.location.origin}/job/${job.customer_token}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
      toast({
        title: "Customer link copied!",
        description: "Secure customer viewing link has been copied to clipboard.",
      });
    });
  };

  const startEditingPart = (part: any) => {
    setEditingPartId(part.id);
    setEditPartData({
      name: part.name,
      quantity: part.quantity,
      cost_per_unit: part.cost_per_unit
    });
  };

  const cancelEditingPart = () => {
    setEditingPartId(null);
    setEditPartData({ name: "", quantity: 1, cost_per_unit: 0 });
  };

  const saveEditedPart = (id: string) => {
    if (editPartData.name.trim() && editPartData.quantity > 0 && editPartData.cost_per_unit >= 0) {
      updatePartMutation.mutate({
        id,
        name: editPartData.name.trim(),
        quantity: editPartData.quantity,
        cost_per_unit: editPartData.cost_per_unit
      }, {
        onSuccess: () => {
          setEditingPartId(null);
          setEditPartData({ name: "", quantity: 1, cost_per_unit: 0 });
        }
      });
    }
  };

  const startEditingNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditNoteContent("");
  };

  const saveEditedNote = (id: string) => {
    if (editNoteContent.trim()) {
      updateNoteMutation.mutate({
        id,
        content: editNoteContent.trim()
      }, {
        onSuccess: () => {
          setEditingNoteId(null);
          setEditNoteContent("");
        }
      });
    }
  };

  const startEditingHourlyRate = () => {
    setIsEditingHourlyRate(true);
    setEditHourlyRate(job.hourly_rate);
  };

  const cancelEditingHourlyRate = () => {
    setIsEditingHourlyRate(false);
    setEditHourlyRate(job.hourly_rate);
  };

  const saveEditedHourlyRate = () => {
    if (editHourlyRate > 0) {
      updateJobMutation.mutate({
        id: job.id,
        updates: { hourly_rate: editHourlyRate }
      }, {
        onSuccess: () => {
          setIsEditingHourlyRate(false);
        }
      });
    }
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
              title="Copy secure customer link"
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
            <span className="font-medium">Total Hours:</span>
            <p>{job.total_hours.toFixed(2)}h</p>
          </div>
          <div>
            <span className="font-medium">Labor Rate:</span>
            {isEditingHourlyRate && user ? (
              <div className="flex gap-1 items-center mt-1">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(parseFloat(e.target.value) || 0)}
                  className="h-7 w-24"
                />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelEditingHourlyRate}>
                  Cancel
                </Button>
                <Button size="sm" className="h-7 px-2" onClick={saveEditedHourlyRate}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p>${job.hourly_rate}/hour</p>
                {user && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={startEditingHourlyRate}
                  >
                    Edit
                  </Button>
                )}
              </div>
            )}
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

        {/* Complete Job Button - Only show for active jobs and authenticated users */}
        {job.status === "active" && user && (
          <div className="pt-4 border-t">
            <Button
              onClick={completeJob}
              variant="outline"
              className="w-full flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Job
            </Button>
          </div>
        )}

        {/* Time Sessions Section */}
        <Collapsible open={isTimeSessionsOpen} onOpenChange={setIsTimeSessionsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Time Sessions ({timeSessions.filter(s => s.start_time || s.duration === 0).length})</span>
              </div>
              {isTimeSessionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 p-2">
            {timeSessions.filter(s => s.start_time || s.duration === 0).map((session) => (
              <TimeSessionCard 
                key={session.id} 
                session={session} 
                isAuthenticated={!!user} 
              />
            ))}
            
            {/* Add Time Session Form - Only for authenticated users */}
            {user && (
              <div className="border-t pt-2 space-y-2">
                <Input
                  placeholder="Description (e.g., Engine repair, Hull cleaning)"
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTimeSession()}
                />
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={newSessionHours}
                      onChange={(e) => setNewSessionHours(e.target.value)}
                      className="w-20"
                      min="0"
                    />
                    <span className="text-sm">h</span>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={newSessionMinutes}
                      onChange={(e) => setNewSessionMinutes(e.target.value)}
                      className="w-20"
                      min="0"
                      max="59"
                    />
                    <span className="text-sm">m</span>
                  </div>
                  <Button onClick={addTimeSession} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Labor
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Leave hours/minutes blank to use timer later</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Manual Labor Section - For estimates and non-timer entries */}
        <Collapsible open={isManualLaborOpen} onOpenChange={setIsManualLaborOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Manual Labor Entries ({timeSessions.filter(s => !s.start_time).length})</span>
              </div>
              {isManualLaborOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 p-2">
            {timeSessions.filter(s => !s.start_time && s.duration > 0).map((entry) => (
              <Card key={entry.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm font-semibold text-primary">
                        ${((entry.duration / 3600) * (entry.hourly_rate || job.hourly_rate)).toFixed(2)}
                      </p>
                    </div>
                    {user && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-7 w-7 p-0"
                        onClick={() => {
                          if (window.confirm('Delete this labor entry?')) {
                            supabase
                              .from('job_time_sessions')
                              .delete()
                              .eq('id', entry.id)
                              .then(() => {
                                toast({
                                  title: 'Deleted',
                                  description: 'Labor entry removed'
                                });
                              });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add Manual Labor Form - Only for authenticated users */}
            {user && (
              <div className="border-t pt-2 space-y-2">
                <Input
                  placeholder="Labor description (e.g., Estimated engine work)"
                  value={newManualLaborDesc}
                  onChange={(e) => setNewManualLaborDesc(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addManualLabor()}
                />
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-medium whitespace-nowrap">Cost:</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newManualLaborCost}
                    onChange={(e) => setNewManualLaborCost(e.target.value)}
                    className="flex-1"
                    min="0"
                    step="0.01"
                  />
                  <Button onClick={addManualLabor} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Entry
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Enter a flat cost for estimates and fixed labor entries.</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

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
              <div key={part.id} className="p-2 bg-muted rounded space-y-2">
                {editingPartId === part.id ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Part Name</Label>
                        <Input
                          value={editPartData.name}
                          onChange={(e) => setEditPartData({ ...editPartData, name: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editPartData.quantity}
                          onChange={(e) => setEditPartData({ ...editPartData, quantity: parseInt(e.target.value) || 1 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Cost per Unit ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPartData.cost_per_unit}
                          onChange={(e) => setEditPartData({ ...editPartData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEditingPart}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEditedPart(part.id)}>
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{part.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {part.quantity} × ${part.cost_per_unit.toFixed(2)} = ${(part.quantity * part.cost_per_unit).toFixed(2)}
                      </p>
                    </div>
                    {user && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingPart(part)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                )}
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
              <div key={note.id} className="p-2 bg-muted rounded space-y-2">
                {editingNoteId === note.id ? (
                  <>
                    <Textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEditingNote}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEditedNote(note.id)}>
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                      {user && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingNote(note)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </>
                )}
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