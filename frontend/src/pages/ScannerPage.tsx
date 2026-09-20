import { useState } from "react";
import { ShieldCheck, Cpu, Lock } from "lucide-react";
import { InputPanel } from "@/components/InputPanel";
import { ScanProgress } from "@/components/ScanProgress";
import { ReportView } from "@/components/ReportView";
import { startScan, startScanFromFile } from "@/api/client";
import type { ScanReport, Purpose } from "@/types";

type ViewState = "input" | "scanning" | "report";

function ScannerPage() {
  const [view, setView] = useState<ViewState>("input");
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purpose, setPurpose] = useState<Purpose | null>(null);

  const handleSubmitUrl = async (url: string, p: Purpose | null) => {
    setIsSubmitting(true);
    setError(null);
    setPurpose(p);
    try {
      const res = await startScan(url);
      setJobId(res.job_id);
      setView("scanning");
    } catch {
      setError("Couldn't reach the scan service. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFile = async (file: File, p: Purpose | null) => {
    setIsSubmitting(true);
    setError(null);
    setPurpose(p);
    try {
      const res = await startScanFromFile(file);
      setJobId(res.job_id);
      setView("scanning");
    } catch {
      setError("Couldn't reach the scan service. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setView("input");
    setJobId(null);
    setReport(null);
    setError(null);
  };

  return (
    <main className="px-4 py-12 min-h-screen flex flex-col">
      <div className="flex-1">
        {view === "input" && (
          <>
            <InputPanel onSubmitUrl={handleSubmitUrl} onSubmitFile={handleSubmitFile} isSubmitting={isSubmitting} />
            {error && <p className="text-center text-sm text-destructive mt-4">{error}</p>}
          </>
        )}

        {view === "scanning" && jobId && (
          <ScanProgress
            jobId={jobId}
            onComplete={(r) => {
              setReport(r);
              setView("report");
            }}
            onFailed={(err) => {
              setError(err);
              setView("input");
            }}
          />
        )}

        {view === "report" && report && <ReportView report={report} onReset={reset} initialPurpose={purpose} />}
      </div>

      {view === "input" && (
        <div className="max-w-xl mx-auto w-full mt-16 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Cpu size={13} />
              Verified by Groq AI
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Static analysis + AI review
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={13} />
              Your code stays in your repo — nothing is stored
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

export default ScannerPage;