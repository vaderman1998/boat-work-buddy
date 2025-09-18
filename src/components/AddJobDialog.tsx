import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { Job } from "./JobCard";

interface AddJobDialogProps {
  onAddJob: (job: Omit<Job, "id" | "createdAt">) => void;
}

export const AddJobDialog = ({ onAddJob }: AddJobDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    boatName: "",
    boatType: "",
    description: "",
    hourlyRate: 85,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddJob({
      ...formData,
      status: "pending",
      totalHours: 0,
    });
    setFormData({
      customerName: "",
      boatName: "",
      boatType: "",
      description: "",
      hourlyRate: 85,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-maritime-deep to-maritime-medium hover:from-maritime-medium hover:to-maritime-deep transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Repair Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boatName">Boat Name</Label>
              <Input
                id="boatName"
                value={formData.boatName}
                onChange={(e) => setFormData(prev => ({ ...prev, boatName: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boatType">Boat Type</Label>
              <Input
                id="boatType"
                value={formData.boatType}
                onChange={(e) => setFormData(prev => ({ ...prev, boatType: e.target.value }))}
                placeholder="e.g., Outboard, Inboard, Diesel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the repair work needed..."
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};