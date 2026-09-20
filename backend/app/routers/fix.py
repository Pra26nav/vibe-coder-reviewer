from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app import storage
from app.db import get_user
from app.services.github_pr import apply_fix_as_pr
from app.services.llm_client import generate_fixed_file
from app.services.github_pr import parse_owner_repo, get_default_branch, get_file

router = APIRouter(prefix="/fix", tags=["fix"])


class ApplyFixRequest(BaseModel):
    job_id: str
    finding_id: str


@router.post("/apply")
async def apply_fix(body: ApplyFixRequest, request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(401, "sign in with GitHub to apply fixes")

    user = get_user(user_id)
    if not user:
        raise HTTPException(401, "user not found")

    job = storage.get_job(body.job_id)
    if not job or job.status != "done":
        raise HTTPException(404, "scan not found or not complete")

    if not job.repo_url:
        raise HTTPException(400, "this scan was from a zip upload - PRs require a GitHub repo")

    finding = next((f for f in job.findings if f.id == body.finding_id), None)
    if not finding:
        raise HTTPException(404, "finding not found")

    token = user["access_token"]
    owner, repo = parse_owner_repo(job.repo_url)

    import httpx
    async with httpx.AsyncClient(timeout=30.0) as client:
        default_branch = await get_default_branch(client, owner, repo, token)
        current_content, _ = await get_file(client, owner, repo, finding.file_path, default_branch, token)

    fixed_content = generate_fixed_file(
        full_file_content=current_content,
        category=finding.category,
        plain_explanation=finding.plain_explanation,
        how_to_fix=finding.how_to_fix,
        raw_snippet=finding.raw_snippet or "",
    )

    try:
        pr_url = await apply_fix_as_pr(
            repo_url=job.repo_url,
            file_path=finding.file_path,
            new_content=fixed_content,
            category=finding.category,
            plain_explanation=finding.plain_explanation,
            token=token,
        )
    except Exception as e:
        raise HTTPException(500, f"failed to create PR: {e}")

    return {"pr_url": pr_url}