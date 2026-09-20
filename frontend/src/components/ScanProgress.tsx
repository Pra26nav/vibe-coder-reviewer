import { useEffect, useState } from "react";
import { getStatus } from "@/api/client";
import type { ScanReport } from "@/types";

const STAGES = [
  { key: "queued", label: "Queued", detail: "Waiting for a scan slot to open up." },
  { key: "cloning", label: "Cloning repository", detail: "Pulling the latest code from GitHub." },
  { key: "scanning", label: "Scanning for vulnerabilities", detail: "Running static analysis across every file." },
  { key: "analyzing", label: "Verifying with AI", detail: "Confirming each flagged issue and writing plain-English explanations." },
  { key: "done", label: "Done", detail: "Report ready." },
];

function stageIndex(status: string) {
  const i = STAGES.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

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

  const idx = stageIndex(status);
  const current = STAGES[idx];
  const progressPct = ((idx + 1) / STAGES.length) * 100;

  return (
    <div className="w-full max-w-md mx-auto py-16 space-y-6">
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Step {idx + 1} of {STAGES.length}
        </p>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-foreground font-medium">{current.label}</p>
        <p className="text-sm text-muted-foreground">{current.detail}</p>
      </div>

      <div className="space-y-1.5">
        {STAGES.slice(0, -1).map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <div
              className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                i < idx ? "bg-[color:var(--color-clear)]" : i === idx ? "bg-primary animate-pulse" : "bg-border"
              }`}
            />
            <span className={i <= idx ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}