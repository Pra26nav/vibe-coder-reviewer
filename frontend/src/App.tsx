import { useState } from "react";
import { InputPanel } from "@/components/InputPanel";
import { ScanProgress } from "@/components/ScanProgress";
import { ReportView } from "@/components/ReportView";
import { startScan, startScanFromFile } from "@/api/client";
import type { ScanReport } from "@/types";

type ViewState = "input" | "scanning" | "report";

function App() {
  const [view, setView] = useState<ViewState>("input");
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitUrl = async (url: string) => {
    setIsSubmitting(true);
    setError(null);
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

  const handleSubmitFile = async (file: File) => {
    setIsSubmitting(true);
    setError(null);
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-lg font-semibold text-foreground">Vibe Coder Reviewer</h1>
          <p className="text-sm text-muted-foreground">Security audit for AI-generated code, explained plainly.</p>
        </div>
      </header>

      <main className="px-4 py-12">
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

        {view === "report" && report && <ReportView report={report} onReset={reset} />}
      </main>
    </div>
  );
}

export default App;