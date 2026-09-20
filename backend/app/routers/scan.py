import uuid
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, HTTPException, Request

from app import storage
from app.db import save_scan
from app.services.cloner import clone_repo, extract_zip
from app.services.file_filter import collect_files, read_file_safe
from app.services.detectors import ALL_DETECTORS
from app.services.architecture import build_graph, to_mermaid
from app.services.scoring import compute_score
from app.models.schemas import ScanReport
from app.services.llm_client import explain_batch, generate_recommendations

router = APIRouter()

BATCH_SIZE = 4  # files per LLM explain call


@router.post("/scan", response_model=ScanReport)
async def start_scan(
    request: Request,
    background_tasks: BackgroundTasks,
    repo_url: str | None = Form(None),
    file: UploadFile | None = File(None),
):
    if not repo_url and not file:
        raise HTTPException(400, "provide repo_url or file")

    job_id = str(uuid.uuid4())[:12]
    storage.create_job(job_id)
    storage.update_job(job_id, repo_url=repo_url)


    user_id = request.session.get("user_id")
    print(f"[DEBUG] session user_id at scan start: {user_id}")
    zip_bytes = await file.read() if file else None
    background_tasks.add_task(run_pipeline, job_id, repo_url, zip_bytes, user_id)

    return storage.get_job(job_id)


@router.get("/status/{job_id}", response_model=ScanReport)
def get_status(job_id: str):
    job = storage.get_job(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return job


@router.get("/report/{job_id}", response_model=ScanReport)
def get_report(job_id: str):
    job = storage.get_job(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    if job.status != "done":
        raise HTTPException(409, f"job status is {job.status}, not done yet")
    return job

@router.post("/recommendations/{job_id}", response_model=ScanReport)
def get_recommendations(job_id: str, purpose: str | None = Form(None)):
    job = storage.get_job(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    if job.status != "done":
        raise HTTPException(409, f"job status is {job.status}, not done yet")

    recs = generate_recommendations(job.files, purpose)
    storage.update_job(job_id, recommendations=recs, purpose=purpose)
    return storage.get_job(job_id)

def run_pipeline(job_id: str, repo_url: str | None, zip_bytes: bytes | None, user_id: int | None = None):
    try:
        storage.update_job(job_id, status="cloning")
        root = clone_repo(job_id, repo_url) if repo_url else extract_zip(job_id, zip_bytes)

        storage.update_job(job_id, status="scanning")
        file_paths = collect_files(root)
        contents = {str(p.relative_to(root)): read_file_safe(p) for p in file_paths}

        # 1. regex/AST first pass - fast, free
        raw_hits = []
        for rel_path, content in contents.items():
            full_path = root / rel_path
            for detector in ALL_DETECTORS:
                hits = detector.scan(full_path, content)
                for h in hits:
                    h.file_path = rel_path
                raw_hits.extend(hits)

        # 2. LLM confirm + explain, batched
        storage.update_job(job_id, status="analyzing")
        print(f"[{job_id}] raw regex/AST hits: {len(raw_hits)}")
        for h in raw_hits[:15]:
            print(f"  - [{h.category}] {h.file_path}:{h.line} | {h.snippet[:100]}")
        findings = []
        for i in range(0, len(raw_hits), BATCH_SIZE):
            batch = raw_hits[i : i + BATCH_SIZE]
            findings.extend(explain_batch(batch))
        print(f"[{job_id}] confirmed findings after LLM: {len(findings)}")

        # 3. architecture graph
        nodes = build_graph(contents, root)
        try:
            mermaid = to_mermaid(nodes, findings)
        except Exception:
            mermaid = None  # frontend falls back to table view

        # 4. deterministic score
        score, verdict = compute_score(findings, len(contents))

        storage.update_job(
            job_id,
            status="done",
            score=score,
            verdict=verdict,
            findings=findings,
            files=nodes,
            mermaid=mermaid,
            files_scanned=len(contents),
        )

        if user_id:
            save_scan(
                scan_id=job_id,
                user_id=user_id,
                repo_url=repo_url or "(zip upload)",
                score=score,
                verdict=verdict,
                findings_count=len(findings),
            )
    except Exception as e:
        storage.update_job(job_id, status="failed", error=str(e))
