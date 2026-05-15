import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download, Anchor } from "lucide-react";
import { useJobs, useJobParts, useJobNotes } from "@/hooks/useJobs";
import { useTimeSessions } from "@/hooks/useTimeSessions";

export default function Invoice() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: parts = [], isLoading: partsLoading } = useJobParts(jobId || '');
  const { data: notes = [], isLoading: notesLoading } = useJobNotes(jobId || '');
  const { data: timeSessions = [], isLoading: timeSessionsLoading } = useTimeSessions(jobId || '');
  
  const job = jobs.find(j => j.id === jobId);
  const isLoading = jobsLoading || partsLoading || notesLoading || timeSessionsLoading;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Anchor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Cannot generate invoice for a job that doesn't exist.
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

  // Calculate costs
  const partsCost = parts.reduce((total, part) => total + (part.quantity * part.cost_per_unit), 0);
  const laborCost = timeSessions.reduce((total, session) => {
    const hours = session.duration / 3600;
    return total + (hours * session.hourly_rate);
  }, 0);
  const subtotal = partsCost + laborCost;
  const discountPercent = job.discount_percent || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxRate = job.tax_rate || 0;
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const totalAmount = discountedSubtotal + taxAmount;

  // Generate invoice number based on job ID and date
  const invoiceNumber = `INV-${job.id.slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const invoiceDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Print/Action Bar - Hidden in print */}
      <div className="no-print bg-card border-b px-4 py-3 flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Anchor className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">B & A Engine Worx LLC</h1>
            </div>
            <p className="text-muted-foreground">Professional Boat Engine Service & Repair</p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Email: steve@baengineworx.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
            <div className="text-sm">
              <p><span className="font-medium">Invoice #:</span> {invoiceNumber}</p>
              <p><span className="font-medium">Date:</span> {formatDate(invoiceDate)}</p>
              <p><span className="font-medium">Job #:</span> {job.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">{job.customer_name}</p>
            {job.customer_address && <p className="text-muted-foreground">{job.customer_address}</p>}
            {job.customer_phone && <p className="text-muted-foreground">{job.customer_phone}</p>}
            <p className="text-muted-foreground">Boat: {job.boat_name} ({job.boat_type})</p>
            {job.engine_make_model && <p className="text-muted-foreground">Engine: {job.engine_make_model}</p>}
            {job.model_number && <p className="text-muted-foreground">Model #: {job.model_number}</p>}
            {job.engine_serial && <p className="text-muted-foreground">Serial #: {job.engine_serial}</p>}
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Work Performed:</h3>
          <div className="bg-muted p-4 rounded-lg">
            <p>{job.description}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Job started: {formatDate(job.created_at)}
            </p>
            <p className="text-sm text-muted-foreground">
              Status: <span className="capitalize">{job.status}</span>
            </p>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Description</th>
                <th className="border border-border px-4 py-2 text-center">Qty</th>
                <th className="border border-border px-4 py-2 text-right">Rate</th>
                <th className="border border-border px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Time Sessions */}
              {timeSessions.map((session) => {
                const hours = session.duration / 3600; // Convert seconds to hours
                const sessionCost = hours * session.hourly_rate;
                return (
                  <tr key={session.id}>
                    <td className="border border-border px-4 py-2">
                      <div>
                        <p className="font-medium">Labor - {session.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.start_time && formatDate(session.start_time)}
                          {session.start_time && session.end_time && (
                            <span> - {formatDate(session.end_time)}</span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="border border-border px-4 py-2 text-center">{hours.toFixed(1)} hrs</td>
                    <td className="border border-border px-4 py-2 text-right">${session.hourly_rate.toFixed(2)}/hr</td>
                    <td className="border border-border px-4 py-2 text-right font-medium">${sessionCost.toFixed(2)}</td>
                  </tr>
                );
              })}
              
              {/* Parts */}
              {parts.map((part) => (
                <tr key={part.id}>
                  <td className="border border-border px-4 py-2">
                    <div>
                      <p className="font-medium">{part.name}</p>
                      <p className="text-sm text-muted-foreground">Replacement part</p>
                    </div>
                  </td>
                  <td className="border border-border px-4 py-2 text-center">{part.quantity}</td>
                  <td className="border border-border px-4 py-2 text-right">${part.cost_per_unit.toFixed(2)}</td>
                  <td className="border border-border px-4 py-2 text-right font-medium">
                    ${(part.quantity * part.cost_per_unit).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-t">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between py-2">
                  <span>Tax ({taxRate}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t font-bold">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              {job.payment_amount > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Payment Received:</span>
                  <span>-${job.payment_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t text-lg font-bold">
                <span>Balance Due:</span>
                <span>${Math.max(0, totalAmount - job.payment_amount).toFixed(2)}</span>
              </div>
              {(totalAmount - job.payment_amount) <= 0 && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                  <span className="text-2xl font-bold text-green-700">PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Work Notes */}
        {notes && notes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Work Notes:</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              {notes.map((note, index) => (
                <div key={note.id} className="text-sm">
                  <span className="font-medium">Note {index + 1}:</span> {note.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t text-sm text-muted-foreground">
          <p>Thank you for choosing B & A Engine Worx LLC for your marine engine needs!</p>
          <p className="mt-1">For questions about this invoice, please contact us at steve@baengineworx.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .bg-muted {
              background-color: #f1f5f9 !important;
            }
          }
        `
      }} />
    </div>
  );
}