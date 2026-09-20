import type { ScanReport } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function startScan(repoUrl: string): Promise<ScanReport> {
  const form = new FormData();
  form.append("repo_url", repoUrl);
  const res = await fetch(`${API_URL}/scan`, { method: "POST", body: form, credentials: "include" });
  if (!res.ok) throw new Error(`Scan request failed: ${res.status}`);
  return res.json();
}

export async function startScanFromFile(file: File): Promise<ScanReport> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/scan`, { method: "POST", body: form, credentials: "include" });
  if (!res.ok) throw new Error(`Scan request failed: ${res.status}`);
  return res.json();
}

export async function getStatus(jobId: string): Promise<ScanReport> {
  const res = await fetch(`${API_URL}/status/${jobId}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Status request failed: ${res.status}`);
  return res.json();
}

export async function getReport(jobId: string): Promise<ScanReport> {
  const res = await fetch(`${API_URL}/report/${jobId}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Report request failed: ${res.status}`);
  return res.json();
}

export async function getRecommendations(jobId: string, purpose: string | null): Promise<ScanReport> {
  const form = new FormData();
  if (purpose) form.append("purpose", purpose);
  const res = await fetch(`${API_URL}/recommendations/${jobId}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Recommendations request failed: ${res.status}`);
  return res.json();
}

export async function applyFix(jobId: string, findingId: string): Promise<{ pr_url: string }> {
  const res = await fetch(`${API_URL}/fix/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, finding_id: findingId }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to apply fix" }));
    throw new Error(err.detail || `Apply fix failed: ${res.status}`);
  }
  return res.json();
}