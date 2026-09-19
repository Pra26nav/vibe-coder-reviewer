import shutil
import zipfile
from pathlib import Path
import git
from app.config import WORK_DIR


def clone_repo(job_id: str, repo_url: str) -> Path:
    dest = WORK_DIR / job_id / "src"
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)
    git.Repo.clone_from(repo_url, dest, depth=1)  # shallow clone, speed matters
    return dest


def extract_zip(job_id: str, zip_bytes: bytes) -> Path:
    dest = WORK_DIR / job_id / "src"
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)
    zip_path = WORK_DIR / job_id / "upload.zip"
    zip_path.write_bytes(zip_bytes)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(dest)
    zip_path.unlink()
    return dest


def cleanup_job(job_id: str) -> None:
    job_dir = WORK_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)
