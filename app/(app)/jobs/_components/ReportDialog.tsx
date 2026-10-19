"use client";

import { Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert, Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, Select, Textarea, useToast } from "@/components/ui";
import { REPORT_REASONS } from "@/lib/jobs/schema";
import { reportJobAction } from "../actions";

export function ReportDialog({ jobId, title }: { jobId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SCAM_FEE");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await reportJobAction(jobId, reason, details);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setDetails("");
      toast({ tone: "success", title: "alreadyReported" in result && result.alreadyReported ? "You already reported this post" : "Thanks, we will review it" });
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" icon={<Flag size={16} />} aria-label={`Report ${title}`}>
          Report
        </Button>
      </DialogTrigger>
      <DialogContent title="Report this post" description="Reports are private. Three people reporting a post hides it until an admin has checked it.">
        <div className="flex flex-col gap-4">
          <Select id="report-reason" label="Reason" value={reason} onChange={(event) => setReason(event.target.value)}>
            {Object.entries(REPORT_REASONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Textarea id="report-details" label="Details (optional)" rows={3} maxLength={500} value={details} onChange={(event) => setDetails(event.target.value)} />
          {error && <Alert tone="error">{error}</Alert>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="danger" onClick={submit} loading={pending}>
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
