export interface Finding {
  id: string;
  category: "malicious_code" | "sql_injection" | "insecure_file_handling" | "auth_missing" | "authz_missing" | "secret_exposure";
  severity: "low" | "medium" | "high" | "critical";
  file_path: string;
  line: number;
  plain_explanation: string;
  example: string;
  how_to_fix: string;
  fix_code_hint: string | null;
  test_case: string | null;
  raw_snippet: string;
}

export interface FileEntry {
  path: string;
  role: "frontend" | "backend-api" | "auth" | "db" | "config" | "other";
  imports: string[];
}

export type ScanStatus = "queued" | "cloning" | "analyzing" | "done" | "failed";

export interface Recommendation {
  title: string;
  effort: string;
  impact: "low" | "medium" | "high";
  prompt: string;
}

export interface ScanReport {
  job_id: string;
  status: ScanStatus;
  score: number | null;
  verdict: string | null;
  findings: Finding[];
  files: FileEntry[];
  mermaid: string | null;
  files_scanned: number;
  error: string | null;
  purpose: string | null;
  recommendations: Recommendation[];
}

export type Purpose = "business" | "project" | "entertainment" | "other" | (string & {});

export type Platform = "github" | "lovable" | "replit" | "bolt";