import { useState } from "react";
import { ChevronDown, GitPullRequest, Loader2, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Finding } from "@/types";
import { applyFix } from "@/api/client";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-[color:var(--color-critical)]/10 text-[color:var(--color-critical)] border-[color:var(--color-critical)]/30",
  high: "bg-[color:var(--color-critical)]/10 text-[color:var(--color-critical)] border-[color:var(--color-critical)]/30",
  medium: "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30",
  low: "bg-[color:var(--color-clear)]/10 text-[color:var(--color-clear)] border-[color:var(--color-clear)]/30",
};

const FLAG_COLOR: Record<string, string> = {
  critical: "bg-[color:var(--color-critical)]",
  high: "bg-[color:var(--color-critical)]",
  medium: "bg-[color:var(--color-warning)]",
  low: "bg-[color:var(--color-clear)]",
};

const CATEGORY_LABELS: Record<string, string> = {
  malicious_code: "Malicious code",
  sql_injection: "SQL injection",
  insecure_file_handling: "Insecure file handling",
  auth_missing: "Missing authentication",
  authz_missing: "Missing authorization",
  secret_exposure: "Exposed secret",
};

function guessLanguage(filePath: string): string {
  if (filePath.endsWith(".py")) return "python";
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript";
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "javascript";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "yaml";
  return "text";
}

interface FindingCardProps {
  finding: Finding;
  jobId: string;
  canApplyFix: boolean;
}

export function FindingCard({ finding, jobId, canApplyFix }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const language = guessLanguage(finding.file_path);

  const handleApplyFix = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      const res = await applyFix(jobId, finding.id);
      setPrUrl(res.pr_url);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : "Failed to apply fix");
    } finally {
      setApplying(false);
    }
  };

  const handleCopy = async () => {
    if (!finding.fix_code_hint) return;
    try {
      await navigator.clipboard.writeText(finding.fix_code_hint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  return (
    <div className="flex border border-border rounded-md bg-card overflow-hidden transition-shadow hover:shadow-md">
      <div className={`w-1.5 shrink-0 ${FLAG_COLOR[finding.severity] || "bg-muted"}`} />
      <div className="flex-1 p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{CATEGORY_LABELS[finding.category] || finding.category}</p>
            <p className="text-xs text-muted-foreground font-mono">{finding.file_path}:{finding.line}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${SEVERITY_STYLES[finding.severity]}`}>
            {finding.severity}
          </span>
        </div>

        <p className="text-sm text-foreground">{finding.plain_explanation}</p>
        <p className="text-sm text-muted-foreground italic">{finding.example}</p>
        <p className="text-sm text-foreground"><span className="font-medium">Fix: </span>{finding.how_to_fix}</p>

        {finding.test_case && (
          <div className="bg-secondary rounded-md px-3 py-2 mt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">How to check the fix worked</p>
            <p className="text-sm text-foreground">{finding.test_case}</p>
          </div>
        )}

        {finding.fix_code_hint && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              Show before / after
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${expanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden space-y-2">
                {finding.raw_snippet && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-critical)] mb-1">
                      Before
                    </p>
                    <div className="rounded-md overflow-hidden border border-[color:var(--color-critical)]/30">
                      <SyntaxHighlighter
                        language={language}
                        style={oneDark}
                        customStyle={{ margin: 0, fontSize: "0.75rem", padding: "0.75rem" }}
                      >
                        {finding.raw_snippet}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-clear)] mb-1">
                    After
                  </p>
                  <div className="rounded-md overflow-hidden border border-[color:var(--color-clear)]/30">
                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      customStyle={{ margin: 0, fontSize: "0.75rem", padding: "0.75rem", paddingRight: "2.5rem" }}
                    >
                      {finding.fix_code_hint}
                    </SyntaxHighlighter>
                  </div>
                  <button
                    onClick={handleCopy}
                    title="Copy fix"
                    className="absolute top-6 right-2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {canApplyFix && (
          <div className="pt-2 border-t border-border mt-2">
            {prUrl ? (
              <a href={prUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <GitPullRequest size={14} />
                View pull request
              </a>
            ) : (
              <button
                onClick={handleApplyFix}
                disabled={applying}
                className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md disabled:opacity-60 transition-transform active:scale-95"
              >
                {applying ? <Loader2 size={14} className="animate-spin" /> : <GitPullRequest size={14} />}
                {applying ? "Opening PR..." : "Apply fix as PR"}
              </button>
            )}
            {applyError && <p className="text-xs text-destructive mt-1">{applyError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}