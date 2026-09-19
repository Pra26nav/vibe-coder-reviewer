import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import type { FileEntry } from "@/types";

mermaid.initialize({ startOnLoad: false, theme: "neutral" });

const ROLE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  "backend-api": "Backend / API",
  auth: "Auth",
  db: "Database",
  config: "Config",
  other: "Other",
};

export function ArchitectureTab({ mermaidCode, files }: { mermaidCode: string | null; files: FileEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    if (!mermaidCode) return;
    let cancelled = false;
    mermaid
      .render(`arch-${Date.now()}`, mermaidCode)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setRenderFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  if (!mermaidCode || renderFailed) {
    return (
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">File</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium">Imports</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.path} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{f.path}</td>
                <td className="px-4 py-2">{ROLE_LABELS[f.role] || f.role}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{f.imports.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="blueprint-grid rounded-md border border-border p-6 overflow-x-auto">
      <div ref={ref} dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
    </div>
  );
}