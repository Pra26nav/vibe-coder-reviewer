"""
In-memory job store. Good enough for 24hr hackathon.
Swap for Redis if you have spare hours (you won't).
"""
from threading import Lock
from app.models.schemas import ScanReport

_jobs: dict[str, ScanReport] = {}
_lock = Lock()

def create_job(job_id: str) -> ScanReport:
    report = ScanReport(job_id=job_id, status="queued")
    with _lock:
        _jobs[job_id] = report
    return report

def get_job(job_id: str) -> ScanReport | None:
    with _lock:
        return _jobs.get(job_id)

def update_job(job_id: str, **fields) -> None:
    with _lock:
        job = _jobs[job_id]
        updated = job.model_copy(update=fields)
        _jobs[job_id] = updated
