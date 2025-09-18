import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Anchor, Clock, DollarSign, FileText, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import type { Job } from "@/components/JobCard";
import marinaBg from "@/assets/marina-workshop.jpg";

const JobView = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from an API or database
    // For now, we'll get it from localStorage or use mock data
    const mockJobs: Job[] = [
      {
        id: "1",
        customerName: "John Smith",
        boatName: "Sea Breeze",
        boatType: "Outboard Motor",
        description: "Engine overheating issue, need to replace thermostat and check cooling system",
        status: "in-progress",
        totalHours: 2.5,
        hourlyRate: 85,
        notes: [
          {
            id: "note-1",
            content: "Removed thermostat - found it was stuck closed. Water pump looks good.",
            timestamp: new Date(2024, 0, 15, 10, 30),
          },
          {
            id: "note-2", 
            content: "Installed new thermostat. Testing cooling system - temperature running normal now.",
            timestamp: new Date(2024, 0, 15, 14, 15),
          }
        ],
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
        notes: [],
        createdAt: new Date(2024, 0, 16),
      },
    ];

    const foundJob = mockJobs.find(j => j.id === jobId);
    setJob(foundJob || null);
  }, [jobId]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Anchor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The job you're looking for doesn't exist or may have been removed.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalCost = job.totalHours * job.hourlyRate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-maritime-light">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={marinaBg} 
          alt="Marine Workshop" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maritime-deep/80 to-maritime-medium/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Anchor className="h-8 w-8 text-gold" />
              <h1 className="text-2xl font-bold">Marina Engine Repair</h1>
            </div>
            <p className="text-lg opacity-90">Job Status Update</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-16 relative z-10 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" asChild className="bg-card/95 backdrop-blur-sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Job Details Card */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Anchor className="h-6 w-6 text-maritime-medium" />
                  {job.boatName}
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  Owner: {job.customerName} • {job.boatType}
                </p>
              </div>
              <Badge 
                variant={
                  job.status === "completed" ? "secondary" :
                  job.status === "in-progress" ? "default" : "outline"
                }
                className="text-sm px-3 py-1"
              >
                {job.status.replace("-", " ").toUpperCase()}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-maritime-medium" />
                <div>
                  <div className="font-medium">{job.totalHours.toFixed(1)} Hours</div>
                  <div className="text-sm text-muted-foreground">Time Logged</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-gold" />
                <div>
                  <div className="font-medium">${job.hourlyRate}/hr</div>
                  <div className="text-sm text-muted-foreground">Labor Rate</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-gold" />
                <div>
                  <div className="font-medium">${totalCost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Current Total</div>
                </div>
              </div>
            </div>

            {/* Creation Date */}
            <div className="text-sm text-muted-foreground">
              Job started: {formatDate(job.createdAt)}
            </div>
          </CardContent>
        </Card>

        {/* Progress Notes */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Progress Notes ({job.notes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.notes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Updates Yet</h3>
                <p className="text-muted-foreground">
                  Progress notes will appear here as work is completed on your boat.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {job.notes.map((note, index) => (
                  <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">
                        Update #{job.notes.length - index}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatShortDate(note.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 p-4 text-sm text-muted-foreground">
          <p>This page updates automatically as work progresses on your boat.</p>
          <p className="mt-1">For questions, please contact Marina Engine Repair directly.</p>
        </div>
      </div>
    </div>
  );
};

export default JobView;