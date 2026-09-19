import { useEffect, useState } from "react";
import { getStatus } from "@/api/client";
import type { ScanReport } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  cloning: "Cloning repository",
  analyzing: "Scanning for vulnerabilities",
  done: "Done",
  failed: "Failed",
};

interface ScanProgressProps {
  jobId: string;
  onComplete: (report: ScanReport) => void;
  onFailed: (error: string) => void;
}

export function ScanProgress({ jobId, onComplete, onFailed }: ScanProgressProps) {
  const [status, setStatus] = useState<string>("queued");

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const report = await getStatus(jobId);
        if (cancelled) return;
        setStatus(report.status);
        if (report.status === "done") {
          onComplete(report);
        } else if (report.status === "failed") {
          onFailed(report.error || "Scan failed for an unknown reason.");
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 2000);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [jobId, onComplete, onFailed]);

  return (
    <div className="w-full max-w-xl mx-auto text-center space-y-4 py-16">
      <div className="inline-block h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-foreground font-medium">{STAGE_LABELS[status] || status}</p>
      <p className="text-sm text-muted-foreground">This can take a minute on larger repos.</p>
    </div>
  );
}