import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ScanRow {
  id: string;
  repo_url: string;
  score: number;
  verdict: string;
  findings_count: number;
  created_at: string;
}

function verdictColor(score: number) {
  if (score >= 7) return "text-[color:var(--color-clear)]";
  if (score >= 4) return "text-[color:var(--color-warning)]";
  return "text-[color:var(--color-critical)]";
}

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanRow[] | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/scans`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setScans(data.scans))
      .catch(() => setScans([]));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Scan history</h1>
          <p className="text-sm text-muted-foreground">Past audits tied to your account.</p>
        </div>
        <Link to="/" className="text-sm text-primary hover:underline">
          New scan
        </Link>
      </div>

      {scans === null && <p className="text-sm text-muted-foreground">Loading...</p>}

      {scans !== null && scans.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-md">
          No scans yet. Run one from the home page while signed in.
        </p>
      )}

      {scans !== null && scans.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Repository</th>
                <th className="text-left px-4 py-2 font-medium">Score</th>
                <th className="text-left px-4 py-2 font-medium">Verdict</th>
                <th className="text-left px-4 py-2 font-medium">Findings</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs truncate max-w-[200px]">{s.repo_url}</td>
                  <td className={`px-4 py-2 font-medium ${verdictColor(s.score)}`}>{s.score.toFixed(1)}</td>
                  <td className="px-4 py-2">{s.verdict}</td>
                  <td className="px-4 py-2">{s.findings_count}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {new Date(s.created_at + "Z").toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}