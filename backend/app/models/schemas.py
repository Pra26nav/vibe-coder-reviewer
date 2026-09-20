from pydantic import BaseModel
from typing import Optional, Literal

Severity = Literal["low", "medium", "high", "critical"]
Category = Literal[
    "malicious_code",
    "sql_injection",
    "insecure_file_handling",
    "auth_missing",
    "authz_missing",
    "secret_exposure",
]

class ScanRequest(BaseModel):
    repo_url: Optional[str] = None  # zip upload handled separately via UploadFile

class Finding(BaseModel):
    id: str
    category: Category
    severity: Severity
    file_path: str
    line: Optional[int] = None
    plain_explanation: str
    example: str
    how_to_fix: str
    fix_code_hint: Optional[str] = None
    test_case: Optional[str] = None
    raw_snippet: Optional[str] = None

class FileNode(BaseModel):
    path: str
    role: Literal["frontend", "backend-api", "auth", "db", "config", "other"]
    imports: list[str] = []

class Recommendation(BaseModel):
    title: str
    effort: str
    impact: Literal["low", "medium", "high"]
    prompt: str


class ScanReport(BaseModel):
    job_id: str
    status: Literal["queued", "cloning", "scanning", "analyzing", "done", "failed"]
    score: Optional[float] = None
    verdict: Optional[str] = None
    findings: list[Finding] = []
    files: list[FileNode] = []
    mermaid: Optional[str] = None
    files_scanned: int = 0
    error: Optional[str] = None
    purpose: Optional[str] = None
    recommendations: list[Recommendation] = []
    repo_url: Optional[str] = None
