import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ClipboardList, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUpdateJob, type Job } from "@/hooks/useJobs";
import { toast } from "@/hooks/use-toast";

interface ActiveJobsSummaryProps {
  jobs: Job[];
  canEdit: boolean;
}

export const ActiveJobsSummary: React.FC<ActiveJobsSummaryProps> = ({ jobs, canEdit }) => {
  const updateJob = useUpdateJob();
  const [openId, setOpenId] = useState<string | null>(null);

  if (jobs.length === 0) return null;

  const totalHours = jobs.reduce((t, j) => t + (j.total_hours || 0), 0);
  const scheduledCount = jobs.filter((j) => j.scheduled_date).length;

  const handleDate = (jobId: string, date: Date | undefined) => {
    const value = date ? format(date, "yyyy-MM-dd") : null;
    updateJob.mutate(
      { id: jobId, updates: { scheduled_date: value } },
      {
        onSuccess: () => {
          setOpenId(null);
          toast({
            title: value ? "Date scheduled" : "Date cleared",
            description: value ? `Scheduled for ${format(date!, "PPP")}` : "Scheduled date removed.",
          });
        },
      }
    );
  };

  // Sort: scheduled first by date asc, then unscheduled by created_at desc
  const sorted = [...jobs].sort((a, b) => {
    if (a.scheduled_date && b.scheduled_date) return a.scheduled_date.localeCompare(b.scheduled_date);
    if (a.scheduled_date) return -1;
    if (b.scheduled_date) return 1;
    return 0;
  });

  return (
    <Card className="mb-6 bg-card/95 backdrop-blur-sm shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-maritime-medium" />
            Active Jobs Summary
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{jobs.length} active</Badge>
            <Badge variant="secondary">{totalHours.toFixed(1)}h logged</Badge>
            <Badge variant="secondary">{scheduledCount} scheduled</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y">
          {sorted.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3 py-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`job-card-${job.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    el.classList.add("ring-2", "ring-maritime-medium", "rounded-lg");
                    setTimeout(() => {
                      el.classList.remove("ring-2", "ring-maritime-medium", "rounded-lg");
                    }, 1600);
                  }
                }}
                className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity cursor-pointer"
                aria-label={`Jump to ${job.boat_name} job card`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Wrench className="h-3.5 w-3.5 text-maritime-medium shrink-0" />
                  <span className="font-medium truncate underline-offset-2 hover:underline">{job.boat_name}</span>
                  <span className="text-muted-foreground text-sm truncate">— {job.customer_name}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate ml-5">
                  {job.description || job.boat_type} • {job.total_hours.toFixed(1)}h
                </p>
              </button>
              <Popover
                open={openId === job.id}
                onOpenChange={(o) => canEdit && setOpenId(o ? job.id : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canEdit}
                    className={cn(
                      "h-8 gap-1.5 text-xs whitespace-nowrap",
                      !job.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {job.scheduled_date
                      ? format(parseISO(job.scheduled_date), "MMM d, yyyy")
                      : "Set date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={job.scheduled_date ? parseISO(job.scheduled_date) : undefined}
                    onSelect={(d) => handleDate(job.id, d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  {job.scheduled_date && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleDate(job.id, undefined)}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
