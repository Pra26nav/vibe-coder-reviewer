import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Copy, Check, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FindingCard } from "@/components/FindingCard";
import { ArchitectureTab } from "@/components/ArchitectureTab";
import { getRecommendations } from "@/api/client";
import type { ScanReport, Purpose, Recommendation } from "@/types";

function verdictColor(score: number) {
  if (score >= 7) return "text-[color:var(--color-clear)] border-[color:var(--color-clear)]";
  if (score >= 4) return "text-[color:var(--color-warning)] border-[color:var(--color-warning)]";
  return "text-[color:var(--color-critical)] border-[color:var(--color-critical)]";
}

function VerdictIcon({ score }: { score: number }) {
  if (score >= 7) return <ShieldCheck size={16} />;
  if (score >= 4) return <ShieldAlert size={16} />;
  return <ShieldX size={16} />;
}

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-[color:var(--color-clear)]/10 text-[color:var(--color-clear)] border-[color:var(--color-clear)]/30",
  medium: "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30",
  low: "bg-muted text-muted-foreground border-border",
};

const PURPOSES: { id: Purpose; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "project", label: "Project" },
  { id: "entertainment", label: "Entertainment" },
  { id: "other", label: "Other" },
];

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rec.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-fade-in-up opacity-0 border border-border rounded-md bg-card p-4 space-y-2.5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary shrink-0" />
          <p className="font-medium text-foreground text-sm">{rec.title}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${IMPACT_STYLES[rec.impact]}`}>
          {rec.impact} impact
        </span>
      </div>

      {rec.effort && (
        <p className="text-xs text-muted-foreground">Est. effort: {rec.effort}</p>
      )}

      <div className="relative">
        <p className="text-sm text-foreground font-mono bg-secondary rounded-md p-3 pr-9 leading-relaxed">
          {rec.prompt}
        </p>
        <button
          onClick={handleCopy}
          title="Copy prompt"
          className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

export function ReportView({
  report,
  onReset,
  initialPurpose,
}: {
  report: ScanReport;
  onReset: () => void;
  initialPurpose?: Purpose | null;
}) {
  const score = report.score ?? 0;
  const [tab] = useState("findings");
  const [purpose, setPurpose] = useState<Purpose | null>(initialPurpose ?? null);
  const [showCustom, setShowCustom] = useState(false);
  const [customPurpose, setCustomPurpose] = useState("");
  const [recs, setRecs] = useState<Recommendation[]>(report.recommendations || []);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const fetchRecs = useCallback(
    async (p: Purpose | null) => {
      setLoadingRecs(true);
      try {
        const updated = await getRecommendations(report.job_id, p);
        setRecs(updated.recommendations || []);
      } catch {
        setRecs([]);
      } finally {
        setLoadingRecs(false);
        setFetchedOnce(true);
      }
    },
    [report.job_id]
  );

  useEffect(() => {
    if (!fetchedOnce) fetchRecs(purpose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedFindings = [...report.findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-5">
        <div
          className={`animate-stamp shrink-0 h-20 w-20 rounded-full border-4 flex flex-col items-center justify-center rotate-[-8deg] ${verdictColor(score)}`}
        >
          <span className="text-2xl font-bold leading-none">{score.toFixed(1)}</span>
          <span className="text-[10px] uppercase tracking-wide">/ 10</span>
        </div>
        <div>
          <p className={`flex items-center gap-1.5 text-lg font-semibold ${verdictColor(score).split(" ")[0]}`}>
            <VerdictIcon score={score} />
            {report.verdict}
          </p>
          <p className="text-sm text-muted-foreground">
            {report.files_scanned} files scanned · {report.findings.length} findings
          </p>
        </div>
        <button
          onClick={onReset}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Scan another
        </button>
      </div>

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-3 mt-4">
          {sortedFindings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No issues found across the categories we check.</p>
          ) : (
            sortedFindings.map((f, i) => (
              <div key={f.id} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-in-up opacity-0">
                <FindingCard finding={f} jobId={report.job_id} canApplyFix={!!report.repo_url} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="architecture" className="mt-4">
          <ArchitectureTab mermaidCode={report.mermaid} files={report.files} />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">What's this project for?</p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.id === "other") {
                      const next = !showCustom;
                      setShowCustom(next);
                      if (!next) {
                        setPurpose(null);
                        fetchRecs(null);
                      }
                    } else {
                      setShowCustom(false);
                      const next = purpose === p.id ? null : p.id;
                      setPurpose(next);
                      fetchRecs(next);
                    }
                  }}
                  disabled={loadingRecs}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    (p.id === "other" ? showCustom : purpose === p.id)
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {showCustom && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  list="purpose-suggestions-report"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customPurpose.trim()) {
                      setPurpose(customPurpose.trim());
                      fetchRecs(customPurpose.trim());
                    }
                  }}
                  placeholder="e.g. education, portfolio, internal tool..."
                  className="flex-1 text-sm px-3 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <datalist id="purpose-suggestions-report">
                  <option value="education" />
                  <option value="portfolio" />
                  <option value="internal tool" />
                  <option value="hobby" />
                  <option value="research" />
                </datalist>
                <button
                  onClick={() => {
                    if (customPurpose.trim()) {
                      setPurpose(customPurpose.trim());
                      fetchRecs(customPurpose.trim());
                    }
                  }}
                  disabled={loadingRecs || !customPurpose.trim()}
                  className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md disabled:opacity-60"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {loadingRecs ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Generating suggestions...
            </div>
          ) : recs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No suggestions available.</p>
          ) : (
            <div className="space-y-2.5">
              {recs.map((r, i) => (
                <RecommendationCard key={i} rec={r} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
        <p>Findings are flagged by static analysis, then verified and explained by AI — always double-check before shipping a fix.</p>
        {report.repo_url && <a href={report.repo_url.replace(/\.git$/, "")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0 ml-4">View source repo</a>}
      </div>
    </div>
  );
}