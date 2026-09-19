import type { ScanReport } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function startScan(repoUrl: string): Promise<ScanReport> {
  const form = new FormData();
  form.append("repo_url", repoUrl);
  const res = await fetch(`${API_URL}/scan`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Scan request failed: ${res.status}`);
  return res.json();
}

export async function startScanFromFile(file: File): Promise<ScanReport> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/scan`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Scan request failed: ${res.status}`);
  return res.json();
}

export async function getStatus(jobId: string): Promise<ScanReport> {
  const res = await fetch(`${API_URL}/status/${jobId}`);
  if (!res.ok) throw new Error(`Status request failed: ${res.status}`);
  return res.json();
}

export async function getReport(jobId: string): Promise<ScanReport> {
  const res = await fetch(`${API_URL}/report/${jobId}`);
  if (!res.ok) throw new Error(`Report request failed: ${res.status}`);
  return res.json();
}