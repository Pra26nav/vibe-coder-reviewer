import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Finding } from "@/types";

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

export function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex border border-border rounded-md bg-card overflow-hidden">
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

        {finding.fix_code_hint && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              Show technical details
            </button>
            {expanded && (
              <pre className="mt-2 bg-secondary rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {finding.fix_code_hint}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}