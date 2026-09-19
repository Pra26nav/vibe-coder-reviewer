import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FindingCard } from "@/components/FindingCard";
import { ArchitectureTab } from "@/components/ArchitectureTab";
import type { ScanReport } from "@/types";

function verdictColor(score: number) {
  if (score >= 7) return "text-[color:var(--color-clear)] border-[color:var(--color-clear)]";
  if (score >= 4) return "text-[color:var(--color-warning)] border-[color:var(--color-warning)]";
  return "text-[color:var(--color-critical)] border-[color:var(--color-critical)]";
}

export function ReportView({ report, onReset }: { report: ScanReport; onReset: () => void }) {
  const score = report.score ?? 0;
  const [tab] = useState("findings");

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
          <p className="text-lg font-semibold text-foreground">{report.verdict}</p>
          <p className="text-sm text-muted-foreground">
            {report.files_scanned} files scanned · {report.findings.length} findings
          </p>
        </div>
        <button onClick={onReset} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
          Scan another
        </button>
      </div>

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-3 mt-4">
          {report.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No issues found across the categories we check.</p>
          ) : (
            report.findings
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
              })
              .map((f) => <FindingCard key={f.id} finding={f} />)
          )}
        </TabsContent>

        <TabsContent value="architecture" className="mt-4">
          <ArchitectureTab mermaidCode={report.mermaid} files={report.files} />
        </TabsContent>
      </Tabs>
    </div>
  );
}