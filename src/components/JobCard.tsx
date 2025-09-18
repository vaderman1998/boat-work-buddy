import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Pause, Square, Clock, Anchor, Trash2, FileText, ChevronDown, Plus, Share2, Copy, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface JobNote {
  id: string;
  content: string;
  timestamp: Date;
}

export interface JobPart {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  timestamp: Date;
}

export interface Job {
  id: string;
  customerName: string;
  boatName: string;
  boatType: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  totalHours: number;
  hourlyRate: number;
  notes: JobNote[];
  parts: JobPart[];
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
  const [newNote, setNewNote] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [newPart, setNewPart] = useState({ name: "", cost: 0, quantity: 1 });
  const { toast } = useToast();

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

  const addNote = () => {
    if (newNote.trim()) {
      const note: JobNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        timestamp: new Date(),
      };
      onUpdateJob(job.id, { 
        notes: [...job.notes, note] 
      });
      setNewNote("");
    }
  };

  const addPart = () => {
    if (newPart.name.trim() && newPart.cost > 0 && newPart.quantity > 0) {
      const part: JobPart = {
        id: Date.now().toString(),
        name: newPart.name.trim(),
        cost: newPart.cost,
        quantity: newPart.quantity,
        timestamp: new Date(),
      };
      onUpdateJob(job.id, { 
        parts: [...job.parts, part] 
      });
      setNewPart({ name: "", cost: 0, quantity: 1 });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const copyJobLink = () => {
    const jobUrl = `${window.location.origin}/job/${job.id}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Customer job link has been copied to clipboard.",
      });
    });
  };

  const partsCost = job.parts.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
  const laborCost = (job.totalHours + (currentSession / 3600)) * job.hourlyRate;
  const totalCost = laborCost + partsCost;

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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={copyJobLink}
              title="Copy customer link"
            >
              <Share2 className="h-4 w-4" />
            </Button>
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
            <span>Labor: {job.totalHours.toFixed(2)}h</span>
            {currentSession > 0 && (
              <span className="text-primary">+ {formatTime(currentSession)}</span>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="font-medium">
              Total: ${totalCost.toFixed(2)}
            </div>
            {partsCost > 0 && (
              <div className="text-xs text-muted-foreground">
                Labor: ${laborCost.toFixed(2)} + Parts: ${partsCost.toFixed(2)}
              </div>
            )}
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

        {/* Parts Section */}
        <Collapsible open={partsOpen} onOpenChange={setPartsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span>Parts ({job.parts.length})</span>
                {partsCost > 0 && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    ${partsCost.toFixed(2)}
                  </span>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", partsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Add Part */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="partName" className="text-xs">Part Name</Label>
                  <Input
                    id="partName"
                    placeholder="e.g., Thermostat"
                    value={newPart.name}
                    onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="partCost" className="text-xs">Cost ($)</Label>
                  <Input
                    id="partCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newPart.cost || ""}
                    onChange={(e) => setNewPart(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="partQuantity" className="text-xs">Quantity</Label>
                  <Input
                    id="partQuantity"
                    type="number"
                    min="1"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="h-8"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={addPart} 
                    size="sm" 
                    disabled={!newPart.name.trim() || newPart.cost <= 0}
                    className="w-full h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Part
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Parts */}
            {job.parts.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {job.parts.map((part) => (
                  <div key={part.id} className="p-2 bg-muted rounded-md text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{part.name}</div>
                      <div className="text-right">
                        <div className="font-medium">${(part.cost * part.quantity).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {part.quantity}x ${part.cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(part.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Notes Section */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Notes ({job.notes.length})</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", notesOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Add Note */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this job..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <Button 
                onClick={addNote} 
                size="sm" 
                disabled={!newNote.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>

            {/* Existing Notes */}
            {job.notes.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {job.notes.map((note) => (
                  <div key={note.id} className="p-2 bg-muted rounded-md text-sm">
                    <div className="text-xs text-muted-foreground mb-1">
                      {formatDate(note.timestamp)}
                    </div>
                    <div>{note.content}</div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};