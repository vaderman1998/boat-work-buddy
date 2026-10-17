import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateJob, type Job } from "@/hooks/useJobs";
import { toast } from "@/hooks/use-toast";

export function JobCreatedDate({ job, canEdit }: { job: Job; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const updateJob = useUpdateJob();
  const createdDate = parseISO(job.created_at);

  const changeDate = (date: Date | undefined) => {
    if (!date || updateJob.isPending) return;
    // Change the local calendar date without discarding the original time.
    const updated = new Date(createdDate);
    updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    updateJob.mutate(
      { id: job.id, updates: { created_at: updated.toISOString() } },
      { onSuccess: () => {
        setOpen(false);
        toast({ title: "Created date updated", description: format(date, "PPP") });
      } }
    );
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>Created: {format(createdDate, "MMM d, yyyy")}</span>
      {canEdit && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" aria-label={`Change created date for ${job.boat_name}`}>
              <CalendarIcon className="mr-1.5 h-4 w-4" />
              Change date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={createdDate} defaultMonth={createdDate} onSelect={changeDate} disabled={updateJob.isPending} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}